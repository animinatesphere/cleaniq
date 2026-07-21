import { useState, useRef, useEffect } from "react";
import html2pdf from "html2pdf.js";
import {
  Camera, Film, Plus, Trash2, Download, Send,
  X, ChevronDown, ChevronUp, Play, RefreshCw,
  Clock, AlertCircle, CheckCircle2,
} from "lucide-react";
import logoSrc from "../assets/lOGO.png";

const API = import.meta.env.VITE_API_URL;

const PDF_OPTS = {
  margin: 0,
  image: { type: "jpeg", quality: 0.88 },
  html2canvas: { scale: 1.6, useCORS: true, allowTaint: true, logging: false },
  jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait", hotfixes: ["px_scaling"] },
  pagebreak: { mode: ["avoid-all"] },
};

const REASONS = [
  "Property significantly dirtier than described at booking",
  "Additional rooms/areas require cleaning",
  "Heavy build-up of grease in kitchen",
  "Bathroom/toilet requires deep clean",
  "Carpets and floors need extra attention",
  "Clutter needs clearing before cleaning can begin",
  "Property not cleaned for an extended period",
  "More rooms than specified at time of booking",
  "Other (see notes below)",
];

const EXTRA_HOURS = [0.5, 1, 1.5, 2, 2.5, 3, 4];

const readMedia = (file) =>
  new Promise((res) => {
    if (file.type.startsWith("video/")) {
      res({ type: "video", src: URL.createObjectURL(file), name: file.name });
    } else {
      const r = new FileReader();
      r.onload = (e) => res({ type: "image", src: e.target.result, name: file.name });
      r.readAsDataURL(file);
    }
  });

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
    {msg}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={15} /></button>
  </div>
);

