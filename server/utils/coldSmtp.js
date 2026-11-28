// "Other email" mailboxes (GoDaddy, Zoho, Hostinger, Namecheap, Google/Microsoft with an app
// password…): send with SMTP, read replies and bounces with IMAP. The password is stored encrypted.
// Tests replace `lib.createTransport` and `lib.openImap` with fakes.
const crypto = require("crypto");

const lib = {
  createTransport: (opts) => require("nodemailer").createTransport(opts),
  openImap: (opts) => new (require("imapflow").ImapFlow)(opts),
  parse: (src) => require("mailparser").simpleParser(src),
};

function enc() { return require("./coldEmailEngine"); }

function smtpOptions(cfg, pass) {
  return {
    host: cfg.host,
    port: Number(cfg.port) || 465,
    secure: cfg.secure !== undefined ? !!cfg.secure : Number(cfg.port) === 465,
    auth: { user: cfg.user, pass },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 60000,
  };
}

function imapOptions(cfg, pass) {
  return {
    host: cfg.imapHost,
    port: Number(cfg.imapPort) || 993,
    secure: cfg.imapSecure !== undefined ? !!cfg.imapSecure : true,
    auth: { user: cfg.user, pass },
    logger: false,
    socketTimeout: 60000,
  };
}

/** Checks the details work before saving: logs in to SMTP and (if given) IMAP. Throws a readable error. */
async function testConnection(cfg, pass) {
  const t = lib.createTransport(smtpOptions(cfg, pass));
  try {
    await t.verify();
  } catch (err) {
    throw new Error(`Sending (SMTP) failed: ${readable(err)}`);
  } finally {
    t.close?.();
  }
  if (cfg.imapHost) {
    const c = lib.openImap(imapOptions(cfg, pass));
    try {
      await c.connect();
    } catch (err) {
      throw new Error(`Reading replies (IMAP) failed: ${readable(err)}`);
    } finally {
      await c.logout?.().catch(() => {});
    }
  }
}

function readable(err) {
  const m = `${err.responseText || err.response || err.message || err}`;
  if (/\b535\b|EAUTH|AUTHENTICATIONFAILED|Invalid login|authentication failed|Username and Password not accepted/i.test(m)) return "the email or password was refused. If the account has 2-step sign-in, use an app password.";
  if (/ENOTFOUND|EAI_AGAIN/i.test(m)) return "that server address doesn't exist — check the server name.";
  if (/ETIMEDOUT|ECONNREFUSED|timeout/i.test(m)) return "couldn't reach the server — check the server name and port.";
  if (/SmtpClientAuthentication is disabled|5\.7\.139|5\.7\.3/i.test(m)) return "your email provider has turned off SMTP sign-in for this account (common on Microsoft 365). Use 'Connect Outlook' instead, or ask your admin to enable SMTP AUTH.";
  return m.slice(0, 300);
}

const fromHeader = (mailbox, fromName) => {
  const name = fromName || mailbox.fromName || "";
  return name ? { name, address: mailbox.email } : mailbox.email;
};

async function sendViaSmtp(mailbox, { to, subject, html, text, fromName, unsubUrl }) {
  const pass = enc().decrypt(mailbox.smtp.pass);
  const t = lib.createTransport(smtpOptions(mailbox.smtp, pass));
  const domain = mailbox.email.split("@")[1];
  const messageId = `<${crypto.randomBytes(12).toString("hex")}@${domain}>`;
  try {
    const info = await t.sendMail({
      from: fromHeader(mailbox, fromName),
      to,
      subject,
      text,
      html,
      messageId,
      headers: unsubUrl ? { "List-Unsubscribe": `<${unsubUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : {},
    });
    return { id: info.messageId || messageId, threadId: info.messageId || messageId };
  } finally {
    t.close?.();
  }
}

async function sendSmtpReply(mailbox, { to, subject, text, inReplyTo, fromName }) {
  const pass = enc().decrypt(mailbox.smtp.pass);
  const t = lib.createTransport(smtpOptions(mailbox.smtp, pass));
  try {
    const info = await t.sendMail({
      from: fromHeader(mailbox, fromName),
      to,
      subject: /^re:/i.test(subject) ? subject : `Re: ${subject}`,
      text,
      ...(inReplyTo ? { inReplyTo, references: inReplyTo } : {}),
    });
    return { id: info.messageId || "" };
  } finally {
    t.close?.();
  }
}

/** New INBOX messages from the last `days`, normalised like the Gmail/Outlook readers. */
async function readImap(mailbox, seen, { days = 14, max = 300 } = {}) {
  if (!mailbox.smtp?.imapHost) return [];
  const pass = enc().decrypt(mailbox.smtp.pass);
  const c = lib.openImap(imapOptions(mailbox.smtp, pass));
  await c.connect();
  const out = [];
  const lock = await c.getMailboxLock("INBOX");
  try {
    const validity = String(c.mailbox?.uidValidity || "0");
    const uids = (await c.search({ since: new Date(Date.now() - days * 864e5) }, { uid: true })) || [];
    const fresh = uids.map((u) => [u, `${validity}:${u}`]).filter(([, id]) => !seen.has(id)).slice(-max);
    for (const [uid, id] of fresh) {
      const msg = await c.fetchOne(String(uid), { source: true }, { uid: true });
      if (!msg?.source) continue;
      const p = await lib.parse(msg.source);
      const headers = [];
      for (const [name, value] of p.headers || []) headers.push({ name, value: typeof value === "string" ? value : value?.text || value?.value?.[0]?.address || JSON.stringify(value) });
      const refs = [].concat(p.references || []);
      out.push({
        id,
        threadId: p.inReplyTo || refs[refs.length - 1] || "",
        threadIds: [p.inReplyTo, ...refs].filter(Boolean),
        from: p.from?.text || "",
        to: p.to?.text || "",
        subject: p.subject || "",
        body: String(p.text || "").slice(0, 8000),
        headers,
        internetMessageId: p.messageId || "",
        receivedAt: p.date || new Date(),
      });
    }
  } finally {
    lock.release();
    await c.logout().catch(() => {});
  }
  return out;
}

module.exports = { lib, testConnection, sendViaSmtp, sendSmtpReply, readImap, readable, smtpOptions, imapOptions };
