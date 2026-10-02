import React, { useEffect, useState } from "react";
import { Percent, Check, RefreshCw } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

// Settings → Tax: when on, the rate is added on top of service prices on the website, in the
// customer app and on regular-clean visits. Customers see it as its own line.
export default function TaxSettings() {
  const [tax, setTax] = useState({ enabled: false, rate: "20", label: "VAT" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    fetch(`${API}/settings/tax`)
      .then((r) => r.json())
      .then((t) => setTax({ enabled: !!t.enabled, rate: String(t.rate ?? 20), label: t.label || "VAT" }))
      .catch(() => {});
  }, []);

  const save = async (next = tax) => {
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const value = { enabled: next.enabled, rate: parseFloat(next.rate) || 0, label: next.label || "VAT" };
      const res = await fetch(`${API}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "tax", value }),
      });
      if (!res.ok) throw new Error();
      setMsg({
        type: "ok",
        text: value.enabled
          ? `${value.label} at ${value.rate}% is now added to prices on the website and the app.`
          : `${value.label} is off. Prices are charged as they are.`,
      });
    } catch {
      setMsg({ type: "err", text: "Couldn't save. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const rate = parseFloat(tax.rate) || 0;
  return (
    <div className="border border-white/[0.07] rounded-2xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tax.enabled ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.06] text-white/30"}`}>
            <Percent size={20} />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Tax on bookings</p>
            <p className="text-xs text-white/40 font-medium mt-1 leading-relaxed">
              When <span className="text-emerald-400 font-semibold">ON</span>, this tax is added on top of your service prices on the website and the customer app,
              shown to the customer as its own line, and included in what they pay, including each regular-clean visit.
            </p>
          </div>
        </div>
        <button
          onClick={() => { const next = { ...tax, enabled: !tax.enabled }; setTax(next); save(next); }}
          disabled={saving}
          className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-all duration-300 focus:outline-none disabled:opacity-60 ${tax.enabled ? "bg-emerald-500" : "bg-white/[0.12]"}`}
          title={tax.enabled ? "Switch tax off" : "Switch tax on"}
        >
          <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${tax.enabled ? "left-8" : "left-1"}`} />
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-4 pl-14">
        <label className="text-xs font-bold text-white/50">
          Name shown to customers
          <input
            value={tax.label}
            onChange={(e) => setTax({ ...tax, label: e.target.value })}
            maxLength={20}
            className="block mt-1 w-32 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white font-bold focus:outline-none focus:border-emerald-500/50"
          />
        </label>
        <label className="text-xs font-bold text-white/50">
          Rate
          <div className="flex items-center gap-1.5 mt-1">
            <input
              type="number" min="0" max="100" step="0.5"
              value={tax.rate}
              onChange={(e) => setTax({ ...tax, rate: e.target.value })}
              className="w-24 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white font-bold text-center focus:outline-none focus:border-emerald-500/50"
            />
            <span className="text-white/40">%</span>
          </div>
        </label>
        <button
          onClick={() => save()}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />} Save
        </button>
        <p className="text-xs text-white/40 w-full">
          Example: a £100.00 clean becomes £{(100 + rate).toFixed(2)} ({tax.label || "VAT"} £{rate.toFixed(2)}).
        </p>
      </div>
      {msg.text && <p className={`pl-14 text-xs font-bold ${msg.type === "ok" ? "text-emerald-400" : "text-rose-400"}`}>{msg.text}</p>}
    </div>
  );
}
