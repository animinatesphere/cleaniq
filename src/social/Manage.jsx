// Accounts (connect networks, with setup steps), photo library and team logins.
import { useEffect, useState } from "react";
import { Link2, Unplug, AlertTriangle, CheckCircle2, Copy, ChevronDown, Upload, Trash2, Users, Plus, ImageIcon, KeyRound } from "lucide-react";
import { api, photoUrl } from "./api";
import { NETWORKS, NetworkMark, AccountAvatar, Button, Card, CardHeader, Empty, inputCls, labelCls, fmtDate } from "./ui";

const CONNECT = [
  {
    key: "meta", networks: ["facebook", "instagram"], title: "Facebook & Instagram",
    text: "Connects your Facebook Page and the Instagram business account linked to it.",
    steps: [
      "Instagram must be a Business or Creator account, linked to your Facebook Page (Instagram app → Settings → Account type, then link the Page).",
      "Go to developers.facebook.com → My Apps → Create app → choose “Other”, then “Business”.",
      "Add the products “Facebook Login for Business” and “Instagram Graph API”.",
      "In Facebook Login → Settings, add this as a Valid OAuth Redirect URI:",
      "In App settings → Basic, copy the App ID and App Secret into the server's .env as META_APP_ID and META_APP_SECRET, then restart the server.",
      "You can stay in Development mode: posting to your own Page and Instagram works without Meta's app review.",
    ],
    callbackAt: 3,
  },
  {
    key: "linkedin", networks: ["linkedin"], title: "LinkedIn",
    text: "Posts as your profile now; as your company page once LinkedIn approves it.",
    steps: [
      "Go to linkedin.com/developers → Create app (link it to your Cleaniq company page).",
      "In Products, add “Share on LinkedIn” and “Sign In with LinkedIn using OpenID Connect”. For company page posts also request “Community Management API” (LinkedIn reviews this).",
      "In Auth, add this Authorized redirect URL:",
      "Copy the Client ID and Client Secret into the server's .env as LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET, then restart the server.",
      "When the Community Management API is approved, add LINKEDIN_ORG_SCOPES=1 to .env, restart, and connect again to add the company page.",
      "LinkedIn connections last 60 days — you'll see a reminder here to reconnect.",
    ],
    callbackAt: 2,
  },
  {
    key: "x", networks: ["x"], title: "X (Twitter)",
    text: "Posting needs an X API plan with write access (paid to X).",
    steps: [
      "Go to developer.x.com, sign in with the Cleaniq account and choose a plan that allows posting.",
      "Open your app → User authentication settings → turn on OAuth 2.0, app type “Web App”, permissions “Read and write”.",
      "Add this Callback URI / Redirect URL:",
      "Copy the OAuth 2.0 Client ID and Client Secret into the server's .env as X_CLIENT_ID and X_CLIENT_SECRET, then restart the server.",
    ],
    callbackAt: 2,
  },
  {
    key: "google", networks: ["google"], title: "Google Business Profile",
    text: "Posts updates to your Google listing, shown on Google Search and Maps.",
    steps: [
      "Go to console.cloud.google.com, create a project (e.g. Cleaniq Social).",
      "Request access to the Business Profile APIs (search Google Business Profile API access request form). Google approves this, usually within a few days.",
      "Once approved, enable My Business Account Management API, My Business Business Information API and Google My Business API in APIs and Services.",
      "In APIs and Services, Credentials, create an OAuth client ID of type Web application, and add this Authorised redirect URI:",
      "Copy the Client ID and Client secret into the server .env as SOCIAL_GOOGLE_CLIENT_ID and SOCIAL_GOOGLE_CLIENT_SECRET (separate from the cold email GOOGLE_CLIENT_ID), then restart the server.",
      "Press Connect and sign in with the Google account that manages your Business Profile.",
    ],
    callbackAt: 3,
  },
  {
    key: "youtube", networks: ["youtube"], title: "YouTube",
    text: "Uploads videos to your channel (vertical videos under 3 minutes become Shorts).",
    steps: [
      "Use the same Google Cloud project as Google Business Profile (or create one at console.cloud.google.com).",
      "In APIs and Services, enable the YouTube Data API v3.",
      "On the OAuth consent screen, add the scopes youtube.upload and youtube.readonly, and add your Google account as a test user.",
      "In Credentials, open your Web application OAuth client and add this Authorised redirect URI:",
      "It uses the same SOCIAL_GOOGLE_CLIENT_ID and SOCIAL_GOOGLE_CLIENT_SECRET (separate from the cold email GOOGLE_CLIENT_ID) as Google Business Profile — nothing extra in .env.",
      "Until Google verifies the app, YouTube may set uploads to private. Apply for verification in the OAuth consent screen when you are ready.",
    ],
    callbackAt: 3,
  },
  {
    key: "threads", networks: ["threads"], title: "Threads",
    text: "Posts to your Threads profile. Uses a Meta developer app.",
    steps: [
      "Your Threads profile must be linked to the Cleaniq Instagram account.",
      "At developers.facebook.com, open your app (or create one) and add the use case Access the Threads API.",
      "Turn on the permissions threads_basic and threads_content_publish.",
      "In the Threads use case settings, add this Redirect Callback URL:",
      "Copy the Threads App ID and Threads App Secret into the server .env as THREADS_APP_ID and THREADS_APP_SECRET, then restart the server.",
      "In App roles, add your Threads profile as a Threads Tester and accept the invite in Threads (Settings, Account, Website permissions).",
    ],
    callbackAt: 3,
  },
  {
    key: "tiktok", networks: ["tiktok"], title: "TikTok",
    text: "Photo posts. Private (only you) until TikTok approves the app.",
    steps: [
      "Go to developers.tiktok.com, create an app and add the products Login Kit and Content Posting API (turn on Direct Post).",
      "Add the scopes user.info.basic and video.publish.",
      "In Login Kit, add this Redirect URI:",
      "In Content Posting API, verify the photo address prefix https://api.cleaniqservices.com/ (URL properties), so TikTok can fetch the photos.",
      "Copy the Client key and Client secret into the server .env as TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET, then restart the server.",
      "Submit the app for TikTok review. Until it is approved, TikTok makes every post private (visible only to you).",
    ],
    callbackAt: 2,
  },
  {
    key: "pinterest", networks: ["pinterest"], title: "Pinterest",
    text: "Pins your photos to your boards, linking to the website.",
    steps: [
      "Use a Pinterest business account with at least one board (e.g. Before and after).",
      "Go to developers.pinterest.com, Apps, Connect app, and request Trial access.",
      "In the app settings, add this Redirect URI:",
      "Copy the App ID and App secret key into the server .env as PINTEREST_APP_ID and PINTEREST_APP_SECRET, then restart the server.",
      "Press Connect. Each board shows as its own account, so you choose which board to pin to.",
      "Trial access has low limits; apply for Standard access when you are posting regularly.",
    ],
    callbackAt: 2,
  },
];

