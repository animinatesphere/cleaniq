import { useState } from "react";
import { X, Mail, ChevronDown } from "lucide-react";
import { api } from "./coldApi";
import { Spinner } from "./parts";

// Server settings for common email providers (sending = SMTP, reading replies = IMAP).
const PRESETS = [
  { id: "godaddy",   label: "GoDaddy Professional Email", host: "smtpout.secureserver.net", port: 465, imapHost: "imap.secureserver.net", imapPort: 993, note: "For GoDaddy's own email. If your GoDaddy email is Microsoft 365, use \"Connect Microsoft 365\" instead." },
  { id: "zoho-eu",   label: "Zoho Mail (UK/EU)",          host: "smtp.zoho.eu",   port: 465, imapHost: "imap.zoho.eu",   imapPort: 993, note: "Turn on IMAP in Zoho Mail settings first. With 2-step sign-in, use an app password." },
  { id: "zoho",      label: "Zoho Mail (other regions)",  host: "smtp.zoho.com",  port: 465, imapHost: "imap.zoho.com",  imapPort: 993, note: "Turn on IMAP in Zoho Mail settings first." },
  { id: "hostinger", label: "Hostinger",                  host: "smtp.hostinger.com", port: 465, imapHost: "imap.hostinger.com", imapPort: 993 },
  { id: "namecheap", label: "Namecheap Private Email",    host: "mail.privateemail.com", port: 465, imapHost: "mail.privateemail.com", imapPort: 993 },
  { id: "ionos",     label: "IONOS (UK)",                 host: "smtp.ionos.co.uk", port: 465, imapHost: "imap.ionos.co.uk", imapPort: 993 },
  { id: "google",    label: "Gmail / Google Workspace (app password)", host: "smtp.gmail.com", port: 465, imapHost: "imap.gmail.com", imapPort: 993, note: "Needs 2-step verification on and an app password (myaccount.google.com → Security → App passwords). Not your normal password." },
  { id: "m365",      label: "Microsoft 365 (SMTP)",       host: "smtp.office365.com", port: 587, imapHost: "outlook.office365.com", imapPort: 993, note: "Microsoft usually blocks this. \"Connect Microsoft 365\" is better; use this only if your admin turned on SMTP AUTH." },
  { id: "other",     label: "Other (enter the servers)",  host: "", port: 465, imapHost: "", imapPort: 993 },
];

const input = "w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/25 outline-none focus:border-emerald-400/50";

