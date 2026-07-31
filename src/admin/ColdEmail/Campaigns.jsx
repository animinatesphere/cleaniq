import { useState, useEffect, useCallback } from "react";
import { Plus, Play, Pause, Trash2, ChevronRight, Mail, Users, MessageSquare, X, ArrowRight, ArrowLeft, Rocket, Save, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}` });
function afetch(url, opts = {}) {
  return fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...auth(), ...(opts.headers || {}) } });
}

const VARS = ["{{first_name}}", "{{last_name}}", "{{company}}", "{{email}}"];

const STATUS_STYLES = {
  active:    "bg-emerald-500/15 text-emerald-400",
  paused:    "bg-amber-500/15 text-amber-400",
  draft:     "bg-white/[0.08] text-white/50",
  completed: "bg-blue-500/15 text-blue-400",
};

// ── Wizard ────────────────────────────────────────────────────────────────────

function Wizard({ onClose, onCreated, editCampaign }) {
  const TOTAL_STEPS = 4;
  const [step, setStep]         = useState(1);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [mailboxes, setMailboxes] = useState([]);
  const [contacts,  setContacts]  = useState([]);
  const [contactTotal, setContactTotal] = useState(0);
  const [contactSearch, setContactSearch] = useState("");
  const [contactPage, setContactPage] = useState(1);

  const [data, setData] = useState(
    editCampaign
      ? {
          name:       editCampaign.name || "",
          fromName:   editCampaign.fromName || "",
          mailboxIds: editCampaign.mailboxIds || [],
          steps:      editCampaign.steps?.length
            ? editCampaign.steps
            : [{ order: 0, subject: "", body: "", waitDays: 0 }],
          contactIds: editCampaign.contactIds || [],
        }
      : {
          name:       "",
          fromName:   "",
          mailboxIds: [],
          steps:      [{ order: 0, subject: "", body: "", waitDays: 0 }],
          contactIds: [],
        }
  );

  useEffect(() => {
    afetch(`${API}/cold-email/mailboxes`).then((r) => r.json()).then(setMailboxes).catch(() => {});
  }, []);

  const loadContacts = useCallback(async () => {
    const params = new URLSearchParams({ page: contactPage, limit: 50, search: contactSearch });
    const r = await fetch(`${API}/cold-email/contacts?${params}`, { headers: auth() });
    const d = await r.json();
    setContacts(d.contacts || []);
    setContactTotal(d.total || 0);
  }, [contactPage, contactSearch]);

  useEffect(() => { if (step === 3) loadContacts(); }, [step, loadContacts]);

  // ── Field helpers ──────────────────────────────────────────────────────────
  function setStepField(idx, field, val) {
    const steps = [...data.steps];
    steps[idx] = { ...steps[idx], [field]: val };
    setData((d) => ({ ...d, steps }));
  }

  function addStep() {
    if (data.steps.length >= 3) return;
    setData((d) => ({ ...d, steps: [...d.steps, { order: d.steps.length, subject: "", body: "", waitDays: 3 }] }));
  }

  function removeStep(idx) {
    setData((d) => ({ ...d, steps: d.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })) }));
  }

  function insertVar(stepIdx, field, varStr) {
    const current = data.steps[stepIdx][field] || "";
    setStepField(stepIdx, field, current + varStr);
  }

  function toggleMailbox(id) {
    setData((d) => ({
      ...d,
      mailboxIds: d.mailboxIds.includes(id) ? d.mailboxIds.filter((m) => m !== id) : [...d.mailboxIds, id],
    }));
  }

  function toggleContact(id) {
    setData((d) => ({
      ...d,
      contactIds: d.contactIds.includes(id) ? d.contactIds.filter((c) => c !== id) : [...d.contactIds, id],
    }));
  }

  function toggleAllContacts() {
    const allOn = contacts.every((c) => data.contactIds.includes(c._id));
    if (allOn) {
      setData((d) => ({ ...d, contactIds: d.contactIds.filter((id) => !contacts.find((c) => c._id === id)) }));
    } else {
      const toAdd = contacts.filter((c) => !data.contactIds.includes(c._id)).map((c) => c._id);
      setData((d) => ({ ...d, contactIds: [...d.contactIds, ...toAdd] }));
    }
  }

  // ── Validate per step ──────────────────────────────────────────────────────
  function validate() {
    if (step === 1) {
      if (!data.name.trim()) return "Campaign name is required";
      if (data.mailboxIds.length === 0) return "Select at least one mailbox";
    }
    if (step === 2) {
      for (const s of data.steps) {
        if (!s.subject.trim()) return "Every step needs a subject line";
        if (!s.body.trim())    return "Every step needs a message body";
      }
    }
    if (step === 3) {
      if (data.contactIds.length === 0) return "Select at least one contact";
    }
    return "";
  }

  function next() {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => s + 1);
  }

  function back() { setError(""); setStep((s) => s - 1); }

  async function save(launch = false) {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError("");
    try {
      let campaign;
      if (editCampaign) {
        const r = await afetch(`${API}/cold-email/campaigns/${editCampaign._id}`, { method: "PUT", body: JSON.stringify(data) });
        campaign = await r.json();
      } else {
        const r = await afetch(`${API}/cold-email/campaigns`, { method: "POST", body: JSON.stringify(data) });
        campaign = await r.json();
      }
      if (campaign.message) throw new Error(campaign.message);
      if (launch) {
        const r = await afetch(`${API}/cold-email/campaigns/${campaign._id}/launch`, { method: "POST" });
        const d = await r.json();
        if (d.message) throw new Error(d.message);
      }
      onCreated();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const stepLabels = ["Campaign Info", "Build Sequence", "Select Contacts", "Review & Launch"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#061A13] border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-white font-black text-base">{editCampaign ? "Edit Campaign" : "New Campaign"}</h2>
            <p className="text-white/40 text-xs mt-0.5">Step {step} of {TOTAL_STEPS} — {stepLabels[step - 1]}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 cursor-pointer">
            <X size={14} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 pt-4">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 shrink-0 ${i + 1 <= step ? "opacity-100" : "opacity-30"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                  i + 1 < step  ? "bg-emerald-500 text-white" :
                  i + 1 === step ? "bg-emerald-500 text-white ring-4 ring-emerald-500/20" :
                                   "bg-white/[0.06] text-white/40"
                }`}>{i + 1 < step ? "✓" : i + 1}</div>
                <span className={`text-xs font-semibold hidden sm:block ${i + 1 === step ? "text-white" : "text-white/40"}`}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-px mx-3 ${i + 1 < step ? "bg-emerald-500/40" : "bg-white/[0.06]"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── Step 1: Campaign Info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-1.5">Campaign Name *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. Q3 Commercial Outreach"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40 text-sm"
                />
              </div>
              <div>
                <label className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-1.5">From Name <span className="text-white/30 font-normal normal-case">(optional — defaults to email address)</span></label>
                <input
                  type="text"
                  value={data.fromName}
                  onChange={(e) => setData((d) => ({ ...d, fromName: e.target.value }))}
                  placeholder="e.g. Adeyemi at cleaniq services"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40 text-sm"
                />
              </div>
              <div>
                <label className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-3">Select Sending Mailboxes *</label>
                {mailboxes.length === 0 ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                    <AlertCircle size={14} className="text-amber-400 shrink-0" />
                    <p className="text-amber-400 text-sm">No mailboxes connected. Go to the Mailboxes tab first and connect a Gmail account.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mailboxes.map((box) => {
                      const on = data.mailboxIds.includes(box._id);
                      return (
                        <div
                          key={box._id}
                          onClick={() => toggleMailbox(box._id)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                            on ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.05]"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${on ? "bg-emerald-500 border-emerald-500" : "border-white/20"}`}>
                            {on && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/90 text-sm font-semibold truncate">{box.email}</p>
                            <p className="text-white/30 text-xs">Daily limit: {box.dailyLimit} · {box.sentToday} sent today</p>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${STATUS_STYLES[box.status] || STATUS_STYLES.draft}`}>{box.status}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Build Sequence ── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-white/40 text-xs">Use <code className="text-emerald-400">{"{{first_name}}"}</code>, <code className="text-emerald-400">{"{{company}}"}</code> etc. to personalize. Every email automatically gets an unsubscribe footer.</p>
              {data.steps.map((s, idx) => (
                <div key={idx} className="bg-white/[0.03] border border-white/[0.07] rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-black text-emerald-400">{idx + 1}</div>
                      <span className="text-white/70 text-sm font-bold">
                        {idx === 0 ? "First email (sent immediately on launch)" : `Follow-up ${idx}`}
                      </span>
                    </div>
                    {idx > 0 && (
                      <button onClick={() => removeStep(idx)} className="text-white/30 hover:text-rose-400 cursor-pointer"><X size={14} /></button>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    {idx > 0 && (
                      <div className="flex items-center gap-2">
                        <label className="text-white/40 text-xs font-semibold whitespace-nowrap">Send after</label>
                        <input
                          type="number" min="1" max="30"
                          value={s.waitDays}
                          onChange={(e) => setStepField(idx, "waitDays", Number(e.target.value))}
                          className="w-16 bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-emerald-500/40"
                        />
                        <label className="text-white/40 text-xs font-semibold">days with no reply</label>
                      </div>
                    )}
                    <div>
                      <label className="text-white/40 text-xs font-semibold block mb-1">Subject Line</label>
                      <input
                        type="text"
                        value={s.subject}
                        onChange={(e) => setStepField(idx, "subject", e.target.value)}
                        placeholder="e.g. Quick question, {{first_name}}"
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white/90 placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs font-semibold block mb-1">Message Body</label>
                      <textarea
                        value={s.body}
                        onChange={(e) => setStepField(idx, "body", e.target.value)}
                        rows={6}
                        placeholder="Hi {{first_name}},&#10;&#10;I noticed {{company}} might benefit from our cleaning services...&#10;&#10;Best,&#10;The cleaniq services team"
                        className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white/90 placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/40 resize-none font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white/30 text-xs">Insert variable:</span>
                      {VARS.map((v) => (
                        <button
                          key={v}
                          onClick={() => insertVar(idx, "body", " " + v)}
                          className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer font-mono"
                        >{v}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {data.steps.length < 3 && (
                <button
                  onClick={addStep}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 text-sm font-semibold cursor-pointer transition-all"
                >
                  <Plus size={14} /> Add follow-up step ({data.steps.length}/3 steps)
                </button>
              )}
            </div>
          )}

          {/* ── Step 3: Select Contacts ── */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-white/60 text-sm font-semibold">{data.contactIds.length.toLocaleString()} selected</p>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      const params = new URLSearchParams({ search: contactSearch });
                      const r = await fetch(`${API}/cold-email/contacts/all-ids?${params}`, { headers: auth() });
                      const d = await r.json();
                      if (d.ids) setData((prev) => ({ ...prev, contactIds: d.ids }));
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                  >
                    Select all {contactTotal.toLocaleString()}
                  </button>
                  <button
                    onClick={() => setData((prev) => ({ ...prev, contactIds: [] }))}
                    className="text-xs text-white/30 hover:text-white/60 font-bold cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={toggleAllContacts}
                    className="text-xs text-white/40 hover:text-white/70 font-bold cursor-pointer"
                  >
                    {contacts.every((c) => data.contactIds.includes(c._id)) ? "Deselect page" : "Select page"}
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => { setContactSearch(e.target.value); setContactPage(1); }}
                placeholder="Search contacts…"
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40"
              />
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl max-h-64 overflow-y-auto">
                {contacts.length === 0 ? (
                  <div className="py-8 text-center text-white/30 text-sm">No contacts found</div>
                ) : (
                  contacts.map((c) => {
                    const sel  = data.contactIds.includes(c._id);
                    const name = `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email;
                    return (
                      <div
                        key={c._id}
                        onClick={() => toggleContact(c._id)}
                        className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] cursor-pointer transition-all last:border-0 ${sel ? "bg-emerald-500/[0.06]" : "hover:bg-white/[0.02]"}`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${sel ? "bg-emerald-500 border-emerald-500" : "border-white/20"}`}>
                          {sel && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-sm font-medium truncate">{name}</p>
                          <p className="text-white/30 text-xs truncate">{c.email}</p>
                        </div>
                        {c.company && <span className="text-white/25 text-xs truncate max-w-[100px]">{c.company}</span>}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-white/30">
                <span>{contactTotal.toLocaleString()} total contacts</span>
                <div className="flex gap-2">
                  <button onClick={() => setContactPage((p) => Math.max(1, p - 1))} disabled={contactPage === 1} className="px-2 py-1 rounded bg-white/[0.05] disabled:opacity-30 cursor-pointer disabled:cursor-default">Prev</button>
                  <button onClick={() => setContactPage((p) => p + 1)} disabled={contacts.length < 50} className="px-2 py-1 rounded bg-white/[0.05] disabled:opacity-30 cursor-pointer disabled:cursor-default">Next</button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Review ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl divide-y divide-white/[0.06]">
                {[
                  { label: "Campaign",   value: data.name },
                  { label: "From name",  value: data.fromName || <span className="text-white/30">Defaults to mailbox email</span> },
                  { label: "Mailboxes",  value: `${data.mailboxIds.length} selected` },
                  { label: "Steps",      value: `${data.steps.length} email${data.steps.length > 1 ? "s" : ""} in sequence` },
                  { label: "Contacts",   value: `${data.contactIds.length.toLocaleString()} contacts will receive this campaign` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-white/40 text-sm">{label}</span>
                    <span className="text-white text-sm font-semibold">{value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <p className="text-amber-400 text-sm font-bold mb-0.5">Before you launch</p>
                <ul className="text-amber-400/80 text-xs space-y-1 list-disc list-inside">
                  <li>Every email includes a mandatory unsubscribe link</li>
                  <li>Sends are spread across business hours (9am–5pm) with random gaps</li>
                  <li>Daily limits per mailbox are enforced automatically</li>
                  <li>Set <code className="font-mono">COLD_EMAIL_DRY_RUN=false</code> on the server to send real emails</li>
                </ul>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="text-rose-400 shrink-0" />
              <p className="text-rose-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
          <button
            onClick={back}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] text-white/50 text-sm font-bold hover:bg-white/10 hover:text-white/80 disabled:opacity-0 disabled:pointer-events-none cursor-pointer transition-all"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex gap-2">
            {step < TOTAL_STEPS && (
              <button
                onClick={next}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
              >
                Next <ArrowRight size={14} />
              </button>
            )}
            {step === TOTAL_STEPS && (
              <>
                <button
                  onClick={() => save(false)}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.07] border border-white/[0.08] text-white/70 text-sm font-bold hover:bg-white/10 cursor-pointer transition-all disabled:opacity-40"
                >
                  <Save size={14} /> Save Draft
                </button>
                <button
                  onClick={() => save(true)}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40"
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Launching…</>
                  ) : (
                    <><Rocket size={14} /> Launch Campaign</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCard({ campaign, onRefresh }) {
  const navigate  = useNavigate();
  const [busy, setBusy] = useState("");

  async function action(verb) {
    setBusy(verb);
    await afetch(`${API}/cold-email/campaigns/${campaign._id}/${verb}`, { method: "POST" });
    onRefresh();
    setBusy("");
  }

  async function del() {
    if (!confirm(`Delete "${campaign.name}"? All send records will also be deleted.`)) return;
    setBusy("delete");
    await afetch(`${API}/cold-email/campaigns/${campaign._id}`, { method: "DELETE" });
    onRefresh();
  }

  const s = campaign.stats || {};
  const replyRate = s.sent > 0 ? ((s.replied / s.sent) * 100).toFixed(1) : "0";
  const borderColor =
    campaign.status === "active"    ? "border-l-emerald-500" :
    campaign.status === "paused"    ? "border-l-amber-400"   :
    campaign.status === "completed" ? "border-l-blue-400"    :
                                      "border-l-white/10";

  return (
    <div className={`bg-[#0B2D22] border border-white/[0.06] border-l-4 ${borderColor} rounded-2xl p-5`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-white font-black text-base truncate">{campaign.name}</h3>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_STYLES[campaign.status] || STATUS_STYLES.draft}`}>
              {campaign.status}
            </span>
          </div>
          <p className="text-white/30 text-xs">
            {campaign.steps?.length || 0} step{(campaign.steps?.length || 0) !== 1 ? "s" : ""}
            {campaign.contactIds?.length > 0 && ` · ${campaign.contactIds.length.toLocaleString()} contacts`}
            {campaign.launchedAt && ` · launched ${new Date(campaign.launchedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {(campaign.status === "active" || campaign.status === "paused") && (
            <button
              onClick={() => action(campaign.status === "active" ? "pause" : "resume")}
              disabled={!!busy}
              title={campaign.status === "active" ? "Pause" : "Resume"}
              className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer disabled:opacity-40 transition-all"
            >
              {busy === "pause" || busy === "resume"
                ? <div className="w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin" />
                : campaign.status === "active" ? <Pause size={13} /> : <Play size={13} />
              }
            </button>
          )}
          <button
            onClick={() => navigate(`/admin/cold-email/${campaign._id}`)}
            className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 cursor-pointer transition-all"
            title="View details"
          >
            <ChevronRight size={13} />
          </button>
          <button
            onClick={del}
            disabled={!!busy}
            className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer disabled:opacity-40 transition-all"
            title="Delete"
          >
            {busy === "delete"
              ? <div className="w-3 h-3 border border-rose-400 border-t-transparent rounded-full animate-spin" />
              : <Trash2 size={13} />
            }
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Sent",          value: s.sent || 0,         color: "text-white/70"  },
          { label: "Replied",       value: s.replied || 0,      color: "text-emerald-400", badge: s.sent > 0 && `${replyRate}%` },
          { label: "Unsubscribed",  value: s.unsubscribed || 0, color: "text-amber-400"  },
          { label: "Bounced",       value: s.bounced || 0,      color: "text-rose-400"   },
        ].map(({ label, value, color, badge }) => (
          <div key={label} className="bg-white/[0.03] rounded-xl px-3 py-2.5 text-center">
            <p className={`font-black text-lg leading-none ${color}`}>{value.toLocaleString()}</p>
            <p className="text-white/25 text-[10px] mt-0.5">{label}</p>
            {badge && <p className="text-emerald-400/70 text-[10px]">{badge}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Campaigns Component ──────────────────────────────────────────────────

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [filter, setFilter]       = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`${API}/cold-email/campaigns`, { headers: auth() });
    const d = await r.json();
    setCampaigns(Array.isArray(d) ? d : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? campaigns : campaigns.filter((c) => c.status === filter);

  const totals = {
    active:    campaigns.filter((c) => c.status === "active").length,
    draft:     campaigns.filter((c) => c.status === "draft").length,
    paused:    campaigns.filter((c) => c.status === "paused").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
  };
  const totalSent    = campaigns.reduce((a, c) => a + (c.stats?.sent    || 0), 0);
  const totalReplied = campaigns.reduce((a, c) => a + (c.stats?.replied || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-white font-black text-lg">Campaigns</h2>
          <p className="text-white/40 text-sm mt-0.5">
            {campaigns.length} total · {totalSent.toLocaleString()} emails sent · {totalReplied.toLocaleString()} replies
          </p>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus size={14} /> New Campaign
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: "all",       label: "All",       count: campaigns.length },
          { id: "active",    label: "Active",    count: totals.active    },
          { id: "draft",     label: "Draft",     count: totals.draft     },
          { id: "paused",    label: "Paused",    count: totals.paused    },
          { id: "completed", label: "Completed", count: totals.completed },
        ].map(({ id, label, count }) => count > 0 || id === "all" ? (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === id
                ? "bg-emerald-500 text-white"
                : "bg-white/[0.05] text-white/40 border border-white/[0.06] hover:text-white/70"
            }`}
          >
            {label}
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${filter === id ? "bg-white/20 text-white" : "bg-white/[0.07] text-white/40"}`}>{count}</span>
          </button>
        ) : null)}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#0B2D22] border border-white/[0.06] border-dashed rounded-2xl py-20 flex flex-col items-center text-center px-8">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
            <Mail size={24} className="text-emerald-400/60" />
          </div>
          <h3 className="text-white font-bold text-base mb-1">
            {filter === "all" ? "No campaigns yet" : `No ${filter} campaigns`}
          </h3>
          <p className="text-white/30 text-sm max-w-xs mb-6">
            {filter === "all"
              ? "Create your first cold email campaign. Connect a mailbox, import contacts, then build your sequence."
              : `You don't have any ${filter} campaigns right now.`}
          </p>
          {filter === "all" && (
            <button
              onClick={() => setWizardOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Plus size={14} /> Create your first campaign
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <CampaignCard key={c._id} campaign={c} onRefresh={load} />
          ))}
        </div>
      )}

      {wizardOpen && (
        <Wizard
          onClose={() => setWizardOpen(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
