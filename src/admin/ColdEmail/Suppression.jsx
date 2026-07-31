import { useState, useEffect, useCallback } from "react";
import { ShieldOff, Plus, Trash2, Search, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}` });
function afetch(url, opts = {}) {
  return fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...auth(), ...(opts.headers || {}) } });
}

const REASON_STYLE = {
  unsubscribed: "bg-amber-500/15 text-amber-400",
  bounced:      "bg-rose-500/15 text-rose-400",
  manual:       "bg-white/[0.07] text-white/40",
};

export default function Suppression() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [addEmail, setAddEmail] = useState("");
  const [adding,   setAdding]   = useState(false);
  const [addErr,   setAddErr]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 50, search });
    const r = await fetch(`${API}/cold-email/suppression?${params}`, { headers: auth() });
    const d = await r.json();
    setItems(d.items || []);
    setTotal(d.total || 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  async function addToList() {
    const email = addEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setAddErr("Invalid email address"); return; }
    setAdding(true);
    setAddErr("");
    const r = await afetch(`${API}/cold-email/suppression`, { method: "POST", body: JSON.stringify({ email }) });
    const d = await r.json();
    if (d.message && !d._id) { setAddErr(d.message); setAdding(false); return; }
    setAddEmail("");
    setAdding(false);
    load();
  }

  async function remove(email) {
    await afetch(`${API}/cold-email/suppression/${encodeURIComponent(email)}`, { method: "DELETE" });
    load();
  }

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-white font-black text-lg">Suppression List</h2>
        <p className="text-white/40 text-sm mt-0.5">
          {total.toLocaleString()} suppressed address{total !== 1 ? "es" : ""} — these will never receive emails from any campaign
        </p>
      </div>

      {/* Add email */}
      <div className="bg-[#0B2D22] border border-white/[0.06] rounded-xl p-4">
        <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Add email manually</p>
        <div className="flex gap-2">
          <input
            type="email"
            value={addEmail}
            onChange={(e) => { setAddEmail(e.target.value); setAddErr(""); }}
            onKeyDown={(e) => e.key === "Enter" && addToList()}
            placeholder="email@example.com"
            className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40"
          />
          <button
            onClick={addToList}
            disabled={adding || !addEmail.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-400 cursor-pointer disabled:opacity-40 shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap"
          >
            {adding ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={14} />}
            Add
          </button>
        </div>
        {addErr && <p className="text-rose-400 text-xs mt-2">{addErr}</p>}
      </div>

      {/* Table */}
      <div className="bg-[#0B2D22] border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Search */}
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppressed emails…"
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-8 pr-4 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40"
            />
          </div>
          {search && <button onClick={() => setSearch("")} className="text-white/30 hover:text-white/60 cursor-pointer"><X size={14} /></button>}
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_110px_120px_40px] gap-x-4 px-5 py-2.5 border-b border-white/[0.04] text-[10px] font-bold text-white/30 uppercase tracking-wider">
          <span>Email</span>
          <span>Reason</span>
          <span>Added</span>
          <span />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center px-6">
            <div className="w-12 h-12 bg-white/[0.04] rounded-xl flex items-center justify-center mb-3">
              <ShieldOff size={20} className="text-white/20" />
            </div>
            <p className="text-white/30 text-sm font-medium">
              {search ? "No results match your search" : "Suppression list is empty"}
            </p>
            {!search && (
              <p className="text-white/20 text-xs mt-1 max-w-xs">
                Emails are automatically added here when contacts unsubscribe or hard bounce. You can also add them manually above.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="max-h-[480px] overflow-y-auto">
              {items.map((item) => (
                <div key={item._id} className="grid grid-cols-[1fr_110px_120px_40px] gap-x-4 px-5 py-3 border-b border-white/[0.03] items-center hover:bg-white/[0.02] transition-colors last:border-0">
                  <span className="text-white/70 text-sm font-medium truncate">{item.email}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider w-fit ${REASON_STYLE[item.reason] || REASON_STYLE.manual}`}>
                    {item.reason}
                  </span>
                  <span className="text-white/30 text-xs">
                    {new Date(item.addedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <button
                    onClick={() => remove(item.email)}
                    title="Remove from suppression list"
                    className="text-white/20 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
                <p className="text-white/30 text-xs">{total.toLocaleString()} suppressed · page {page} of {totalPages}</p>
                <div className="flex gap-1.5">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.07] text-white/50 text-xs font-semibold hover:bg-white/10 disabled:opacity-30 cursor-pointer disabled:cursor-default">
                    Prev
                  </button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.07] text-white/50 text-xs font-semibold hover:bg-white/10 disabled:opacity-30 cursor-pointer disabled:cursor-default">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-[#0B2D22]/50 border border-white/[0.04] rounded-xl p-4">
        <p className="text-white/30 text-xs leading-relaxed">
          <span className="text-white/50 font-semibold">How suppression works: </span>
          Every email send checks this list first. Suppressed addresses are <em>never</em> emailed, regardless of campaign.
          Addresses are added automatically when someone clicks the unsubscribe link, or when a hard bounce is detected.
          Removing an address here allows it to be emailed again — use with caution.
        </p>
      </div>
    </div>
  );
}
