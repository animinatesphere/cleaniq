import { useState, useEffect } from "react";
import { Save, MessageCircle, PhoneCall } from "lucide-react";
import { aiApi } from "./api";

const inputCls =
  "w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50";
const labelCls = "block text-xs font-bold text-white/40 mb-1.5 uppercase tracking-wider";

function Toggle({ checked, onChange, icon: Icon, label, hint }) {
  return (
    <label className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.03] cursor-pointer">
      <Icon size={18} className="text-white/40 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-xs text-white/40">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-emerald-500" : "bg-white/15"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </label>
  );
}

export default function AiSettingsPage() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [previewChannel, setPreviewChannel] = useState("whatsapp");
  const [preview, setPreview] = useState("");

  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    aiApi("/settings")
      .then((s) =>
        setForm({
          businessName: s.businessName || "",
          serviceArea: s.serviceArea || "",
          transferNumber: s.transferNumber || "",
          instructions: s.instructions || "",
          voiceEnabled: Boolean(s.voiceEnabled),
          whatsappEnabled: Boolean(s.whatsappEnabled),
        }),
      )
      .catch((err) => setMsg({ type: "error", text: err.message }));
  }, []);

  useEffect(() => {
    let active = true;
    aiApi(`/prompt-preview?channel=${previewChannel}`)
      .then((data) => { if (active) setPreview(data.instructions); })
      .catch((err) => { if (active) setPreview(`Could not load preview: ${err.message}`); });
    return () => { active = false; };
  }, [previewChannel, previewKey]);

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const saved = await aiApi("/settings", { method: "PUT", body: form });
      setForm((f) => ({ ...f, transferNumber: saved.transferNumber || "" }));
      setMsg({ type: "success", text: "Settings saved. They apply to the next message or call." });
      setPreviewKey((k) => k + 1);
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return msg.text ? (
      <div className="bg-rose-500/10 border border-rose-500/25 text-rose-300 rounded-2xl p-4 text-sm">{msg.text}</div>
    ) : (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <form onSubmit={save} className="bg-[#0B2D22] border border-white/7 rounded-2xl p-6 space-y-5">
        <div className="space-y-3">
          <Toggle
            checked={form.whatsappEnabled}
            onChange={set("whatsappEnabled")}
            icon={MessageCircle}
            label="AI replies on WhatsApp"
            hint="When off, messages still arrive in the inbox for staff to answer."
          />
          <Toggle
            checked={form.voiceEnabled}
            onChange={set("voiceEnabled")}
            icon={PhoneCall}
            label="AI answers phone calls"
            hint="When off, calls go straight to the transfer number."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Business name</label>
            <input value={form.businessName} onChange={(e) => set("businessName")(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Transfer calls to</label>
            <input
              value={form.transferNumber}
              onChange={(e) => set("transferNumber")(e.target.value)}
              placeholder="07700 900123"
              inputMode="tel"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Area served</label>
          <input value={form.serviceArea} onChange={(e) => set("serviceArea")(e.target.value)} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Extra instructions for the AI</label>
          <textarea
            rows={6}
            value={form.instructions}
            onChange={(e) => set("instructions")(e.target.value)}
            placeholder="Tone and style, e.g. “Be warm and professional. Always ask for the customer's postcode when they ask about booking.”"
            className={`${inputCls} resize-y`}
          />
          <p className="text-xs text-white/30 mt-1.5">
            Added on top of built-in safety rules (only answer from your information, never invent prices, stay on topic).
          </p>
        </div>

        {msg.text && (
          <div className={`rounded-xl p-3 text-sm border ${msg.type === "success" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300" : "bg-rose-500/10 border-rose-500/25 text-rose-300"}`}>
            {msg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
        >
          <Save size={16} /> {saving ? "Saving…" : "Save settings"}
        </button>
      </form>

      <div className="bg-[#0B2D22] border border-white/7 rounded-2xl">
        <div className="px-6 py-4 flex items-center justify-between gap-3 border-b border-white/[0.04]">
          <h2 className="text-sm font-bold text-white/40 uppercase tracking-widest">What the AI is told</h2>
          <div className="flex rounded-lg bg-white/5 p-0.5">
            {["whatsapp", "voice"].map((c) => (
              <button
                key={c}
                onClick={() => setPreviewChannel(c)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${previewChannel === c ? "bg-emerald-500 text-white" : "text-white/40 hover:text-white"}`}
              >
                {c === "whatsapp" ? "WhatsApp" : "Phone"}
              </button>
            ))}
          </div>
        </div>
        <pre className="p-6 text-xs text-white/70 whitespace-pre-wrap font-mono leading-relaxed max-h-[70vh] overflow-y-auto">
          {preview || "Loading…"}
        </pre>
      </div>
    </div>
  );
}
