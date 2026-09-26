import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, X, Eye, EyeOff } from "lucide-react";
import { aiApi } from "./api";

const CATEGORIES = ["FAQ", "Policy", "Hours", "Area", "Booking", "Other"];
const BLANK = { title: "", content: "", category: "FAQ" };

// Topics customers usually ask about. Titles only; the answers must come from the team.
const SUGGESTIONS = [
  { title: "Opening hours", category: "Hours" },
  { title: "Areas we cover", category: "Area" },
  { title: "Minimum booking length", category: "Booking" },
  { title: "Cancellation and rescheduling policy", category: "Policy" },
  { title: "Do cleaners bring their own products and equipment?", category: "FAQ" },
  { title: "How to book", category: "Booking" },
  { title: "Payment methods", category: "Policy" },
  { title: "Keys and access", category: "FAQ" },
];

const inputCls =
  "w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50";

export default function AiKnowledge() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null); // null = closed; { _id? , title, content, category }
  const [saving, setSaving] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let active = true;
    aiApi("/knowledge")
      .then((data) => { if (active) setEntries(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = { title: form.title.trim(), content: form.content.trim(), category: form.category };
      if (form._id) await aiApi(`/knowledge/${form._id}`, { method: "PUT", body });
      else await aiApi("/knowledge", { method: "POST", body });
      setForm(null);
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (entry) => {
    try {
      await aiApi(`/knowledge/${entry._id}`, { method: "PUT", body: { active: !entry.active } });
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (entry) => {
    if (!window.confirm(`Delete "${entry.title}"? The AI will stop using it immediately.`)) return;
    try {
      await aiApi(`/knowledge/${entry._id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const existingTitles = new Set(entries.map((e) => e.title.toLowerCase()));
  const missingSuggestions = SUGGESTIONS.filter((s) => !existingTitles.has(s.title.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-white/50 max-w-2xl">
          The AI only answers from what's written here, plus your prices from{" "}
          <Link to="/admin/services" className="text-emerald-400 hover:underline">Services</Link>. Changes apply to the next
          message or call.
        </p>
        <button
          onClick={() => setForm({ ...BLANK })}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-colors shrink-0"
        >
          <Plus size={16} /> Add entry
        </button>
      </div>

      {error && <div className="bg-rose-500/10 border border-rose-500/25 text-rose-300 rounded-2xl p-4 text-sm">{error}</div>}

      {form && (
        <form onSubmit={save} className="bg-[#0B2D22] border border-emerald-500/25 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">{form._id ? "Edit entry" : "New entry"}</h2>
            <button type="button" onClick={() => setForm(null)} className="text-white/40 hover:text-white"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              required
              placeholder="Title, e.g. Cancellation policy"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={`${inputCls} sm:col-span-2`}
            />
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#0B2D22]">{c}</option>)}
            </select>
          </div>
          <textarea
            required
            rows={5}
            placeholder="Write the answer exactly as you want the AI to give it. Be specific: times, amounts, conditions."
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            className={`${inputCls} resize-y`}
          />
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      )}

      <div className="bg-[#0B2D22] border border-white/7 rounded-2xl divide-y divide-white/[0.04]">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 px-6 text-white/40">
            <p className="text-3xl mb-2">📚</p>
            <p className="text-sm font-medium">No business information yet. Until you add some, the AI can only quote prices.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry._id} className={`px-6 py-4 flex gap-4 ${entry.active ? "" : "opacity-50"}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-white">{entry.title}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase bg-white/5 text-white/50 border-white/10">
                    {entry.category}
                  </span>
                  {!entry.active && <span className="text-[10px] font-bold uppercase text-amber-400">Hidden from AI</span>}
                </div>
                <p className="text-sm text-white/60 mt-1 whitespace-pre-wrap">{entry.content}</p>
              </div>
              <div className="flex items-start gap-1 shrink-0">
                <button onClick={() => toggleActive(entry)} title={entry.active ? "Hide from AI" : "Show to AI"} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5">
                  {entry.active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => setForm({ _id: entry._id, title: entry.title, content: entry.content, category: entry.category })} title="Edit" className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5">
                  <Pencil size={16} />
                </button>
                <button onClick={() => remove(entry)} title="Delete" className="p-2 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && missingSuggestions.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Customers often ask about</h2>
          <div className="flex flex-wrap gap-2">
            {missingSuggestions.map((s) => (
              <button
                key={s.title}
                onClick={() => setForm({ ...BLANK, title: s.title, category: s.category })}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors"
              >
                <Plus size={12} /> {s.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