const MediaGrid = ({ items, onAdd, onRemove, label, hint }) => {
  const ref = useRef(null);
  const handle = async (e) => {
    const files = Array.from(e.target.files);
    onAdd(await Promise.all(files.map(readMedia)));
    e.target.value = "";
  };
  return (
    <div>
      {label && (
        <div className="mb-2">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{label}</p>
          {hint && <p className="text-[10px] text-white/40 mt-0.5">{hint}</p>}
        </div>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {(items || []).map((item, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group bg-white/10">
            {item.type === "video" ? (
              <>
                <video src={item.src} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play size={16} className="text-white" fill="white" />
                </div>
              </>
            ) : (
              <img src={item.src} alt="" className="w-full h-full object-cover" />
            )}
            <button
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 bg-black/70 rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            >
              <X size={9} className="text-white" />
            </button>
          </div>
        ))}
        <button
          onClick={() => ref.current?.click()}
          className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 text-white/40 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
        >
          <div className="flex items-center gap-0.5"><Camera size={13} /><Film size={11} /></div>
          <span className="text-[9px] font-bold">Add Photo</span>
        </button>
      </div>
      <input ref={ref} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handle} />
    </div>
  );
};

// ── Area Section: each room/area the worker photographed ──────────────────────
const defaultAreas = (booking) => {
  const bedrooms  = parseInt(booking?.details?.bedrooms  || booking?.property?.bedrooms  || 0);
  const bathrooms = parseInt(booking?.details?.bathrooms || booking?.property?.bathrooms || 0);
  const areas = [{ id: 1, label: "Living Room", photos: [] }];
  areas.push({ id: 2, label: "Kitchen", photos: [] });
  for (let i = 0; i < Math.max(1, bedrooms); i++)
    areas.push({ id: 100 + i, label: `Bedroom ${i + 1}`, photos: [] });
  for (let i = 0; i < Math.max(1, bathrooms); i++)
    areas.push({ id: 200 + i, label: `Bathroom ${i + 1}`, photos: [] });
  return areas;
};

// ── Scoped PDF CSS ─────────────────────────────────────────────────────────────
const CSS = `
#dom-rpt *{margin:0;padding:0;box-sizing:border-box}
#dom-rpt{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#1e293b;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;width:794px}
#dom-rpt .hdr{background:#0A5C43;display:flex;align-items:stretch;min-height:96px}
#dom-rpt .hdr-brand{display:flex;align-items:center;padding:20px 24px;border-right:1px solid rgba(255,255,255,.15);min-width:176px}
#dom-rpt .hdr-logo{height:50px;width:auto;display:block}
#dom-rpt .hdr-main{flex:1;display:flex;flex-direction:column;justify-content:center;padding:20px 24px}
#dom-rpt .hdr-type{color:rgba(255,255,255,.5);font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin-bottom:5px}
#dom-rpt .hdr-title{color:#fff;font-size:17px;font-weight:900;line-height:1.2;margin-bottom:3px}
#dom-rpt .hdr-sub{color:rgba(255,255,255,.65);font-size:10px}
#dom-rpt .strip{display:grid;grid-template-columns:repeat(4,1fr);background:#f0fdf4;border-bottom:2px solid #0A5C43}
#dom-rpt .sc{padding:10px 14px;border-right:1px solid #d1fae5}
#dom-rpt .sc:last-child{border-right:none}
#dom-rpt .sl{font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:#0A5C43;margin-bottom:3px}
#dom-rpt .sv{font-size:11px;font-weight:700;color:#1e293b}
#dom-rpt .body{padding:24px 28px 36px}
#dom-rpt .alert{background:#fff7ed;border:1px solid #fed7aa;border-left:4px solid #f97316;border-radius:8px;padding:14px 16px;margin-bottom:20px}
#dom-rpt .alert-title{font-size:12px;font-weight:900;color:#9a3412;margin-bottom:4px}
#dom-rpt .alert-body{font-size:11px;color:#7c3200;line-height:1.6}
#dom-rpt .sh{display:flex;align-items:center;gap:9px;margin:22px 0 12px}
#dom-rpt .sh-bar{width:3px;height:15px;background:#0A5C43;border-radius:2px;flex-shrink:0}
#dom-rpt .sh-txt{font-size:9.5px;font-weight:900;text-transform:uppercase;letter-spacing:.15em;color:#0A5C43}
#dom-rpt .sh-rule{flex:1;height:1px;background:#e2e8f0}
#dom-rpt .area{margin-bottom:18px}
#dom-rpt .area-name{font-size:10.5px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#1e293b;margin-bottom:8px;padding:5px 10px;background:#f8fafc;border-radius:5px;border-left:3px solid #0A5C43}
#dom-rpt .pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
#dom-rpt .pgrid img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0;display:block}
#dom-rpt .timebox{background:#0A5C43;border-radius:10px;padding:18px 22px;display:flex;gap:24px;align-items:center;margin:8px 0}
#dom-rpt .tbl{text-align:center}
#dom-rpt .tbl-val{color:#fff;font-size:26px;font-weight:900;line-height:1}
#dom-rpt .tbl-lbl{color:rgba(255,255,255,.5);font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-top:3px}
#dom-rpt .tdiv{width:1px;background:rgba(255,255,255,.2);align-self:stretch}
#dom-rpt .tarrow{color:rgba(255,255,255,.4);font-size:20px;font-weight:900}
#dom-rpt .reasons{margin-top:10px}
#dom-rpt .reason{display:flex;align-items:flex-start;gap:7px;font-size:11px;color:#334155;margin-bottom:5px}
#dom-rpt .reason-dot{width:6px;height:6px;border-radius:50%;background:#0A5C43;flex-shrink:0;margin-top:4px}
#dom-rpt .cost{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-top:12px;display:flex;justify-content:space-between;align-items:center}
#dom-rpt .cost-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#15803d}
#dom-rpt .cost-val{font-size:18px;font-weight:900;color:#15803d}
#dom-rpt .notes{padding:12px 16px;background:#f8fafc;border-radius:7px;border-left:3px solid #0A5C43;line-height:1.7;font-size:11px;color:#334155}
#dom-rpt .cta{background:#1e293b;border-radius:10px;padding:16px 22px;margin-top:20px;text-align:center}
#dom-rpt .cta-txt{color:rgba(255,255,255,.7);font-size:11px;line-height:1.6}
#dom-rpt .cta-contact{color:#6ee7b7;font-weight:700}
#dom-rpt .lf-item{margin-bottom:14px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
#dom-rpt .lf-hdr{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#854d0e;padding:7px 12px;background:#fef9c3;border-bottom:1px solid #fde68a;display:flex;align-items:center;gap:6px}
#dom-rpt .lf-desc{font-size:11px;color:#334155;padding:10px 12px;line-height:1.6;border-bottom:1px solid #f1f5f9}
#dom-rpt .lf-pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:10px 12px}
#dom-rpt .lf-pgrid img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:5px;border:1px solid #e2e8f0;display:block}
#dom-rpt .foot{background:#0A5C43;margin-top:36px;padding:13px 28px;display:flex;justify-content:space-between;align-items:center}
#dom-rpt .foot-l{color:rgba(255,255,255,.65);font-size:9px;line-height:1.7}
#dom-rpt .foot-l strong{color:#fff}
#dom-rpt .foot-r{color:rgba(255,255,255,.5);font-size:9px;text-align:right;line-height:1.7}
`.trim();

const mountForPdf = (html) =>
  new Promise((resolve) => {
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const root = parsed.getElementById("dom-rpt");
    if (!root) { resolve(null); return; }
    const host = document.createElement("div");
    Object.assign(host.style, { position: "absolute", top: "-99999px", left: "0", width: "794px", background: "#fff" });
    host.appendChild(root);
    document.body.appendChild(host);
    setTimeout(() => { host.style.height = host.scrollHeight + "px"; resolve(host); }, 800);
  });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";

// ══════════════════════════════════════════════════════════════════════════════
const DomesticPropertyReport = ({ booking, defaultOpen = false }) => {
  const [open, setOpen]             = useState(defaultOpen);
  const [logoB64, setLogoB64]       = useState("");
  const [areas, setAreas]           = useState(() => defaultAreas(booking));
  const [reasons, setReasons]       = useState([]);
  const [extraNotes, setExtraNotes] = useState("");
  const [extraHrs, setExtraHrs]       = useState(1);
  const [manualRate, setManualRate]   = useState(""); // admin override for hourly rate
  const [lostFound, setLostFound]     = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending]         = useState(false);
  const [updating, setUpdating]       = useState(false);
  const [toast, setToast]             = useState(null);

  useEffect(() => {
    if (!open) return;
    fetch(logoSrc)
      .then((r) => r.blob())
      .then((blob) => new Promise((res) => {
        const rd = new FileReader();
        rd.onload = (e) => res(e.target.result);
        rd.readAsDataURL(blob);
      }))
      .then(setLogoB64)
      .catch(() => {});
  }, [open]);

  // Area helpers
  const addArea   = () => setAreas((p) => [...p, { id: Date.now(), label: "", photos: [] }]);
  const removeArea = (id) => setAreas((p) => p.filter((a) => a.id !== id));
  const updLabel  = (id, v) => setAreas((p) => p.map((a) => a.id === id ? { ...a, label: v } : a));
  const addPhotos = (id, items) => setAreas((p) => p.map((a) => a.id === id ? { ...a, photos: [...a.photos, ...items] } : a));
  const removePhoto = (id, idx) => setAreas((p) => p.map((a) => a.id === id ? { ...a, photos: a.photos.filter((_, i) => i !== idx) } : a));

  // Lost & found helpers
  const addLostFoundItem      = () => setLostFound((p) => [...p, { id: Date.now(), description: "", photos: [] }]);
  const removeLostFoundItem   = (id) => setLostFound((p) => p.filter((x) => x.id !== id));
  const updateLostFoundDesc   = (id, v) => setLostFound((p) => p.map((x) => x.id === id ? { ...x, description: v } : x));
  const addLostFoundPhotos    = (id, items) => setLostFound((p) => p.map((x) => x.id === id ? { ...x, photos: [...x.photos, ...items] } : x));
  const removeLostFoundPhoto  = (id, idx) => setLostFound((p) => p.map((x) => x.id === id ? { ...x, photos: x.photos.filter((_, i) => i !== idx) } : x));

  const toggleReason = (r) =>
    setReasons((p) => p.includes(r) ? p.filter((x) => x !== r) : [...p, r]);

  // Payment calculations
  const bookedHrs    = parseFloat(booking?.details?.duration || booking?.workerDuration || 0);
  const currentAmt   = parseFloat(booking?.payment?.amount   || 0);
  const autoRate     = bookedHrs > 0 ? currentAmt / bookedHrs : null;
  const effectiveRate = manualRate !== "" && !isNaN(parseFloat(manualRate))
    ? parseFloat(manualRate)
    : autoRate;
  const hourlyRate = effectiveRate;
  const newHrs     = bookedHrs + extraHrs;
  const extraCost  = effectiveRate ? effectiveRate * extraHrs : null;
  const newTotal   = effectiveRate ? effectiveRate * newHrs   : null;

  const customerName = [booking?.customer?.firstName, booking?.customer?.lastName].filter(Boolean).join(" ") || "Customer";
  const address = booking?.details?.address || "";

  // ── Build PDF HTML ─────────────────────────────────────────────────────────
  const buildPdfHtml = (withPhotos = true) => {
    const logoUrl = logoB64 || logoSrc;
    const hasPhotos = areas.some((a) => a.photos.filter((p) => p.type === "image").length > 0);
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#fff">
<div id="dom-rpt">
<style>${CSS}</style>
<div class="hdr">
  <div class="hdr-brand"><img src="${logoUrl}" alt="Cleaniq Services" class="hdr-logo" /></div>
  <div class="hdr-main">
    <p class="hdr-type">Additional Time Required</p>
    <p class="hdr-title">Assessment Report</p>
    <p class="hdr-sub">${customerName}${address ? ` · ${address}` : ""}</p>
  </div>
</div>
<div class="strip">
  <div class="sc"><p class="sl">Booking Ref</p><p class="sv">${booking?.bookingId || "—"}</p></div>
  <div class="sc"><p class="sl">Date</p><p class="sv">${fmtDate(booking?.schedule?.date)}</p></div>
  <div class="sc"><p class="sl">Booked Hours</p><p class="sv">${bookedHrs > 0 ? bookedHrs + " hrs" : "—"}</p></div>
  <div class="sc"><p class="sl">Extra Time Needed</p><p class="sv">+${extraHrs} hrs</p></div>
</div>
<div class="body">

<div class="alert">
  <p class="alert-title">⚠️ Additional Time Required</p>
  <p class="alert-body">Our team has arrived at your property and assessed that the job requires more time than originally booked to complete to our standard. Please see the details and photos below.</p>
</div>

${hasPhotos ? `<div class="sh"><div class="sh-bar"></div><span class="sh-txt">Property Condition — As Found</span><div class="sh-rule"></div></div>
${areas.filter((a) => a.photos.some((p) => p.type === "image")).map((a) => {
  const imgs = a.photos.filter((p) => p.type === "image");
  return `<div class="area">
  <p class="area-name">${a.label || "Area"}</p>
  ${withPhotos && imgs.length ? `<div class="pgrid">${imgs.map((m) => `<img src="${m.src}">`).join("")}</div>` : `<p style="font-size:11px;color:#64748b;margin:4px 0">📷 ${imgs.length} photo(s)</p>`}
</div>`;
}).join("")}` : ""}

<div class="sh"><div class="sh-bar"></div><span class="sh-txt">Reasons for Additional Time</span><div class="sh-rule"></div></div>
${reasons.length ? `<div class="reasons">${reasons.map((r) => `<div class="reason"><span class="reason-dot"></span>${r}</div>`).join("")}</div>` : ""}
${extraNotes ? `<p style="font-size:11px;color:#334155;margin-top:10px;line-height:1.6">${extraNotes.replace(/\n/g, "<br>")}</p>` : ""}

${lostFound.length ? `<div class="sh"><div class="sh-bar"></div><span class="sh-txt">Lost &amp; Found Items</span><div class="sh-rule"></div></div>
${lostFound.map((item, i) => {
  const imgs = item.photos.filter((p) => p.type === "image");
  return `<div class="lf-item">
  <div class="lf-hdr">🔍 Item ${i + 1}</div>
  ${item.description ? `<div class="lf-desc">${item.description.replace(/\n/g, "<br>")}</div>` : ""}
  ${withPhotos && imgs.length ? `<div class="lf-pgrid">${imgs.map((m) => `<img src="${m.src}">`).join("")}</div>` : imgs.length ? `<p style="font-size:11px;color:#64748b;padding:8px 12px">📷 ${imgs.length} photo(s)</p>` : ""}
</div>`;
}).join("")}` : ""}

<div class="sh"><div class="sh-bar"></div><span class="sh-txt">Time &amp; Cost Summary</span><div class="sh-rule"></div></div>
<div class="timebox">
  <div class="tbl"><p class="tbl-val">${bookedHrs}h</p><p class="tbl-lbl">Originally Booked</p></div>
  <div class="tdiv"></div>
  <p class="tarrow">+</p>
  <div class="tdiv"></div>
  <div class="tbl"><p class="tbl-val">${extraHrs}h</p><p class="tbl-lbl">Additional Time</p></div>
  <div class="tdiv"></div>
  <p class="tarrow">=</p>
  <div class="tdiv"></div>
  <div class="tbl"><p class="tbl-val">${newHrs}h</p><p class="tbl-lbl">New Total</p></div>
</div>
${extraCost != null ? `<div class="cost"><p class="cost-lbl">Additional charge</p><p class="cost-val">+£${extraCost.toFixed(2)}</p></div>` : ""}
${newTotal != null ? `<p style="font-size:10px;color:#64748b;margin-top:8px">New total: <strong>£${newTotal.toFixed(2)}</strong> (${newHrs} hrs × £${hourlyRate?.toFixed(2)}/hr)</p>` : ""}

<div class="cta">
  <p class="cta-txt">To approve the additional time or to discuss further, please contact us:<br><span class="cta-contact">📞 hello@cleaniqservices.com · cleaniqservices.com</span></p>
</div>

</div>
<div class="foot">
  <div class="foot-l"><strong>Cleaniq Services</strong><br>cleaniqservices.com · hello@cleaniqservices.com</div>
  <div class="foot-r">Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}<br>Booking ${booking?.bookingId || "—"}</div>
</div>
</div>
</body></html>`;
  };

  // ── Build notification email HTML ──────────────────────────────────────────
  const buildEmailHtml = () => `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:620px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">

  <!-- Header -->
  <div style="background:#0A5C43;padding:36px 40px;text-align:center">
    <p style="color:#fff;font-size:26px;font-weight:900;margin:0;letter-spacing:-.5px">Cleaniq Services</p>
    <p style="color:rgba(255,255,255,.55);font-size:11px;margin:6px 0 0;text-transform:uppercase;letter-spacing:2px">Assessment Report</p>
  </div>

  <!-- Alert banner -->
  <div style="background:#fff7ed;border-bottom:2px solid #fed7aa;padding:16px 40px;display:flex;align-items:center;gap:12px">
    <span style="font-size:22px">⚠️</span>
    <div>
      <p style="font-size:14px;font-weight:900;color:#9a3412;margin:0">Additional Time Required</p>
      <p style="font-size:12px;color:#7c3200;margin:3px 0 0">Booking ${booking?.bookingId || ""} · ${fmtDate(booking?.schedule?.date)}</p>
    </div>
  </div>

  <!-- Body -->
  <div style="padding:32px 40px">
    <p style="color:#1e293b;font-size:16px;font-weight:700;margin:0 0 12px">Hi ${booking?.customer?.firstName || "there"},</p>
    <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px">Our team has arrived at your property and found that the job will require <strong style="color:#0A5C43">${extraHrs} additional hour${extraHrs !== 1 ? "s" : ""}</strong> beyond your original booking to complete to our standard. We have attached a full assessment report with photos for your records.</p>

    ${reasons.length ? `
    <p style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin:0 0 10px">Why we need more time</p>
    <ul style="padding:0 0 0 0;margin:0 0 24px;list-style:none">
      ${reasons.map((r) => `<li style="display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#334155;margin-bottom:7px;line-height:1.5"><span style="width:6px;height:6px;border-radius:50%;background:#0A5C43;display:inline-block;flex-shrink:0;margin-top:5px"></span>${r}</li>`).join("")}
    </ul>` : ""}

    ${extraNotes ? `<div style="padding:14px 18px;background:#f8fafc;border-radius:10px;border-left:3px solid #0A5C43;margin-bottom:24px"><p style="font-size:13px;color:#334155;line-height:1.7;margin:0">${extraNotes.replace(/\n/g, "<br>")}</p></div>` : ""}

    <!-- Time summary -->
    <div style="background:#0A5C43;border-radius:12px;padding:20px 24px;margin-bottom:24px">
      <div style="display:flex;justify-content:space-around;text-align:center">
        <div><p style="color:#fff;font-size:24px;font-weight:900;margin:0">${bookedHrs}h</p><p style="color:rgba(255,255,255,.55);font-size:10px;font-weight:700;text-transform:uppercase;margin:4px 0 0">Originally Booked</p></div>
        <div style="display:flex;align-items:center"><p style="color:rgba(255,255,255,.4);font-size:24px;font-weight:700;margin:0">+</p></div>
        <div><p style="color:#6ee7b7;font-size:24px;font-weight:900;margin:0">${extraHrs}h</p><p style="color:rgba(255,255,255,.55);font-size:10px;font-weight:700;text-transform:uppercase;margin:4px 0 0">Additional Time</p></div>
        <div style="display:flex;align-items:center"><p style="color:rgba(255,255,255,.4);font-size:24px;font-weight:700;margin:0">=</p></div>
        <div><p style="color:#fff;font-size:24px;font-weight:900;margin:0">${newHrs}h</p><p style="color:rgba(255,255,255,.55);font-size:10px;font-weight:700;text-transform:uppercase;margin:4px 0 0">New Total</p></div>
      </div>
    </div>

    ${extraCost != null ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 20px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <p style="font-size:12px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.08em;margin:0">Additional Charge</p>
        ${hourlyRate ? `<p style="font-size:11px;color:#64748b;margin:3px 0 0">${extraHrs}h × £${hourlyRate.toFixed(2)}/hr</p>` : ""}
      </div>
      <p style="font-size:22px;font-weight:900;color:#15803d;margin:0">+£${extraCost.toFixed(2)}</p>
    </div>
    ${newTotal != null ? `<p style="font-size:12px;color:#64748b;text-align:right;margin:-16px 0 24px">New total: <strong style="color:#1e293b">£${newTotal.toFixed(2)}</strong></p>` : ""}
    ` : ""}

    <div style="background:#1e293b;border-radius:12px;padding:18px 22px;text-align:center">
      <p style="color:rgba(255,255,255,.7);font-size:13px;line-height:1.7;margin:0">To approve the extra time or to discuss further, please contact us:<br><a href="mailto:hello@cleaniqservices.com" style="color:#6ee7b7;font-weight:700;text-decoration:none">hello@cleaniqservices.com</a></p>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center">
    <p style="color:#94a3b8;font-size:11px;margin:0">© ${new Date().getFullYear()} Cleaniq Services Ltd · <a href="https://cleaniqservices.com" style="color:#0A5C43;text-decoration:none">cleaniqservices.com</a></p>
  </div>
</div>
</body></html>`;

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true);
    const filename = `extra-time-report-${(booking?.bookingId || "cleaniq").replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
    const host = await mountForPdf(buildPdfHtml(true));
    try {
      await html2pdf().set({ ...PDF_OPTS, filename }).from(host.firstElementChild).save();
    } finally {
      if (host?.parentNode) document.body.removeChild(host);
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    const email = booking?.customer?.email;
    if (!email) { setToast({ msg: "No customer email on this booking", type: "error" }); return; }
    if (!extraHrs) { setToast({ msg: "Set the extra hours needed first", type: "error" }); return; }
    setSending(true);

    const filename = `Extra-Time-Report-${(booking?.bookingId || "Cleaniq").replace(/[^a-z0-9]/gi, "-")}.pdf`;
    const host = await mountForPdf(buildPdfHtml(true));
    if (!host) { setToast({ msg: "Failed to prepare PDF", type: "error" }); setSending(false); return; }

    let pdfBase64 = null;
    try {
      const jspdf = await html2pdf().set(PDF_OPTS).from(host.firstElementChild).toPdf().get("pdf");
      pdfBase64 = jspdf.output("datauristring").split(",")[1];
    } catch (err) {
      setToast({ msg: "PDF generation failed: " + err.message, type: "error" });
      setSending(false);
      return;
    } finally {
      if (host?.parentNode) document.body.removeChild(host);
    }

    try {
      const res = await fetch(`${API}/email-logs/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: `Additional Time Required — Your Clean · ${booking?.bookingId || ""}`,
          html: buildEmailHtml(),
          attachment: { filename, base64: pdfBase64 },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      setToast({ msg: `Report sent to ${email}`, type: "success" });
    } catch (err) {
      setToast({ msg: err.message || "Failed to send", type: "error" });
    } finally {
      setSending(false);
    }
  };

  const handleUpdateBooking = async () => {
    if (!booking?._id) return;
    setUpdating(true);
    try {
      const body = {
        details: { ...booking.details, duration: newHrs },
        ...(newTotal != null ? { payment: { ...booking.payment, amount: parseFloat(newTotal.toFixed(2)) } } : {}),
      };
      const res = await fetch(`${API}/bookings/${booking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Update failed");
      setToast({ msg: `Booking updated to ${newHrs} hrs${newTotal ? ` · £${newTotal.toFixed(2)}` : ""}`, type: "success" });
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    } finally {
      setUpdating(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#0B2D22] rounded-3xl border border-white/7 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between p-6 hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <Clock size={16} />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-white">Extra Time Request</p>
            <p className="text-xs text-white/40 font-medium mt-0.5">
              Upload photos · select reasons · send report to customer
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
      </button>

      {open && (
        <div className="border-t border-white/7 p-6 space-y-7">

          {/* ── Step 1: Area photos ────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-sm font-black text-white">Step 1 — Photo Evidence</p>
                <p className="text-xs text-white/40 font-medium mt-0.5">
                  Upload photos of each area as found. These go into the report the customer receives.
                </p>
              </div>
              <button
                onClick={addArea}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <Plus size={12} /> Add Area
              </button>
            </div>

            <div className="space-y-4 mt-4">
              {areas.map((area) => (
                <div key={area.id} className="border border-white/10 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/[0.04]">
                    <input
                      value={area.label}
                      onChange={(e) => updLabel(area.id, e.target.value)}
                      placeholder="Area name (e.g. Kitchen, Bedroom 1…)"
                      className="flex-1 text-sm font-bold bg-transparent border-none outline-none text-white placeholder:text-white/20"
                    />
                    <button onClick={() => removeArea(area.id)} className="text-white/25 hover:text-rose-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="p-4">
                    <MediaGrid
                      items={area.photos}
                      onAdd={(items) => addPhotos(area.id, items)}
                      onRemove={(idx) => removePhoto(area.id, idx)}
                      hint="Photos showing why more time is needed for this area"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Step 2: Reasons ───────────────────────────────────────────── */}
          <div>
            <p className="text-sm font-black text-white mb-1">Step 2 — Reasons for Extra Time</p>
            <p className="text-xs text-white/40 font-medium mb-4">Select all that apply — these appear in the customer email and PDF.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {REASONS.map((r) => {
                const active = reasons.includes(r);
                return (
                  <button
                    key={r}
                    onClick={() => toggleReason(r)}
                    className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl border-2 text-left text-xs font-semibold transition-all ${active ? "border-amber-500/40 bg-amber-500/15 text-amber-400" : "border-white/10 text-white/60 hover:border-white/20"}`}
                  >
                    <span className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${active ? "bg-amber-500 border-amber-500" : "border-white/25"}`}>
                      {active && <CheckCircle2 size={10} className="text-white" />}
                    </span>
                    {r}
                  </button>
                );
              })}
            </div>
            <textarea
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder="Add any additional notes or explanation for the customer…"
              rows={3}
              className="w-full px-3.5 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-medium focus:outline-none focus:border-emerald-500/50 resize-none placeholder:text-white/20"
            />
          </div>

          {/* ── Step 3: Extra hours ───────────────────────────────────────── */}
          <div>
            <p className="text-sm font-black text-white mb-1">Step 3 — How Much Extra Time?</p>
            <p className="text-xs text-white/40 font-medium mb-3">
              {bookedHrs > 0 ? `Booked: ${bookedHrs} hrs` : "No duration on booking"}
              {autoRate ? ` · Auto rate: £${autoRate.toFixed(2)}/hr` : ""}
            </p>

            {/* Admin rate override */}
            <div className="flex items-center gap-2 mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <div className="flex-1">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1">Hourly Rate for Extra Time</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-amber-400">£</span>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={manualRate}
                    onChange={(e) => setManualRate(e.target.value)}
                    placeholder={autoRate ? autoRate.toFixed(2) : "e.g. 25.00"}
                    className="w-28 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-white/5 text-sm font-bold text-white focus:outline-none focus:border-amber-500/60 placeholder:text-white/20"
                  />
                  <span className="text-xs text-amber-400 font-medium">/hr</span>
                  {manualRate !== "" && (
                    <button
                      onClick={() => setManualRate("")}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline"
                    >
                      Reset to auto
                    </button>
                  )}
                </div>
              </div>
              {effectiveRate && (
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Extra Cost</p>
                  <p className="text-xl font-black text-amber-300">£{(effectiveRate * extraHrs).toFixed(2)}</p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {EXTRA_HOURS.map((h) => (
                <button
                  key={h}
                  onClick={() => setExtraHrs(h)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all ${extraHrs === h ? "bg-amber-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/15"}`}
                >
                  +{h}h
                </button>
              ))}
            </div>

            {bookedHrs > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/5 p-4 text-center">
                  <p className="text-xl font-black text-white/60">{bookedHrs}h</p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">Booked</p>
                </div>
                <div className="rounded-2xl bg-amber-500/15 p-4 text-center">
                  <p className="text-xl font-black text-amber-400">+{extraHrs}h</p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">Extra</p>
                </div>
                <div className="rounded-2xl bg-emerald-500/15 p-4 text-center">
                  <p className="text-xl font-black text-emerald-400">{newHrs}h</p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">New Total</p>
                </div>
              </div>
            )}

            {extraCost != null && (
              <div className="mt-3 flex justify-between items-center px-4 py-3 bg-emerald-500/15 border border-emerald-500/25 rounded-xl">
                <span className="text-sm font-bold text-white/60">Additional charge</span>
                <span className="text-base font-black text-emerald-400">
                  +£{extraCost.toFixed(2)}
                  {newTotal != null && <span className="text-xs text-white/40 font-medium ml-1">(new total: £{newTotal.toFixed(2)})</span>}
                </span>
              </div>
            )}
          </div>

          {/* ── Step 4: Lost & Found ─────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-sm font-black text-white">Step 4 — Lost &amp; Found Items</p>
                <p className="text-xs text-white/40 font-medium mt-0.5">
                  Record any items found that don't belong. Add a description and photos for each item.
                </p>
              </div>
              <button
                onClick={addLostFoundItem}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              >
                <Plus size={12} /> Add Item
              </button>
            </div>

            {lostFound.length === 0 ? (
              <button
                onClick={addLostFoundItem}
                className="mt-3 w-full flex items-center justify-center gap-2 py-6 rounded-2xl border-2 border-dashed border-white/10 text-white/40 hover:border-amber-500/40 hover:text-amber-400 transition-colors text-sm font-bold"
              >
                <Plus size={14} /> Log a Found Item
              </button>
            ) : (
              <div className="space-y-4 mt-4">
                {lostFound.map((item, i) => (
                  <div key={item.id} className="border border-amber-500/20 rounded-2xl overflow-hidden bg-amber-500/5">
                    <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border-b border-amber-500/15">
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Item {i + 1}</span>
                      <div className="flex-1" />
                      <button onClick={() => removeLostFoundItem(item.id)} className="text-white/25 hover:text-rose-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="p-4 space-y-4">
                      <textarea
                        value={item.description}
                        onChange={(e) => updateLostFoundDesc(item.id, e.target.value)}
                        placeholder="Describe the item (e.g. black iPhone found under sofa cushion in living room)…"
                        rows={2}
                        className="w-full px-3.5 py-3 rounded-xl border border-amber-500/20 bg-white/5 text-white text-sm font-medium focus:outline-none focus:border-amber-500/50 resize-none placeholder:text-white/20"
                      />
                      <MediaGrid
                        items={item.photos}
                        onAdd={(items) => addLostFoundPhotos(item.id, items)}
                        onRemove={(idx) => removeLostFoundPhoto(item.id, idx)}
                        label="Photos of item"
                        hint="Add as many photos as needed"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={addLostFoundItem}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:underline"
                >
                  <Plus size={12} /> Add another item
                </button>
              </div>
            )}
          </div>

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div className="pt-2 border-t border-white/7 space-y-3">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Actions</p>
            <div className="flex flex-wrap gap-2">
              {/* Send to customer */}
              <button
                onClick={handleSendEmail}
                disabled={sending}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-black hover:bg-emerald-400 transition-colors disabled:opacity-60"
              >
                {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                {sending ? "Sending…" : `Send to Customer${booking?.customer?.email ? ` (${booking.customer.email})` : ""}`}
              </button>

              {/* Download PDF */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-black hover:bg-white/10 transition-colors disabled:opacity-60"
              >
                {downloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                {downloading ? "Generating…" : "Download PDF"}
              </button>

              {/* Update booking */}
              {booking?._id && bookedHrs > 0 && (
                <button
                  onClick={handleUpdateBooking}
                  disabled={updating}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-black hover:bg-white/10 transition-colors disabled:opacity-60"
                >
                  {updating ? <RefreshCw size={14} className="animate-spin" /> : <AlertCircle size={14} />}
                  {updating ? "Updating…" : `Update Booking to ${newHrs}h`}
                </button>
              )}
            </div>
            <p className="text-[10px] text-white/40 font-medium">
              "Send to Customer" emails the report with PDF attached. "Update Booking" changes the duration and total on the booking record.
            </p>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default DomesticPropertyReport;
