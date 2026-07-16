import React, { useState, useRef, useEffect, useCallback } from "react";
import html2pdf from "html2pdf.js";
import {
  Building2, FileText, FileCheck, Camera, Plus, Trash2,
  Download, Send, X, ClipboardList, Printer,
  RefreshCw, Package, AlertTriangle, Play, Film,
  Search, User, ChevronRight,
} from "lucide-react";
import QuoteBuilderComponent from "./QuoteBuilder";
import InvoiceBuilderComponent from "./InvoiceBuilder";
import logoSrc from "../assets/logo DP.jpg";

const API = import.meta.env.VITE_API_URL;

// ── Shared helpers ─────────────────────────────────────────────────────────────

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
    {msg}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={15} /></button>
  </div>
);

const readMedia = (file) =>
  new Promise((res) => {
    if (file.type.startsWith("video/")) {
      // Videos stay as object URLs for playback — too large for base64
      res({ type: "video", src: URL.createObjectURL(file), name: file.name });
    } else {
      const r = new FileReader();
      r.onload = (e) => res({ type: "image", src: e.target.result, name: file.name });
      r.readAsDataURL(file);
    }
  });

const Field = ({ label, children }) => (
  <div>
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all ${props.className || ""}`} />
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-100 bg-slate-50">
      {Icon && <Icon size={15} className="text-primary flex-shrink-0" />}
      <h3 className="text-sm font-bold text-slate-700 leading-tight">{title}</h3>
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </div>
);

// ── Config ─────────────────────────────────────────────────────────────────────

const CONDITIONS = [
  { id: "slightly", label: "Slightly Dirty", ring: "ring-yellow-400", bg: "bg-yellow-50", text: "text-yellow-800", dot: "bg-yellow-400" },
  { id: "moderately", label: "Moderately Dirty", ring: "ring-orange-400", bg: "bg-orange-50", text: "text-orange-800", dot: "bg-orange-500" },
  { id: "very", label: "Very Dirty", ring: "ring-red-500", bg: "bg-red-50", text: "text-red-800", dot: "bg-red-500" },
];

const SUPPLIES = [
  "Multi-surface cleaner", "Bathroom cleaner", "Kitchen degreaser",
  "Toilet cleaner", "Glass cleaner", "Floor mop & bucket",
  "Microfibre cloths", "Sponges / scrubbers", "Rubber gloves",
  "Bin bags", "Vacuum bags / filters", "Air freshener",
];

const CONSUMABLES = [
  "Toilet rolls", "Hand soap", "Shower gel", "Shampoo", "Conditioner",
  "Washing up liquid", "Dishwasher tablets", "Kitchen roll",
  "Tea / coffee sachets", "Sugar / sweetener", "Milk pods / UHT", "Salt & pepper",
];

const BASE_INVENTORY = [
  "Single duvet sets", "Double duvet sets", "King duvet sets",
  "Bath towels", "Hand towels", "Face cloths", "Pillows", "Pillow cases",
  "Mugs / cups", "Glasses", "Plates / bowls", "Cutlery sets", "Remote controls", "Keys / fobs",
].map((item) => ({ item, expected: "", actual: "", notes: "" }));

// ══════════════════════════════════════════════════════════════════════════════
// Tab 1 — Property Report
// ══════════════════════════════════════════════════════════════════════════════

// MediaItem: { type: "image"|"video", src: string, name: string }
const MediaGrid = ({ items, onAdd, onRemove, label, compact = false }) => {
  const ref = useRef(null);
  const handle = async (e) => {
    const files = Array.from(e.target.files);
    const newItems = await Promise.all(files.map(readMedia));
    onAdd(newItems);
    e.target.value = "";
  };
  const cols = compact
    ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6"
    : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7";
  const imgCount = (items || []).filter((m) => m.type === "image").length;
  const vidCount = (items || []).filter((m) => m.type === "video").length;
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          {(items || []).length > 0 && (
            <span className="text-[10px] text-slate-400 font-medium">
              {imgCount > 0 && `${imgCount} photo${imgCount !== 1 ? "s" : ""}`}
              {imgCount > 0 && vidCount > 0 && " · "}
              {vidCount > 0 && `${vidCount} video${vidCount !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>
      )}
      <div className={`grid ${cols} gap-2`}>
        {(items || []).map((item, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
            {item.type === "video" ? (
              <>
                <video
                  src={item.src}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 pointer-events-none">
                  <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                    <Play size={12} className="text-white ml-0.5" fill="white" />
                  </div>
                  <span className="text-[9px] font-bold text-white/80 mt-1 max-w-[90%] truncate px-1">{item.name}</span>
                </div>
              </>
            ) : (
              <img src={item.src} alt="" className="w-full h-full object-cover" />
            )}
            <button
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 bg-black/70 rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            >
              <X size={10} className="text-white" />
            </button>
          </div>
        ))}
        <button
          onClick={() => ref.current?.click()}
          className={`aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-primary hover:text-primary transition-colors ${compact ? "min-h-[64px]" : ""}`}
        >
          <div className="flex items-center gap-0.5">
            <Camera size={compact ? 12 : 15} />
            <Film size={compact ? 10 : 13} />
          </div>
          <span className="text-[9px] font-bold">Photo/Video</span>
        </button>
      </div>
      <input ref={ref} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handle} />
    </div>
  );
};

