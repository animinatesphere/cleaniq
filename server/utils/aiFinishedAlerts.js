// Emails the team when the AI receptionist finishes talking to someone, so they can review it:
//   - phone: when the call ends (caller hangs up or is transferred)
//   - WhatsApp: when the chat goes quiet for CHAT_IDLE_MS after the AI's last reply
// Sent to EMAIL_USER (the same inbox as other admin alerts). Admins can switch WhatsApp alerts
// off with the "ai_chat_finished" automation toggle.
const { sendEmail } = require("./emailService");
const ScheduledTask = require("../models/ScheduledTask");

const CHAT_IDLE_MS = 10 * 60 * 1000;
const ADMIN_URL = "https://www.cleaniqservices.com/admin/ai";
const adminEmail = () => process.env.EMAIL_USER || "info@cleaniqservices.com";

const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ukTime = (d) => new Date(d).toLocaleString("en-GB", { timeZone: "Europe/London", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// What the AI did, from the tool records (booking made, quote sent, enquiry saved…).
function outcomes(entries) {
  const done = [];
  for (const e of entries) for (const t of e.tools || []) if (t.ok && t.detail) done.push(t.detail);
  return [...new Set(done)];
}

function emailHtml({ heading, who, facts, lines, did, link, linkLabel }) {
  return `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#0f172a">
  <h2 style="color:#0F6B4C;margin:0 0 6px">${esc(heading)}</h2>
  <p style="margin:0 0 14px;color:#475569">${esc(who)}</p>
  <table style="font-size:14px;margin-bottom:14px">${facts.map(([k, v]) => `<tr><td style="color:#64748b;padding:2px 12px 2px 0">${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`).join("")}</table>
  ${did.length ? `<p style="margin:0 0 6px;font-weight:bold">What the receptionist did</p><ul style="margin:0 0 14px;padding-left:18px">${did.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>` : ""}
  <p style="margin:0 0 6px;font-weight:bold">Last messages</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:13px;line-height:1.5">
    ${lines.map((l) => `<p style="margin:0 0 6px"><strong>${l.role === "customer" ? "Customer" : l.role === "staff" ? "Team" : "Receptionist"}:</strong> ${esc(l.text)}</p>`).join("")}
  </div>
  <p style="margin:18px 0"><a href="${link}" style="background:#0F6B4C;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${esc(linkLabel)}</a></p>
</div>`;
}

// ── Phone ────────────────────────────────────────────────────────────────────────────────
async function sendCallFinishedAlert(callId) {
  try {
    const AiCall = require("../models/AiCall");
    const call = await AiCall.findById(callId).lean();
    if (!call) return;
    const transcript = call.transcript || [];
    if (!transcript.some((t) => t.role === "customer")) return; // rang off before saying anything
    const mins = call.endedAt ? Math.max(1, Math.round((new Date(call.endedAt) - new Date(call.startedAt)) / 60000)) : null;
    const who = call.customerName ? `${call.customerName} (${call.phone})` : call.phone || "Unknown caller";
    await sendEmail({
      to: adminEmail(),
      subject: `📞 Receptionist finished a call with ${who}`,
      html: emailHtml({
        heading: "The AI receptionist just finished a call",
        who: `${who} · please check the Calls tab.`,
        facts: [
          ["Started", ukTime(call.startedAt)],
          ...(mins ? [["Length", `about ${mins} min`]] : []),
          ["Ended", call.transferred ? "Put through to the team" : call.endReason || "Call ended"],
        ],
        did: outcomes(transcript),
        lines: transcript.slice(-8),
        link: `${ADMIN_URL}/calls`,
        linkLabel: "Open the Calls tab",
      }),
    });
    console.log(`[ai-alerts] call-finished email sent for ${call.twilioCallSid}`);
  } catch (err) {
    console.error("[ai-alerts] call-finished email failed:", err.message);
  }
}

// ── WhatsApp ─────────────────────────────────────────────────────────────────────────────
// Called after every AI reply: (re)sets one pending check for this chat CHAT_IDLE_MS from now.
async function scheduleChatFinishedAlert(conversationId) {
  try {
    const runAt = new Date(Date.now() + CHAT_IDLE_MS);
    await ScheduledTask.findOneAndUpdate(
      { type: "ai_chat_finished", status: "pending", "payload.conversationId": String(conversationId) },
      { $set: { runAt }, $setOnInsert: { type: "ai_chat_finished", status: "pending", payload: { conversationId: String(conversationId) } } },
      { upsert: true },
    );
  } catch (err) {
    console.error("[ai-alerts] couldn't schedule chat-finished email:", err.message);
  }
}

// Runs from the automation engine. Emails once per finished stretch of chat.
async function sendChatFinishedAlert(task) {
  const AiConversation = require("../models/AiConversation");
  const AiMessage = require("../models/AiMessage");
  const conversation = await AiConversation.findById(task.payload.conversationId).lean();
  if (!conversation) return;
  const latest = await AiMessage.findOne({ conversation: conversation._id }).sort({ createdAt: -1 }).lean();
  if (!latest) return;
  // Still chatting (a newer message came in): a later check will cover it.
  if (Date.now() - new Date(latest.createdAt).getTime() < CHAT_IDLE_MS - 30 * 1000) return;
  // Already emailed about everything up to this message.
  if (conversation.finishedAlertAt && new Date(conversation.finishedAlertAt) >= new Date(latest.createdAt)) return;

  const since = conversation.finishedAlertAt || new Date(0);
  const recent = await AiMessage.find({ conversation: conversation._id, createdAt: { $gt: since } }).sort({ createdAt: 1 }).lean();
  if (!recent.some((m) => m.role === "customer")) return;
  const who = conversation.name ? `${conversation.name} (${conversation.phone})` : conversation.phone;

  await sendEmail({
    to: adminEmail(),
    subject: `💬 Receptionist finished a WhatsApp chat with ${who}`,
    html: emailHtml({
      heading: "The AI receptionist just finished a WhatsApp chat",
      who: `${who} · please check the Conversations tab.`,
      facts: [
        ["Last message", ukTime(latest.createdAt)],
        ["Messages", String(recent.length)],
        ...(conversation.needsAttention ? [["Needs attention", "Yes — the receptionist couldn't fully help"]] : []),
      ],
      did: outcomes(recent),
      lines: recent.slice(-8),
      link: `${ADMIN_URL}/conversations`,
      linkLabel: "Open the Conversations tab",
    }),
  });
  await AiConversation.updateOne({ _id: conversation._id }, { $set: { finishedAlertAt: latest.createdAt } });
  console.log(`[ai-alerts] chat-finished email sent for ${conversation.phone}`);
}

module.exports = { sendCallFinishedAlert, scheduleChatFinishedAlert, sendChatFinishedAlert, CHAT_IDLE_MS };