/** Connect an "other email" mailbox, or update an existing one's password (pass `mailbox`). */
export default function SmtpModal({ mailbox, onClose, onSaved }) {
  const existing = mailbox?.smtp;
  const guess = existing ? PRESETS.find((p) => p.host === existing.host) || PRESETS[PRESETS.length - 1] : PRESETS[0];
  const [preset, setPreset] = useState(guess.id);
  const [f, setF] = useState({
    email: mailbox?.email || "",
    fromName: mailbox?.fromName || "",
    password: "",
    host: existing?.host ?? guess.host,
    port: existing?.port ?? guess.port,
    imapHost: existing?.imapHost ?? guess.imapHost,
    imapPort: existing?.imapPort ?? guess.imapPort,
    user: existing?.user || "",
  });
  const [advanced, setAdvanced] = useState(guess.id === "other");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const p = PRESETS.find((x) => x.id === preset);
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));

  function pick(id) {
    const x = PRESETS.find((q) => q.id === id);
    setPreset(id);
    setF((o) => ({ ...o, host: x.host, port: x.port, imapHost: x.imapHost, imapPort: x.imapPort }));
    if (id === "other") setAdvanced(true);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const box = await api("/mailboxes/smtp", {
        method: "POST",
        body: JSON.stringify({
          email: f.email, fromName: f.fromName, password: f.password, user: f.user || f.email,
          host: f.host, port: Number(f.port), secure: Number(f.port) === 465,
          imapHost: f.imapHost, imapPort: Number(f.imapPort), imapSecure: true,
        }),
      });
      onSaved?.(box);
      onClose();
    } catch (e2) { setErr(e2.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#07261c] border border-white/[0.1] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center"><Mail size={18} className="text-emerald-300" /></div>
          <div className="flex-1">
            <p className="text-white font-bold">{mailbox ? "Update mailbox password" : "Connect other email (SMTP)"}</p>
            <p className="text-white/40 text-xs">Any email account: GoDaddy, Zoho, Hostinger, Namecheap…</p>
          </div>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white cursor-pointer"><X size={18} /></button>
        </div>

        <label className="block">
          <span className="text-white/50 text-xs font-bold">Email provider</span>
          <select value={preset} onChange={(e) => pick(e.target.value)} className={`${input} mt-1 cursor-pointer`}>
            {PRESETS.map((x) => <option key={x.id} value={x.id} className="bg-[#0B2D22]">{x.label}</option>)}
          </select>
          {p?.note && <span className="block text-amber-300/80 text-[11px] mt-1 leading-relaxed">{p.note}</span>}
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-white/50 text-xs font-bold">Email address</span>
            <input type="email" required value={f.email} onChange={set("email")} disabled={!!mailbox} placeholder="you@yourcompany.co.uk" className={`${input} mt-1 disabled:opacity-60`} />
          </label>
          <label className="block">
            <span className="text-white/50 text-xs font-bold">Sender name (optional)</span>
            <input value={f.fromName} onChange={set("fromName")} placeholder="e.g. Kelvin from Cleaniq" className={`${input} mt-1`} />
          </label>
        </div>
        <label className="block">
          <span className="text-white/50 text-xs font-bold">Password {mailbox && <span className="font-normal text-white/30">(leave empty to keep the saved one)</span>}</span>
          <input type="password" autoComplete="new-password" required={!mailbox} value={f.password} onChange={set("password")} placeholder="The email account's password or app password" className={`${input} mt-1`} />
          <span className="block text-white/30 text-[11px] mt-1">Stored encrypted. Only used to send your campaigns and read replies.</span>
        </label>

        <button type="button" onClick={() => setAdvanced((v) => !v)} className="flex items-center gap-1 text-white/45 hover:text-white/75 text-xs font-bold cursor-pointer">
          <ChevronDown size={13} className={advanced ? "rotate-180" : ""} /> Server settings
        </button>
        {advanced && (
          <div className="grid grid-cols-[1fr_90px] gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
            <label className="block"><span className="text-white/40 text-[11px]">Sending server (SMTP)</span><input required value={f.host} onChange={set("host")} placeholder="smtp.example.com" className={`${input} mt-1`} /></label>
            <label className="block"><span className="text-white/40 text-[11px]">Port</span><input type="number" value={f.port} onChange={set("port")} className={`${input} mt-1`} /></label>
            <label className="block"><span className="text-white/40 text-[11px]">Reading server (IMAP) — for replies & bounces</span><input value={f.imapHost} onChange={set("imapHost")} placeholder="imap.example.com" className={`${input} mt-1`} /></label>
            <label className="block"><span className="text-white/40 text-[11px]">Port</span><input type="number" value={f.imapPort} onChange={set("imapPort")} className={`${input} mt-1`} /></label>
            <label className="block col-span-2"><span className="text-white/40 text-[11px]">Username (if different from the email address)</span><input value={f.user} onChange={set("user")} placeholder={f.email || "usually the email address"} className={`${input} mt-1`} /></label>
          </div>
        )}

        {err && <p className="text-rose-300 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-white/50 hover:text-white text-sm font-bold cursor-pointer">Cancel</button>
          <button disabled={busy} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 cursor-pointer disabled:opacity-50">
            {busy && <Spinner small />} {busy ? "Checking the details…" : mailbox ? "Test & save" : "Test & connect"}
          </button>
        </div>
      </form>
    </div>
  );
}