const PropertyReport = () => {
  const [info, setInfo] = useState({ propertyName: "", address: "", bookingRef: "", date: new Date().toISOString().slice(0, 10), cleaner: "", recipientEmail: "" });
  const [condition, setCondition] = useState("");
  // Embed logo as base64 so it shows in print/PDF regardless of how the window is opened
  const [logoB64, setLogoB64] = useState("");
  useEffect(() => {
    fetch(logoSrc)
      .then((r) => r.blob())
      .then((blob) => new Promise((res) => {
        const rd = new FileReader();
        rd.onload = (e) => res(e.target.result);
        rd.readAsDataURL(blob);
      }))
      .then(setLogoB64)
      .catch(() => {});
  }, []);
  // Each section: { id, label, before: MediaItem[], after: MediaItem[] }
  const [photoSections, setPhotoSections] = useState([
    { id: 1, label: "", before: [], after: [] },
  ]);
  const [vendingPhotos, setVendingPhotos] = useState([]);
  const [damages, setDamages] = useState([]);
  const [supplies, setSupplies] = useState({});
  const [consumables, setConsumables] = useState({});
  const [inventory, setInventory] = useState(BASE_INVENTORY.map((r) => ({ ...r })));
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  // Booking search
  const [allBookings, setAllBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/bookings`)
      .then((r) => r.json())
      .then((data) => setAllBookings(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const q = search.trim().toLowerCase();
  const searchResults = q.length < 2 ? [] : allBookings.filter((b) => {
    const name = `${b.customer?.firstName || ""} ${b.customer?.lastName || ""}`.toLowerCase();
    const email = (b.customer?.email || "").toLowerCase();
    const ref = (b.bookingId || "").toLowerCase();
    return name.includes(q) || email.includes(q) || ref.includes(q);
  }).slice(0, 8);

  const fillFromBooking = (b) => {
    const addr = b.property?.address || b.property?.postcode
      ? [b.property?.address, b.property?.postcode].filter(Boolean).join(", ")
      : b.details?.address || "";
    const custName = [b.customer?.firstName, b.customer?.lastName].filter(Boolean).join(" ");
    setInfo((p) => ({
      ...p,
      propertyName: p.propertyName || (custName ? `${custName}'s Property` : b.service || ""),
      address: p.address || addr,
      bookingRef: b.bookingId || p.bookingRef,
      date: b.schedule?.date ? new Date(b.schedule.date).toISOString().slice(0, 10) : p.date,
      cleaner: b.assignedWorkerName || p.cleaner,
      recipientEmail: b.customer?.email || p.recipientEmail,
    }));
    setSearch("");
    setShowResults(false);
  };

  const set = (k) => (e) => setInfo((p) => ({ ...p, [k]: e.target.value }));
  const toggleItem = (state, setState, key) => setState((p) => ({ ...p, [key]: !p[key] }));
  const setQty = (state, setState, key, v) => setState((p) => ({ ...p, [`qty_${key}`]: v }));

  const addSection = () =>
    setPhotoSections((p) => [...p, { id: Date.now(), label: "", before: [], after: [] }]);
  const removeSection = (id) =>
    setPhotoSections((p) => p.filter((s) => s.id !== id));
  const updSection = (id, k, v) =>
    setPhotoSections((p) => p.map((s) => s.id === id ? { ...s, [k]: v } : s));
  const addSectionMedia = (id, side, items) =>
    setPhotoSections((p) => p.map((s) => s.id === id ? { ...s, [side]: [...s[side], ...items] } : s));
  const removeSectionMedia = (id, side, idx) =>
    setPhotoSections((p) => p.map((s) => s.id === id ? { ...s, [side]: s[side].filter((_, i) => i !== idx) } : s));

  const addDamage = () => setDamages((p) => [...p, { id: Date.now(), item: "", location: "", severity: "Minor", description: "", photos: [] }]);
  const updDamage = (id, k, v) => setDamages((p) => p.map((d) => d.id === id ? { ...d, [k]: v } : d));
  const delDamage = (id) => setDamages((p) => p.filter((d) => d.id !== id));
  const addDamagePhotos = (id, urls) => setDamages((p) => p.map((d) => d.id === id ? { ...d, photos: [...(d.photos || []), ...urls] } : d));
  const removeDamagePhoto = (id, idx) => setDamages((p) => p.map((d) => d.id === id ? { ...d, photos: (d.photos || []).filter((_, i) => i !== idx) } : d));
  const updInv = (i, k, v) => setInventory((p) => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));


  const condObj = CONDITIONS.find((c) => c.id === condition);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";

  const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;color:#1e293b;background:#fff}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