function CopyBox({ value }) {
  const [done, setDone] = useState(false);
  return (
    <span className="mt-1.5 flex items-center gap-2 rounded-lg bg-slate-900 text-emerald-200 px-3 py-2 font-mono text-[12px]">
      <span className="truncate flex-1">{value}</span>
      <button type="button" onClick={() => { navigator.clipboard?.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); }} className="shrink-0 text-white/70 hover:text-white" aria-label="Copy">{done ? <CheckCircle2 size={14} /> : <Copy size={14} />}</button>
    </span>
  );
}

export function Accounts({ accounts, status, reload, notify }) {
  const [open, setOpen] = useState("");
  const [busy, setBusy] = useState("");
  const connect = async (key) => {
    setBusy(key);
    try {
      const { url } = await api(`/connect/${key}/start`, { method: "POST" });
      window.location.assign(url);
    } catch (e) {
      notify(e.message, "error");
      setOpen(key);
      setBusy("");
    }
  };
  const toggle = async (a) => {
    await api(`/accounts/${a._id}`, { method: "PATCH", body: { active: !a.active } }).catch((e) => notify(e.message, "error"));
    reload();
  };
  const remove = async (a) => {
    if (!window.confirm(`Disconnect ${a.name}? Scheduled posts won't go to it.`)) return;
    await api(`/accounts/${a._id}`, { method: "DELETE" }).catch((e) => notify(e.message, "error"));
    notify("Disconnected.");
    reload();
  };
  const [now] = useState(() => Date.now());
  const soon = (a) => a.expiresAt && a.network === "linkedin" && new Date(a.expiresAt) - now < 10 * 864e5;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {CONNECT.map((c) => {
          const ready = status?.configured?.[c.key];
          const connected = accounts.filter((a) => c.networks.includes(a.network));
          return (
            <Card key={c.key} className="flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-center gap-1.5">{c.networks.map((n) => <NetworkMark key={n} network={n} size={30} />)}</div>
                <h3 className="font-semibold text-slate-900 mt-4">{c.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{c.text}</p>
                <p className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold ${connected.length ? "text-emerald-700" : ready ? "text-slate-500" : "text-amber-700"}`}>
                  {connected.length ? <><CheckCircle2 size={13} /> {connected.length} connected</> : ready ? "Ready to connect" : <><KeyRound size={13} /> Needs setup first</>}
                </p>
              </div>
              <div className="px-5 pb-5 space-y-2">
                <Button className="w-full" variant={connected.length ? "secondary" : "primary"} onClick={() => connect(c.key)} disabled={!!busy || !ready}><Link2 size={15} /> {busy === c.key ? "Opening…" : connected.length ? "Reconnect / add more" : "Connect"}</Button>
                <button type="button" onClick={() => setOpen(open === c.key ? "" : c.key)} className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 py-1">How to set up <ChevronDown size={14} className={`transition ${open === c.key ? "rotate-180" : ""}`} /></button>
              </div>
            </Card>
          );
        })}
      </div>

      {open && (() => {
        const c = CONNECT.find((x) => x.key === open);
        return (
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">{c.networks.map((n) => <NetworkMark key={n} network={n} size={20} />)} Setting up {c.title}</h3>
            <ol className="mt-4 space-y-3">
              {c.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="min-w-0 flex-1 pt-0.5">{s}{i === c.callbackAt && status?.callbacks?.[c.key] && <CopyBox value={status.callbacks[c.key]} />}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-xs text-slate-500 rounded-lg bg-slate-50 px-3 py-2">App secrets only ever go in the server's .env file. Never paste them into chats or emails.</p>
          </Card>
        );
      })()}

      <Card>
        <CardHeader title="Connected accounts" subtitle="Switched-off accounts aren't ticked by default when you create a post." />
        {accounts.length ? (
          <div className="divide-y divide-slate-100">
            {accounts.map((a) => (
              <div key={a._id} className="flex flex-wrap items-center gap-3.5 px-5 py-3.5">
                <AccountAvatar account={a} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{a.name} <span className="font-normal text-slate-400">{a.handle}</span></p>
                  <p className="text-xs text-slate-500">{NETWORKS[a.network].label} · connected {fmtDate(a.createdAt, { hour: undefined, minute: undefined, year: "numeric" })}</p>
                  {a.status === "error" && <p className="text-xs text-rose-600 mt-1 flex items-start gap-1"><AlertTriangle size={12} className="shrink-0 mt-0.5" /> Last post failed: {a.lastError}</p>}
                  {soon(a) && <p className="text-xs text-amber-700 mt-1">Connection ends {fmtDate(a.expiresAt, { hour: undefined, minute: undefined })} — reconnect LinkedIn before then.</p>}
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <button type="button" role="switch" aria-checked={a.active} onClick={() => toggle(a)} className={`relative w-9 h-5 rounded-full transition ${a.active ? "bg-primary" : "bg-slate-300"}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${a.active ? "left-[18px]" : "left-0.5"}`} /></button>
                  {a.active ? "On" : "Off"}
                </label>
                <Button variant="ghost" size="sm" onClick={() => remove(a)} className="hover:!text-rose-600"><Unplug size={14} /> Disconnect</Button>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={Link2} title="No accounts connected" text="Set up a network above, then press Connect and approve access." />
        )}
      </Card>
    </div>
  );
}

export function Photos({ notify }) {
  const [lib, setLib] = useState(null);
  const [busy, setBusy] = useState(false);
  const [desc, setDesc] = useState("");
  const load = () => api("/photos").then(setLib).catch((e) => notify(e.message, "error"));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const upload = async (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("photos", f));
      form.append("description", desc);
      await api("/photos", { method: "POST", form });
      setDesc("");
      notify(`${files.length} photo${files.length > 1 ? "s" : ""} added.`);
      load();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  };
  const saveDesc = (p, description) => api(`/photos/${p._id}`, { method: "PATCH", body: { description } }).catch((e) => notify(e.message, "error"));
  const remove = async (p) => {
    if (!window.confirm("Remove this photo from the library? Posts that used it keep it.")) return;
    await api(`/photos/${p._id}`, { method: "DELETE" });
    load();
  };
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className={labelCls} htmlFor="ph-desc">What's in the photos? (helps Claude pick the right one)</label>
            <input id="ph-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. Kitchen after an end of tenancy clean in Salford" className={inputCls} />
          </div>
          <label className={`inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold cursor-pointer ${busy ? "bg-slate-100 text-slate-400" : "bg-primary text-white hover:bg-primary-dark"}`}>
            <Upload size={16} /> {busy ? "Uploading…" : "Upload photos or videos"}
            <input type="file" accept="image/jpeg,image/png,video/mp4,video/quicktime" multiple className="hidden" onChange={upload} disabled={busy} />
          </label>
        </div>
        <p className="text-xs text-slate-500 mt-2">Photos: JPEG or PNG, up to 8 MB (use JPEG for Instagram). Videos: MP4 or MOV, up to 500 MB.</p>
      </Card>
      {!lib ? <p className="text-sm text-slate-400">Loading…</p> : (
        <>
          <Card>
            <CardHeader title="Uploaded photos & videos" subtitle="Click a description to change it." />
            {lib.uploaded.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 p-5 pt-2">
                {lib.uploaded.map((p) => (
                  <div key={p._id} className="group">
                    <div className="relative aspect-square rounded-xl overflow-hidden ring-1 ring-slate-200">
                      {p.kind === "video" ? <video src={photoUrl(p.ref)} muted controls preload="metadata" className="w-full h-full object-cover bg-black" /> : <img src={photoUrl(p.ref)} alt={p.description} loading="lazy" className="w-full h-full object-cover" />}
                      <button type="button" onClick={() => remove(p)} className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/95 text-rose-600 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition" aria-label="Remove"><Trash2 size={14} /></button>
                    </div>
                    <input defaultValue={p.description} onBlur={(e) => e.target.value !== p.description && saveDesc(p, e.target.value)} placeholder="Add a description" className="mt-2 w-full text-xs text-slate-600 bg-transparent border-0 border-b border-transparent hover:border-slate-200 focus:border-primary focus:outline-none px-0 py-1" />
                  </div>
                ))}
              </div>
            ) : <Empty icon={ImageIcon} title="No uploaded photos yet" text="Upload photos from jobs to use in posts. The autopilot can pick them too." />}
          </Card>
          <Card>
            <CardHeader title="Our job photos" subtitle="From the website. The autopilot uses these first." />
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3 p-5 pt-2">
              {lib.ours.map((p) => <img key={p.ref} src={photoUrl(p.ref)} alt={p.description} title={p.description} loading="lazy" className="aspect-square w-full rounded-xl object-cover ring-1 ring-slate-200" />)}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export function Team({ notify }) {
  const [list, setList] = useState(null);
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const load = () => api("/users").then(setList).catch((e) => notify(e.message, "error"));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/users", { method: "POST", body: f });
      notify(`Login created for ${f.name}. Share the password with them privately.`);
      setF({ name: "", email: "", password: "" });
      load();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  };
  const patch = async (u, body, msg) => {
    try { await api(`/users/${u._id}`, { method: "PATCH", body }); notify(msg); load(); } catch (e) { notify(e.message, "error"); }
  };
  const remove = async (u) => {
    if (!window.confirm(`Remove ${u.name}'s login?`)) return;
    await api(`/users/${u._id}`, { method: "DELETE" });
    load();
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
      <Card>
        <CardHeader title="Social media logins" subtitle="They can post and schedule here only — no bookings, customers or payments." />
        {list?.length ? (
          <div className="divide-y divide-slate-100">
            {list.map((u) => (
              <div key={u._id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <span className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">{u.name.charAt(0).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{u.name} {!u.active && <span className="ml-1 text-[11px] font-semibold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">Off</span>}</p>
                  <p className="text-xs text-slate-500">{u.email} · {u.lastLoginAt ? `last signed in ${fmtDate(u.lastLoginAt)}` : "hasn't signed in yet"}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { const p = window.prompt(`New password for ${u.name} (at least 10 characters):`); if (p) patch(u, { password: p }, "Password changed."); }}>Change password</Button>
                <Button variant="ghost" size="sm" onClick={() => patch(u, { active: !u.active }, u.active ? "Login switched off." : "Login switched on.")}>{u.active ? "Switch off" : "Switch on"}</Button>
                <Button variant="ghost" size="sm" onClick={() => remove(u)} className="hover:!text-rose-600" aria-label="Remove"><Trash2 size={14} /></Button>
              </div>
            ))}
          </div>
        ) : <Empty icon={Users} title="No social media logins yet" text="Give someone their own login so they can post without the main admin." />}
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Plus size={16} /> Add a login</h3>
        <form onSubmit={add} className="space-y-3 mt-4">
          <div><label className={labelCls} htmlFor="t-name">Name</label><input id="t-name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls} htmlFor="t-email">Email</label><input id="t-email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls} htmlFor="t-pass">Password (at least 10 characters)</label><input id="t-pass" type="text" minLength={10} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className={inputCls} autoComplete="new-password" /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create login"}</Button>
        </form>
      </Card>
    </div>
  );
}
