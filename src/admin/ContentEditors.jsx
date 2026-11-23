// Admin → Website Content: open the content editor, and manage content editor logins
// (people who can edit website text at /content-admin but can't see anything else).
import { useEffect, useState } from "react";
import { Globe, UserPlus, Trash2, KeyRound, ExternalLink, Power } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const call = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-white/25";

export default function ContentEditors() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState(null);

  const load = () => call("/content-editors").then(setList).catch((e) => setMsg({ type: "error", text: e.message }));
  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    try {
      await call("/content-editors", { method: "POST", body: JSON.stringify(form) });
      setMsg({ type: "success", text: `Account created for ${form.email}. Send them the password securely (not by email), and the sign-in link below.` });
      setForm({ name: "", email: "", password: "" });
      load();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  };
  const toggle = async (ed) => {
    await call(`/content-editors/${ed._id}`, { method: "PATCH", body: JSON.stringify({ active: !ed.active }) }).catch((e) => setMsg({ type: "error", text: e.message }));
    load();
  };
  const resetPassword = async (ed) => {
    const password = window.prompt(`New password for ${ed.email} (at least 10 characters):`);
    if (!password) return;
    try {
      await call(`/content-editors/${ed._id}`, { method: "PATCH", body: JSON.stringify({ password }) });
      setMsg({ type: "success", text: `Password changed for ${ed.email}. They'll need to sign in again.` });
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  };
  const remove = async (ed) => {
    if (!window.confirm(`Remove ${ed.name}'s content editor login?`)) return;
    await call(`/content-editors/${ed._id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-primary p-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Globe size={22} /> Website Content</h1>
          <p className="text-sm text-white/60 mt-1">Edit the website's text with a live preview, then publish. Content editors get their own login and can't see anything else.</p>
        </div>
        <a href="/content-admin" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm">
          Open the content editor <ExternalLink size={15} />
        </a>
      </div>

      {msg && <p className={`px-4 py-3 rounded-xl text-sm font-semibold ${msg.type === "error" ? "bg-rose-500/15 text-rose-300" : "bg-emerald-500/15 text-emerald-300"}`}>{msg.text}</p>}

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6">
        <form onSubmit={add} className="bg-[#0B2D22] rounded-2xl border border-white/7 p-5 space-y-3">
          <h2 className="text-sm font-bold text-white/80 flex items-center gap-2"><UserPlus size={15} /> Add a content editor</h2>
          <input className={inputCls} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={inputCls} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className={inputCls} type="text" placeholder="Password (at least 10 characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={10} />
          <button className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm">Create login</button>
          <p className="text-xs text-white/40">They sign in at <span className="text-white/70">{window.location.origin}/content-admin</span></p>
        </form>

        <div className="bg-[#0B2D22] rounded-2xl border border-white/7 p-5">
          <h2 className="text-sm font-bold text-white/80 mb-3">Content editors</h2>
          {list.length === 0 && <p className="text-sm text-white/40">No content editors yet.</p>}
          <ul className="divide-y divide-white/5">
            {list.map((ed) => (
              <li key={ed._id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{ed.name} {!ed.active && <span className="ml-1 text-[10px] uppercase text-rose-300">disabled</span>}</p>
                  <p className="text-xs text-white/50">{ed.email}{ed.lastLoginAt ? ` · last signed in ${new Date(ed.lastLoginAt).toLocaleDateString("en-GB")}` : " · never signed in"}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => resetPassword(ed)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70" title="Change password"><KeyRound size={15} /></button>
                  <button onClick={() => toggle(ed)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70" title={ed.active ? "Disable" : "Enable"}><Power size={15} /></button>
                  <button onClick={() => remove(ed)} className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-300" title="Remove"><Trash2 size={15} /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