.hdr{background:#0A5C43;display:flex;justify-content:space-between;align-items:center;padding:28px 40px;margin-bottom:0}
.hdr-logo{height:56px;border-radius:8px;display:block}
.hdr-meta{text-align:right;font-size:11px;color:rgba(255,255,255,.75);line-height:1.8}
.hdr-meta strong{color:#fff;font-size:13px}
.sub-hdr{background:#f0fdf4;border-bottom:1px solid #d1fae5;padding:14px 40px;display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}
.sub-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#0A5C43}
.badge{display:inline-block;padding:3px 12px;border-radius:999px;font-weight:700;font-size:11px}
.slightly{background:#fef9c3;color:#854d0e}.moderately{background:#ffedd5;color:#9a3412}.very{background:#fee2e2;color:#991b1b}
.body{padding:0 40px 40px}
h2{font-size:12px;font-weight:800;color:#0A5C43;margin:24px 0 10px;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid #d1fae5;padding-bottom:6px}
table{width:100%;border-collapse:collapse;font-size:11px}th{background:#f8fafc;text-align:left;padding:7px 10px;font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#64748b;border-bottom:2px solid #e2e8f0}td{padding:7px 10px;border-bottom:1px solid #f1f5f9}
.cl{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px}.cli{display:flex;gap:6px;align-items:center;font-size:11px;padding:5px 8px;background:#f8fafc;border-radius:6px;border:1px solid #f1f5f9}
.chk{color:#16a34a;font-weight:800}.unchk{color:#cbd5e1}
.pgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.pgrid img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0}
.dmg-card{background:#fff8f8;border:1px solid #fee2e2;border-radius:10px;padding:12px 14px;margin-bottom:10px}
.dmg-photos{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
.dmg-photos img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;border:1px solid #fecaca}
.vid-pill{display:inline-flex;align-items:center;gap:6px;background:#1e293b;color:#94a3b8;font-size:10px;font-weight:700;padding:4px 10px;border-radius:999px;margin:3px}
.foot{margin-top:40px;border-top:1px solid #e2e8f0;padding-top:14px;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#94a3b8}`;

  // Render a MediaItem array into HTML — images inline, videos as labelled pills (can't print video)
  const mediaToHtml = (items, withMedia) => {
    const imgs = items.filter((m) => m.type === "image");
    const vids = items.filter((m) => m.type === "video");
    const parts = [];
    if (withMedia && imgs.length) {
      parts.push(`<div class="pgrid">${imgs.map((m) => `<img src="${m.src}">`).join("")}</div>`);
    } else if (imgs.length) {
      parts.push(`<p style="font-size:11px;color:#64748b;margin:6px 0">📷 ${imgs.length} photo(s)</p>`);
    }
    if (vids.length) {
      parts.push(`<div style="margin-top:6px">${vids.map((m) => `<span class="vid-pill">🎥 ${m.name}</span>`).join("")}</div>`);
    }
    return parts.join("");
  };

  // withPhotos=true for print/download, false for email (keeps size manageable)
  const buildHtml = (withPhotos = true) => {
    // Always embed logo as base64 — email clients block external image URLs
    const logoUrl = logoB64 || `${window.location.origin}${logoSrc}`;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Property Report — ${info.propertyName || "Cleaniq"}</title>
<style>${CSS}
@media(max-width:600px){.hdr{padding:18px 20px;flex-direction:column;align-items:flex-start;gap:12px}.hdr-meta{text-align:left}.sub-hdr{padding:10px 20px;flex-direction:column;gap:6px}.body{padding:0 20px 28px}.pgrid{grid-template-columns:repeat(2,1fr)}.cl{grid-template-columns:1fr 1fr}}
@media print{body{padding-top:0!important}}
</style></head><body>
<div class="hdr">
  <img src="${logoUrl}" alt="Cleaniq Services" class="hdr-logo" />
  <div class="hdr-meta">
    <p><strong>${info.propertyName || "Property Report"}</strong></p>
    ${info.address ? `<p>${info.address}</p>` : ""}
    <p>Date: ${fmtDate(info.date)}</p>
    ${info.bookingRef ? `<p>Ref: ${info.bookingRef}</p>` : ""}
    ${info.cleaner ? `<p>Cleaner: ${info.cleaner}</p>` : ""}
  </div>
</div>
<div class="sub-hdr">
  <span class="sub-title">Property Condition Report</span>
  ${condObj ? `<div class="badge ${condition}">${condObj.label}</div>` : "<span></span>"}
</div>
<div class="body">
${photoSections.some((s) => s.before.length || s.after.length) ? photoSections.map((s, i) => {
  const title = s.label || (photoSections.length > 1 ? `Section ${i + 1}` : "");
  const prefix = title ? ` — ${title}` : "";
  return [
    s.before.length ? `<h2>Before${prefix}</h2>${mediaToHtml(s.before, withPhotos)}` : "",
    s.after.length ? `<h2>After${prefix}</h2>${mediaToHtml(s.after, withPhotos)}` : "",
  ].join("");
}).join("") : ""}
${damages.length ? `<h2>Damage Report</h2>${damages.map((d) => {
  const dmgMedia = d.photos || [];
  return `<div class="dmg-card"><table style="width:100%;border-collapse:collapse"><tr><td style="padding:3px 8px 3px 0;font-size:11px;font-weight:700;color:#1e293b;width:30%">${d.item || "—"}</td><td style="padding:3px 8px;font-size:11px;color:#475569;width:25%">${d.location || "—"}</td><td style="padding:3px 8px;font-size:11px;width:20%"><span style="background:${d.severity==="Major"?"#fee2e2":d.severity==="Moderate"?"#ffedd5":"#fef9c3"};color:${d.severity==="Major"?"#991b1b":d.severity==="Moderate"?"#9a3412":"#854d0e"};padding:2px 8px;border-radius:999px;font-weight:700">${d.severity}</span></td><td style="padding:3px 0 3px 8px;font-size:11px;color:#475569">${d.description || ""}</td></tr></table>${dmgMedia.length ? `<div class="dmg-photos">${mediaToHtml(dmgMedia, withPhotos)}</div>` : ""}</div>`;
}).join("")}` : ""}
<h2>Cleaning Supplies Restock</h2><div class="cl">${SUPPLIES.map((s) => `<div class="cli"><span class="${supplies[s] ? "chk" : "unchk"}">${supplies[s] ? "✓" : "○"}</span>${s}${supplies[`qty_${s}`] ? ` ×${supplies[`qty_${s}`]}` : ""}</div>`).join("")}</div>
<h2>Consumables Replenish</h2><div class="cl">${CONSUMABLES.map((s) => `<div class="cli"><span class="${consumables[s] ? "chk" : "unchk"}">${consumables[s] ? "✓" : "○"}</span>${s}${consumables[`qty_${s}`] ? ` ×${consumables[`qty_${s}`]}` : ""}</div>`).join("")}</div>
${vendingPhotos.length ? `<h2>Vending Machine</h2>${mediaToHtml(vendingPhotos, withPhotos)}` : ""}
<h2>Inventory Report</h2><table><tr><th>Item</th><th>Expected</th><th>Actual</th><th>Discrepancy</th><th>Notes</th></tr>${inventory.map((r) => { const disc = r.expected !== "" && r.actual !== "" && String(r.expected) !== String(r.actual); return `<tr><td>${r.item}</td><td>${r.expected || "—"}</td><td style="${disc ? "color:#dc2626;font-weight:700" : ""}">${r.actual || "—"}</td><td>${disc ? "⚠ Mismatch" : ""}</td><td>${r.notes || ""}</td></tr>`; }).join("")}</table>
${notes ? `<h2>Additional Notes</h2><p style="padding:14px;background:#f8fafc;border-radius:8px;line-height:1.7;border:1px solid #e2e8f0">${notes}</p>` : ""}
<div class="foot">
  <span>© ${new Date().getFullYear()} Cleaniq Services Ltd</span>
  <span>cleaniqservices.com · +44 7752 476368</span>
</div>
</div>
</body></html>`;
  };

  const printReport = () => {
    const w = window.open("", "_blank");
    w.document.write(buildHtml(true));
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  const PDF_OPTS = {
    margin: [8, 8, 8, 8],
    image: { type: "jpeg", quality: 0.92 },
    html2canvas: { scale: 2, useCORS: true, logging: false, allowTaint: true, imageTimeout: 20000 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all", "css"] },
  };

  // Load the full HTML document in an off-screen iframe so its <style> block,
  // layout, and base64 images all render correctly before html2canvas runs.
  // Returns the iframe element; caller must remove it when done.
  const mountInIframe = (html) =>
    new Promise((resolve, reject) => {
      const iframe = document.createElement("iframe");
      Object.assign(iframe.style, {
        position: "fixed",
        left: "-9999px",
        top: "0",
        width: "794px",
        height: "1123px",
        border: "none",
        visibility: "hidden",
      });
      iframe.addEventListener(
        "load",
        async () => {
          try {
            // Expand height to full content so html2canvas captures everything
            const body = iframe.contentDocument.body;
            iframe.style.height = Math.max(body.scrollHeight, 1123) + "px";
            // Let base64 images decode inside the iframe
            await new Promise((r) => setTimeout(r, 600));
            resolve(iframe);
          } catch (e) {
            reject(e);
          }
        },
        { once: true },
      );
      document.body.appendChild(iframe);
      iframe.srcdoc = html;
    });

  const [downloading, setDownloading] = useState(false);
  const handleDownload = async () => {
    setDownloading(true);
    const filename = `property-report-${(info.bookingRef || info.propertyName || "cleaniq").replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;
    const iframe = await mountInIframe(buildHtml(true));
    try {
      await html2pdf()
        .set({ ...PDF_OPTS, filename })
        .from(iframe.contentDocument.body)
        .save();
    } finally {
      document.body.removeChild(iframe);
      setDownloading(false);
    }
  };

  // Clean notification email body — no base64 images, works in all email clients
  const buildNotificationHtml = () => {
    const rows = [
      info.propertyName && ["Property", info.propertyName],
      info.address && ["Address", info.address],
      info.bookingRef && ["Booking Ref", info.bookingRef],
      info.date && ["Date", fmtDate(info.date)],
      info.cleaner && ["Cleaner", info.cleaner],
      condObj && ["Condition", condObj.label],
    ].filter(Boolean);
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
  <div style="background:#0A5C43;padding:32px 40px;text-align:center">
    <p style="color:#fff;font-size:24px;font-weight:900;margin:0;letter-spacing:-0.5px">Cleaniq Services</p>
    <p style="color:rgba(255,255,255,0.6);font-size:11px;margin:6px 0 0;text-transform:uppercase;letter-spacing:2px">Property Condition Report</p>
  </div>
  <div style="padding:32px 40px">
    <p style="color:#1e293b;font-size:16px;font-weight:700;margin:0 0 6px">Your property report is attached.</p>
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 28px">Please find the full property condition report enclosed as a PDF. Open or save it for your records.</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
      ${rows.map(([k, v], i) => `<tr style="background:${i % 2 === 0 ? "#f8fafc" : "#fff"}">
        <td style="padding:10px 16px;color:#64748b;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.05em;width:130px;white-space:nowrap">${k}</td>
        <td style="padding:10px 16px;color:#1e293b;font-size:13px">${v}</td>
      </tr>`).join("")}
    </table>
  </div>
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center">
    <p style="color:#94a3b8;font-size:11px;margin:0">© ${new Date().getFullYear()} Cleaniq Services Ltd · <a href="https://cleaniqservices.com" style="color:#0A5C43;text-decoration:none">cleaniqservices.com</a></p>
  </div>
</div>
</body></html>`;
  };

  const handleSendEmail = async () => {
    if (!info.recipientEmail) {
      setToast({ msg: "Enter a recipient email address first", type: "error" });
      return;
    }
    setSending(true);

    const filename = `Property-Report-${(info.bookingRef || info.propertyName || "Cleaniq").replace(/[^a-z0-9]/gi, "-")}.pdf`;
    let iframe;
    try {
      iframe = await mountInIframe(buildHtml(true));
    } catch (e) {
      setToast({ msg: "Failed to prepare PDF — " + e.message, type: "error" });
      setSending(false);
      return;
    }

    let pdfBase64 = null;
    try {
      const jspdf = await html2pdf()
        .set(PDF_OPTS)
        .from(iframe.contentDocument.body)
        .toPdf()
        .get("pdf");
      pdfBase64 = jspdf.output("datauristring").split(",")[1];
    } catch (pdfErr) {
      console.error("PDF generation failed:", pdfErr);
      setToast({ msg: "PDF generation failed — " + (pdfErr.message || "unknown error"), type: "error" });
      setSending(false);
      return;
    } finally {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }

    try {
      const res = await fetch(`${API}/email-logs/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: info.recipientEmail,
          subject: `Property Report — ${info.propertyName || info.bookingRef || "Cleaniq"} · ${fmtDate(info.date)}`,
          html: buildNotificationHtml(),
          attachment: { filename, base64: pdfBase64 },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      setToast({ msg: `Report sent to ${info.recipientEmail} with PDF attached`, type: "success" });
    } catch (err) {
      setToast({ msg: err.message || "Failed to send report", type: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {/* Property Info */}
      <Section title="Property Details" icon={Building2}>
        {/* Customer / Booking search */}
        <div ref={searchRef} className="relative mb-5">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowResults(true); }}
              onFocus={() => search.length >= 2 && setShowResults(true)}
              placeholder="Search by customer name, email or booking ref to auto-fill…"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-200 bg-white text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setShowResults(false); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Results dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-30 top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
              {searchResults.map((b) => {
                const name = [b.customer?.firstName, b.customer?.lastName].filter(Boolean).join(" ") || "Unknown";
                const addr = b.property?.address || b.details?.address || "";
                return (
                  <button
                    key={b._id}
                    onMouseDown={(e) => { e.preventDefault(); fillFromBooking(b); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <User size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{name}</p>
                      <p className="text-[11px] text-slate-400 font-medium truncate">
                        {b.bookingId} · {b.customer?.email || "no email"}
                        {addr ? ` · ${addr}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${b.status === "Completed" ? "bg-emerald-50 text-emerald-600" : b.status === "Cancelled" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-600"}`}>
                        {b.status}
                      </span>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {showResults && q.length >= 2 && searchResults.length === 0 && (
            <div className="absolute z-30 top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 text-center text-sm text-slate-400 font-medium">
              No bookings found for "{search}"
            </div>
          )}
        </div>

        {/* Manual fields — still editable after auto-fill */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Property Name"><Input value={info.propertyName} onChange={set("propertyName")} placeholder="e.g. The Grand Flat" /></Field>
          <Field label="Address"><Input value={info.address} onChange={set("address")} placeholder="Full address" /></Field>
          <Field label="Booking Reference"><Input value={info.bookingRef} onChange={set("bookingRef")} placeholder="e.g. CLQ-0042" /></Field>
          <Field label="Date"><Input type="date" value={info.date} onChange={set("date")} /></Field>
          <Field label="Cleaner Name"><Input value={info.cleaner} onChange={set("cleaner")} placeholder="Name of cleaner" /></Field>
          <Field label="Send Report To (Email)"><Input type="email" value={info.recipientEmail} onChange={set("recipientEmail")} placeholder="client@example.com" /></Field>
        </div>
      </Section>

      {/* Condition */}
      <Section title="Current Condition of Property" icon={AlertTriangle}>
        <div className="flex flex-wrap gap-3">
          {CONDITIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCondition(c.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border-2 font-bold text-sm transition-all ${condition === c.id ? `${c.ring} ${c.bg} ${c.text} ring-2` : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
              {c.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Before & After — dynamic sections */}
      <Section title="Before & After — Photos & Videos" icon={Camera}>
        <div className="space-y-5">
          {photoSections.map((sec, idx) => (
            <div key={sec.id} className="rounded-2xl border border-slate-200 overflow-hidden">
              {/* Section header */}
              <div className="flex items-center gap-2 px-3 py-3 bg-slate-50 border-b border-slate-200 sm:px-4 sm:gap-3">
                <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider flex-shrink-0">
                  #{idx + 1}
                </span>
                <input
                  value={sec.label}
                  onChange={(e) => updSection(sec.id, "label", e.target.value)}
                  placeholder="e.g. Living Room, Bathroom…"
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                {photoSections.length > 1 && (
                  <button
                    onClick={() => removeSection(sec.id)}
                    className="flex-shrink-0 w-7 h-7 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Before + After grids */}
              <div className="p-4 space-y-5">
                <MediaGrid
                  items={sec.before}
                  label="Before"
                  onAdd={(items) => addSectionMedia(sec.id, "before", items)}
                  onRemove={(i) => removeSectionMedia(sec.id, "before", i)}
                />
                <div className="border-t border-slate-100 pt-4">
                  <MediaGrid
                    items={sec.after}
                    label="After"
                    onAdd={(items) => addSectionMedia(sec.id, "after", items)}
                    onRemove={(i) => removeSectionMedia(sec.id, "after", i)}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add section */}
          <button
            onClick={addSection}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-300 text-sm font-bold text-slate-500 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <Plus size={16} /> Add Before & After Section
          </button>
        </div>
      </Section>

      {/* Damage Report */}
      <Section title="Damage Report" icon={AlertTriangle}>
        <div className="space-y-4">
          {damages.length === 0 && (
            <p className="text-sm text-slate-400 py-2">No damage items recorded. Click below to add one.</p>
          )}
          {damages.map((d, dmgIdx) => (
            <div key={d.id} className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-3">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-600 uppercase tracking-wider">Damage #{dmgIdx + 1}</span>
                <button onClick={() => delDamage(d.id)} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors">
                  <Trash2 size={13} /> Remove
                </button>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Field label="Item Damaged">
                  <Input value={d.item} onChange={(e) => updDamage(d.id, "item", e.target.value)} placeholder="e.g. Mirror" />
                </Field>
                <Field label="Location">
                  <Input value={d.location} onChange={(e) => updDamage(d.id, "location", e.target.value)} placeholder="e.g. Bathroom" />
                </Field>
                <Field label="Severity">
                  <select
                    value={d.severity}
                    onChange={(e) => updDamage(d.id, "severity", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    {["Minor", "Moderate", "Major"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Description">
                  <Input value={d.description} onChange={(e) => updDamage(d.id, "description", e.target.value)} placeholder="Brief description" />
                </Field>
              </div>

              {/* Damage photos & videos — unlimited */}
              <div className="pt-1">
                <MediaGrid
                  items={d.photos || []}
                  label="Damage Photos & Videos"
                  compact
                  onAdd={(items) => addDamagePhotos(d.id, items)}
                  onRemove={(idx) => removeDamagePhoto(d.id, idx)}
                />
              </div>
            </div>
          ))}

          <button onClick={addDamage} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-sm font-bold text-slate-500 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all">
            <Plus size={15} /> Add Damage Item
          </button>
        </div>
      </Section>

      {/* Supplies Restock */}
      <Section title="Cleaning Supplies Restock" icon={Package}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {SUPPLIES.map((s) => (
            <div key={s} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${supplies[s] ? "border-primary/30 bg-primary/5" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`} onClick={() => toggleItem(supplies, setSupplies, s)}>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${supplies[s] ? "bg-primary border-primary" : "border-slate-300"}`}>
                {supplies[s] && <X size={11} className="text-white" />}
              </div>
              <span className="text-sm font-medium text-slate-700 flex-1">{s}</span>
              {supplies[s] && (
                <input
                  type="number" min="1" placeholder="Qty"
                  value={supplies[`qty_${s}`] || ""}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setQty(supplies, setSupplies, s, e.target.value)}
                  className="w-14 px-2 py-1 rounded-lg border border-primary/30 bg-white text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Consumables */}
      <Section title="Consumables Replenish" icon={Package}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {CONSUMABLES.map((s) => (
            <div key={s} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${consumables[s] ? "border-primary/30 bg-primary/5" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`} onClick={() => toggleItem(consumables, setConsumables, s)}>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${consumables[s] ? "bg-primary border-primary" : "border-slate-300"}`}>
                {consumables[s] && <X size={11} className="text-white" />}
              </div>
              <span className="text-sm font-medium text-slate-700 flex-1">{s}</span>
              {consumables[s] && (
                <input
                  type="number" min="1" placeholder="Qty"
                  value={consumables[`qty_${s}`] || ""}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setQty(consumables, setConsumables, s, e.target.value)}
                  className="w-14 px-2 py-1 rounded-lg border border-primary/30 bg-white text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Vending Machine */}
      <Section title="Vending Machine — Photos & Videos" icon={Camera}>
        <p className="text-xs text-slate-400 mb-3">Document stock levels and any vending machine issues. Add as many photos or videos as needed.</p>
        <MediaGrid
          items={vendingPhotos}
          onAdd={(items) => setVendingPhotos((p) => [...p, ...items])}
          onRemove={(i) => setVendingPhotos((p) => p.filter((_, idx) => idx !== i))}
        />
      </Section>

      {/* Inventory */}
      <Section title="Inventory Report" icon={ClipboardList}>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm" style={{ minWidth: "500px" }}>
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2.5 pr-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Item</th>
                <th className="text-center py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-20">Expected</th>
                <th className="text-center py-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-20">Actual</th>
                <th className="text-left py-2.5 pl-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 w-36">Notes</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((row, i) => {
                const mismatch = row.expected !== "" && row.actual !== "" && String(row.expected) !== String(row.actual);
                return (
                  <tr key={i} className={`border-b border-slate-100 ${mismatch ? "bg-red-50" : ""}`}>
                    <td className="py-2 pr-3 font-medium text-slate-700 text-xs whitespace-nowrap">{row.item}</td>
                    <td className="py-2 px-2">
                      <input type="number" min="0" value={row.expected} onChange={(e) => updInv(i, "expected", e.target.value)} placeholder="0" className="w-full text-center px-1.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
                    </td>
                    <td className="py-2 px-2">
                      <input type="number" min="0" value={row.actual} onChange={(e) => updInv(i, "actual", e.target.value)} placeholder="0" className={`w-full text-center px-1.5 py-1.5 rounded-lg border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${mismatch ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50"}`} />
                    </td>
                    <td className="py-2 pl-3">
                      <input value={row.notes} onChange={(e) => updInv(i, "notes", e.target.value)} placeholder={mismatch ? "⚠ Mismatch" : "Note"} className={`w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${mismatch ? "border-red-200 bg-red-50 placeholder:text-red-400" : "border-slate-200 bg-slate-50"}`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Additional Notes */}
      <Section title="Additional Notes" icon={FileText}>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Any additional observations, issues, or comments…" className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all" />
      </Section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-end gap-3">
        <button onClick={handleSendEmail} disabled={sending} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-2xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 disabled:opacity-60 transition-colors">
          {sending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
          {sending ? "Sending…" : "Send to Email"}
        </button>
        <button onClick={handleDownload} disabled={downloading} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-70 transition-colors shadow-sm shadow-primary/20">
          {downloading ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
          {downloading ? "Generating PDF…" : "Download PDF"}
        </button>
        <button onClick={printReport} className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:border-primary/40 hover:text-primary transition-colors">
          <Printer size={15} /> Print
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Tab 3 — Commercial Invoice  (full InvoiceBuilder)
// ══════════════════════════════════════════════════════════════════════════════

const CommercialQuote = () => <QuoteBuilderComponent />;
const CommercialInvoice = () => <InvoiceBuilderComponent />;

// ══════════════════════════════════════════════════════════════════════════════
// Main CommercialHub page
// ══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: "report", label: "Property Report", icon: ClipboardList, desc: "Condition, photos, damage & inventory" },
  { id: "quote", label: "Commercial Quote", icon: FileText, desc: "Airbnb & commercial cleaning quote" },
  { id: "invoice", label: "Commercial Invoice", icon: FileCheck, desc: "Generate by booking code" },
];

const CommercialHub = () => {
  const [tab, setTab] = useState("report");

  return (
    <div className="space-y-6 pb-24">
      {/* Page header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-primary p-8">
        <div className="absolute inset-0 opacity-10">
          <Building2 size={240} className="absolute -right-10 -bottom-10 text-white" />
        </div>
        <div className="relative flex items-center gap-5">
          <img src={logoSrc} alt="Cleaniq Services" className="h-14 rounded-2xl shadow-lg shadow-black/30 flex-shrink-0" />
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Commercial Hub</h1>
            <p className="text-sm text-white/55 mt-1">Airbnb & commercial client tools — reports, quotes, and invoices</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                active
                  ? "bg-primary/5 border-primary shadow-sm"
                  : "bg-white border-slate-200 hover:border-primary/30 hover:shadow-sm"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${active ? "bg-primary shadow-lg shadow-primary/30" : "bg-slate-100"}`}>
                <Icon size={18} className={active ? "text-white" : "text-slate-500"} />
              </div>
              <div className="pt-0.5">
                <p className={`text-sm font-bold leading-tight ${active ? "text-primary" : "text-slate-700"}`}>{t.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {tab === "report" && <PropertyReport />}
        {tab === "quote" && <CommercialQuote />}
        {tab === "invoice" && <CommercialInvoice />}
      </div>
    </div>
  );
};

export default CommercialHub;
