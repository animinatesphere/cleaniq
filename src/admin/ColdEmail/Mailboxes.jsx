import { useState, useEffect } from "react";
import { Inbox, Plus, Trash2, Pause, Play, RefreshCw, AlertCircle } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const token = () => localStorage.getItem("adminToken") || "";

function authFetch(url, opts = {}) {
  return fetch(url, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}`, ...(opts.headers || {}) } });
}

export default function Mailboxes() {
  const [mailboxes, setMailboxes] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editId, setEditId]       = useState(null);
  const [editLimit, setEditLimit] = useState("");
  const [saving, setSaving]       = useState(false);

  async function load() {
    setLoading(true);
    const r = await authFetch(`${API}/cold-email/mailboxes`);
    const d = await r.json();
    setMailboxes(Array.isArray(d) ? d : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!confirm("Disconnect this mailbox? Pending sends from this mailbox will need to be rescheduled.")) return;
    await authFetch(`${API}/cold-email/mailboxes/${id}`, { method: "DELETE" });
    load();
  }

  async function togglePause(box) {
    const status = box.status === "active" ? "paused" : "active";
    await authFetch(`${API}/cold-email/mailboxes/${box._id}`, {
      method: "PATCH",
      body:   JSON.stringify({ status }),
    });
    load();
  }

  async function saveLimit(id) {
    setSaving(true);
    await authFetch(`${API}/cold-email/mailboxes/${id}`, {
      method: "PATCH",
      body:   JSON.stringify({ dailyLimit: Number(editLimit) }),
    });
    setSaving(false);
    setEditId(null);
    load();
  }

  const gmailAuthUrl = `${API}/cold-email/auth/google`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-black text-lg">Connected Mailboxes</h2>
          <p className="text-white/40 text-sm mt-0.5">Outbound emails rotate across your connected Gmail accounts</p>
        </div>
        <a
          href={gmailAuthUrl}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-800 font-bold text-sm rounded-xl hover:bg-gray-100 transition-all shadow-lg"
        >
          {/* Google G */}
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.4 30.2 0 24 0 14.8 0 6.9 5.4 3 13.3l7.8 6C12.7 13.3 17.9 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.2-10.1 7.2-17z"/>
            <path fill="#FBBC05" d="M10.8 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.7l8.3-6z"/>
            <path fill="#34A853" d="M24 48c6.2 0 11.4-2.1 15.2-5.6l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.1 0-11.3-3.8-13.2-9.2l-8.3 6C6.9 42.6 14.8 48 24 48z"/>
          </svg>
          Connect Gmail
        </a>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mailboxes.length === 0 ? (
        <div className="bg-[#0B2D22] border border-white/[0.06] border-dashed rounded-2xl py-20 flex flex-col items-center text-center px-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
            <Inbox size={28} className="text-emerald-400/60" />
          </div>
          <h3 className="text-white font-bold text-base mb-1">No mailboxes connected yet</h3>
          <p className="text-white/30 text-sm max-w-xs mb-6">
            Connect your Gmail account to start sending cold emails. You can connect multiple accounts to rotate and stay within daily limits.
          </p>
          <a
            href={gmailAuthUrl}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-800 font-bold text-sm rounded-xl hover:bg-gray-100 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.4 30.2 0 24 0 14.8 0 6.9 5.4 3 13.3l7.8 6C12.7 13.3 17.9 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.2-10.1 7.2-17z"/>
              <path fill="#FBBC05" d="M10.8 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.7l8.3-6z"/>
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2.1 15.2-5.6l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.1 0-11.3-3.8-13.2-9.2l-8.3 6C6.9 42.6 14.8 48 24 48z"/>
            </svg>
            Connect your first Gmail account
          </a>
          <p className="text-white/20 text-xs mt-4">
            You'll be asked to grant Gmail Send and Read permissions. Tokens are encrypted and stored securely.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {mailboxes.map((box) => {
            const pct   = box.dailyLimit > 0 ? Math.min(100, Math.round((box.sentToday / box.dailyLimit) * 100)) : 0;
            const isEdit = editId === box._id;
            return (
              <div key={box._id} className="bg-[#0B2D22] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0 shadow">
                    <svg width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.4 30.2 0 24 0 14.8 0 6.9 5.4 3 13.3l7.8 6C12.7 13.3 17.9 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.2-10.1 7.2-17z"/>
                      <path fill="#FBBC05" d="M10.8 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.7l8.3-6z"/>
                      <path fill="#34A853" d="M24 48c6.2 0 11.4-2.1 15.2-5.6l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.1 0-11.3-3.8-13.2-9.2l-8.3 6C6.9 42.6 14.8 48 24 48z"/>
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-bold text-sm">{box.email}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        box.status === "active" ? "bg-emerald-500/15 text-emerald-400" :
                        box.status === "paused" ? "bg-amber-500/15 text-amber-400"   :
                                                   "bg-rose-500/15 text-rose-400"
                      }`}>{box.status}</span>
                    </div>

                    {box.status === "error" && box.errorMessage && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <AlertCircle size={12} className="text-rose-400 shrink-0" />
                        <p className="text-rose-400 text-xs">{box.errorMessage}</p>
                      </div>
                    )}

                    {/* Daily usage */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-white/40">Today's sends</span>
                        <span className={`font-bold ${pct >= 100 ? "text-rose-400" : pct >= 80 ? "text-amber-400" : "text-white/60"}`}>
                          {box.sentToday} / {box.dailyLimit}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-400" : "bg-emerald-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Daily limit edit */}
                    <div className="mt-3 flex items-center gap-2">
                      {isEdit ? (
                        <>
                          <span className="text-white/40 text-xs">Daily limit:</span>
                          <input
                            type="number"
                            value={editLimit}
                            onChange={(e) => setEditLimit(e.target.value)}
                            min="1" max="500"
                            className="w-20 bg-white/[0.07] border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-emerald-500/40"
                          />
                          <button onClick={() => saveLimit(box._id)} disabled={saving} className="text-xs text-emerald-400 font-bold hover:text-emerald-300 cursor-pointer">
                            {saving ? "Saving…" : "Save"}
                          </button>
                          <button onClick={() => setEditId(null)} className="text-xs text-white/30 hover:text-white/60 cursor-pointer">Cancel</button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setEditId(box._id); setEditLimit(String(box.dailyLimit)); }}
                          className="text-xs text-white/30 hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          Daily limit: {box.dailyLimit} — Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => togglePause(box)}
                      title={box.status === "active" ? "Pause" : "Resume"}
                      className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-all cursor-pointer"
                    >
                      {box.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button
                      onClick={() => remove(box._id)}
                      title="Disconnect"
                      className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Setup instructions */}
      <div className="bg-[#0B2D22]/60 border border-white/[0.04] rounded-xl p-4">
        <p className="text-white/50 text-xs font-bold mb-1">Setup required in Google Cloud Console</p>
        <p className="text-white/30 text-xs leading-relaxed">
          Add <code className="text-emerald-400">{`${API}/cold-email/auth/callback`}</code> as an Authorised redirect URI.
          Set <code className="text-emerald-400">GOOGLE_CLIENT_ID</code> and <code className="text-emerald-400">GOOGLE_CLIENT_SECRET</code> in your server <code className="text-white/40">.env</code> file.
          For production add <code className="text-emerald-400">COLD_EMAIL_DRY_RUN=false</code> — while it's <code className="text-amber-400">true</code> sends are only logged, not delivered.
        </p>
      </div>
    </div>
  );
}
