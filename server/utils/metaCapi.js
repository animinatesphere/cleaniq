const crypto = require("crypto");

const hash = (val) =>
  val ? crypto.createHash("sha256").update(val.trim().toLowerCase()).digest("hex") : undefined;

/**
 * Send a server-side conversion event to Meta Conversions API.
 *
 * @param {string} eventName  — "Lead", "Purchase", "InitiateCheckout", etc.
 * @param {object} opts       — { email, phone, value, currency, bookingId, sourceUrl }
 */
async function sendCapiEvent(eventName, opts = {}) {
  const { META_ACCESS_TOKEN, META_PIXEL_ID } = process.env;
  if (!META_ACCESS_TOKEN || !META_PIXEL_ID) return; // silently skip if not configured

  const { email, phone, leadId, value, currency = "GBP", bookingId, sourceUrl } = opts;

  // Lead events come from our backend/CRM — use system_generated.
  // Purchase/other events from the website use website action_source.
  const isLead = eventName === "Lead";

  const userData = {};
  if (email) userData.em = [hash(email)];
  if (phone) userData.ph = [hash(phone.replace(/\D/g, ""))];
  if (leadId) userData.lead_id = leadId;

  const eventData = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: isLead ? "system_generated" : "website",
    user_data: userData,
  };

  // Only include event_source_url for non-CRM events
  if (!isLead && sourceUrl) {
    eventData.event_source_url = sourceUrl;
  }

  if (isLead) {
    // CRM-style custom_data Meta expects for Lead events
    eventData.custom_data = {
      event_source: "crm",
      lead_event_source: "Cleaniq CRM",
      ...(bookingId ? { order_id: String(bookingId) } : {}),
    };
  } else if (value != null) {
    eventData.custom_data = {
      value: parseFloat(value).toFixed(2),
      currency,
      ...(bookingId ? { order_id: String(bookingId) } : {}),
    };
  } else if (bookingId) {
    eventData.custom_data = { order_id: String(bookingId) };
  }

  try {
    const r = await fetch(
      `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [eventData] }),
      }
    );
    const json = await r.json();
    if (json.error) {
      console.error(`Meta CAPI ${eventName} error:`, json.error.message);
    }
  } catch (err) {
    console.error(`Meta CAPI ${eventName} fetch failed:`, err.message);
  }
}

module.exports = { sendCapiEvent };
