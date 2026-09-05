import React, { useState, useEffect, useMemo } from "react";
import {
  Tag, Send, Download, Printer, Plus, Trash2, RefreshCw,
  X, Search, Building2, FileText, Sparkles, CheckCircle2, Eye, Minus, DoorOpen,
} from "lucide-react";
import logo from "../assets/logo DP.jpg";

const API = import.meta.env.VITE_API_URL;

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
    {msg}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={15} /></button>
  </div>
);

const inp = "w-full px-3.5 py-2.5 rounded-xl border border-white/10 text-sm font-medium focus:outline-none focus:border-emerald-500/50 transition-all bg-white/5 text-white placeholder:text-white/20";

const CATEGORY_ORDER = ["Base", "Rooms", "Extras"];
const CATEGORY_LABELS = { Base: "Core Services", Rooms: "Room Rates", Extras: "Add-ons & Extras" };
const unitLabel = (type) => type === "hourly" ? "/hr" : type === "per_room" ? "/room" : "";

const DEFAULT_ROOMS = [
  { _id: "dr_bedroom",      name: "Bedroom",        rate: 0 },
  { _id: "dr_bathroom",     name: "Bathroom",        rate: 0 },
  { _id: "dr_kitchen",      name: "Kitchen",         rate: 0 },
  { _id: "dr_reception",    name: "Reception Room",  rate: 0 },
  { _id: "dr_toilet",       name: "Toilet / WC",     rate: 0 },
  { _id: "dr_conservatory", name: "Conservatory",    rate: 0 },
  { _id: "dr_utility",      name: "Utility Room",    rate: 0 },
];

export default function PriceList() {
  const [catalogue, setCatalogue]   = useState([]);      // all services from API
  const [loading, setLoading]       = useState(true);
  const [listItems, setListItems]   = useState([]);      // [{id,name,price,unit,description,category}]
  const [recipient, setRecipient]   = useState({ companyName: "", contactName: "", email: "", phone: "", address: "" });
  const [intro, setIntro]           = useState("Please find below our current service price list. All prices are in GBP and inclusive of labour and standard cleaning materials unless otherwise stated.");
  const [includeVat, setIncludeVat] = useState(false);
  const [sending, setSending]       = useState(false);
  const [toast, setToast]           = useState(null);
  const [search, setSearch]         = useState("");
  const [tab, setTab]               = useState("edit"); // edit | preview
  const [roomCounts, setRoomCounts] = useState({});    // { [serviceId]: count }
  const [roomPrices, setRoomPrices] = useState({});   // { [serviceId]: price string } for default rooms
  const [savingPrices, setSavingPrices] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponPromoCode, setCouponPromoCode] = useState("");
  const [couponPromoPercent, setCouponPromoPercent] = useState("");

  const setR = (k) => (e) => setRecipient((p) => ({ ...p, [k]: e.target.value }));

  // ── Save room prices → writes back to the service records in the DB ───────
  // This means the booking page and customer calculations all use the new rates.
  const saveRoomPrices = async () => {
    setSavingPrices(true);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const headers = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      await Promise.all(
        roomCatalogueItems.map(async (s) => {
          const rate = Number(roomPrices[s._id] || 0);
          if (s._id.startsWith("dr_")) {
            // DEFAULT_ROOM — upsert as a real service so it shows up in bookings
            await fetch(`${API}/services`, {
              method: "POST",
              headers,
              body: JSON.stringify({ name: s.name, rate, category: "Rooms", type: "per_room", region: "UK" }),
            });
          } else {
            // Catalogue room — update rate on the existing service document
            await fetch(`${API}/services/${s._id}`, {
              method: "PUT",
              headers,
              body: JSON.stringify({ rate }),
            });
          }
        })
      );
      // Refresh catalogue so the new rates reflect everywhere on this page
      const res2 = await fetch(`${API}/services?region=UK`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res2.ok) {
        const data = await res2.json();
        const clean = (n) => n.toLowerCase().replace(/[^a-z0-9]/g, "");
        const baseN = ["residential cleaning","deep clean","airbnb cleaning","office cleaning","end of tenancy","general cleaning"];
        const roomN = ["bedroom","bathroom","cloakroom","kitchen","utility room","reception room","conservatory"];
        const mapped = data.map((s) => {
          let cat = s.category;
          if (!cat) {
            cat = "Extras";
            if (baseN.some((b) => clean(b) === clean(s.name))) cat = "Base";
            else if (roomN.some((r) => clean(s.name).includes(clean(r)))) cat = "Rooms";
          }
          return { ...s, category: cat };
        });
        setCatalogue(mapped);
      }
      setToast({ msg: "Room prices saved — booking calculator updated", type: "success" });
    } catch {
      setToast({ msg: "Failed to save room prices", type: "error" });
    } finally {
      setSavingPrices(false);
    }
  };

  // ── Fetch services ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("adminToken") || "";
        const res  = await fetch(`${API}/services?region=UK`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        const baseN = ["residential cleaning","deep clean","airbnb cleaning","office cleaning","end of tenancy","general cleaning"];
        const roomN = ["bedroom","bathroom","cloakroom","kitchen","utility room","reception room","conservatory"];
        const mapped = data.map((s) => {
          let cat = s.category;
          if (!cat) {
            cat = "Extras";
            if (baseN.some((b) => clean(b) === clean(s.name))) cat = "Base";
            else if (roomN.some((r) => clean(s.name).includes(clean(r)))) cat = "Rooms";
          }
          return { ...s, category: cat };
        });
        setCatalogue(mapped);
        // Initialise room counters at 0
        const initCounts = {};
        mapped.filter((s) => s.category === "Rooms").forEach((s) => { initCounts[s._id] = 0; });
        setRoomCounts(initCounts);
        // Pre-fill room price inputs from existing service rates
        const initPrices = {};
        mapped.filter((s) => s.category === "Rooms").forEach((s) => {
          if (s.rate) initPrices[s._id] = String(s.rate);
        });
        DEFAULT_ROOMS.forEach((s) => { if (!initPrices[s._id]) initPrices[s._id] = ""; });
        setRoomPrices((prev) => ({ ...initPrices, ...prev }));
        // Pre-add Base services to the list
        setListItems(
          mapped
            .filter((s) => s.category === "Base")
            .map((s) => ({ id: s._id, name: s.name, price: String(s.rate || ""), unit: s.type || "flat", description: s.description || "", category: s.category }))
        );
      } catch { /* leave empty */ }
      finally { setLoading(false); }
    })();
  }, []);

  // ── Catalogue helpers ─────────────────────────────────────────────────────
  const inList = (id) => listItems.some((it) => it.id === id);

  const addFromCatalogue = (s) => {
    if (inList(s._id)) return;
    setListItems((p) => [...p, { id: s._id, name: s.name, price: String(s.rate || ""), unit: s.type || "flat", description: s.description || "", category: s.category }]);
  };

  const addAllInCategory = (cat) => {
    const toAdd = filteredCatalogue[cat].filter((s) => !inList(s._id));
    if (!toAdd.length) return;
    setListItems((p) => [...p, ...toAdd.map((s) => ({ id: s._id, name: s.name, price: String(s.rate || ""), unit: s.type || "flat", description: s.description || "", category: s.category }))]);
  };

  // ── List item helpers ─────────────────────────────────────────────────────
  const removeItem = (id) => setListItems((p) => p.filter((it) => it.id !== id));

  const updateItem = (id, key, val) =>
    setListItems((p) => p.map((it) => it.id === id ? { ...it, [key]: val } : it));

  const addCustom = () =>
    setListItems((p) => [...p, { id: `c_${Date.now()}`, name: "", price: "", unit: "flat", description: "", category: "custom" }]);

  // ── Room counter helpers ───────────────────────────────────────────────────
  const roomCatalogueItems = useMemo(() => {
    const fromCatalogue = catalogue.filter((s) => s.category === "Rooms");
    return fromCatalogue.length > 0 ? fromCatalogue : DEFAULT_ROOMS;
  }, [catalogue]);
  const stepRoom = (id, delta) =>
    setRoomCounts((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
  const hasActiveRooms = roomCatalogueItems.some((s) => (roomCounts[s._id] || 0) > 0);

  // ── Filtered catalogue ────────────────────────────────────────────────────
  const filteredCatalogue = useMemo(() => {
    const q = search.toLowerCase();
    const result = {};
    for (const cat of CATEGORY_ORDER) {
      result[cat] = catalogue.filter((s) => s.category === cat && (!q || s.name.toLowerCase().includes(q)));
    }
    return result;
  }, [catalogue, search]);

  // ── Build HTML for PDF/print/email ───────────────────────────────────────
  const priceRows = useMemo(() => {
    const rows = [];
    // Base and Extras from listItems (skip Rooms — handled separately via counters)
    for (const cat of CATEGORY_ORDER.filter((c) => c !== "Rooms")) {
      const items = listItems.filter((it) => it.category === cat && it.name);
      if (items.length) {
        rows.push({ type: "heading", label: CATEGORY_LABELS[cat] });
        items.forEach((it) => rows.push({ type: "item", name: it.name, price: Number(it.price || 0), unit: it.unit, description: it.description }));
      }
    }
    // Rooms from counters — only those with count > 0
    const activeRooms = roomCatalogueItems.filter((s) => (roomCounts[s._id] || 0) > 0);
    if (activeRooms.length) {
      rows.push({ type: "heading", label: CATEGORY_LABELS["Rooms"] });
      activeRooms.forEach((s) => {
        const count = roomCounts[s._id];
        const rateEach = Number(roomPrices[s._id] || s.rate || 0);
        rows.push({
          type: "item",
          name: `${s.name}`,
          price: rateEach * count,
          unit: "flat",
          description: `${count} room${count !== 1 ? "s" : ""} × £${rateEach.toFixed(2)} per room`,
        });
      });
    }
    const customs = listItems.filter((it) => it.category === "custom" && it.name);
    if (customs.length) {
      rows.push({ type: "heading", label: "Additional Services" });
      customs.forEach((it) => rows.push({ type: "item", name: it.name, price: Number(it.price || 0), unit: it.unit, description: it.description }));
    }
    return rows;
  }, [listItems, roomCounts, roomCatalogueItems, roomPrices]);

  const buildHtml = () => {
    const today      = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const validUntil = new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const logoUrl    = `${window.location.origin}${logo}`;

    const rowsHtml = priceRows.map((row) => {
      if (row.type === "heading") return `
        <tr><td colspan="2" style="padding:14px 20px 7px;font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#0A5C43;border-bottom:2px solid #d1fae5;background:#f0fdf4">${row.label}</td></tr>`;
      const priceStr = row.price ? `£${Number(row.price).toFixed(2)}${unitLabel(row.unit) ? `<span style="font-size:10px;color:#94a3b8;margin-left:2px">${unitLabel(row.unit)}</span>` : ""}` : `<span style="font-size:11px;font-weight:600;color:#94a3b8">POA</span>`;
      return `
        <tr style="border-bottom:1px solid #f1f5f9">
          <td style="padding:13px 20px">
            <div style="font-size:13px;font-weight:700;color:#1e293b">${row.name}</div>
            ${row.description ? `<div style="font-size:11px;color:#64748b;margin-top:3px">${row.description}</div>` : ""}
          </td>
          <td style="padding:13px 20px;text-align:right;font-size:15px;font-weight:900;color:#0A5C43;white-space:nowrap">${priceStr}</td>
        </tr>`;
    }).join("");

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cleaniq Services — Price List</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#1e293b}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style>
</head><body><div style="max-width:720px;margin:0 auto;padding:0 0 56px">
  <div style="background:#0A5C43;padding:32px 40px;display:flex;justify-content:space-between;align-items:center">
    <img src="${logoUrl}" alt="Cleaniq Services" style="height:60px;border-radius:8px;display:block" />
    <div style="text-align:right">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:rgba(255,255,255,.45);margin-bottom:4px">Services &amp; Rates</div>
      <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-.3px">Price List</div>
      <div style="font-size:11px;color:rgba(255,255,255,.55);margin-top:5px">Issued: ${today}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.45)">Valid until: ${validUntil}</div>
    </div>
  </div>
  <div style="padding:28px 40px 0;display:flex;justify-content:space-between;gap:32px">
    ${recipient.companyName || recipient.contactName ? `
    <div style="flex:1">
      <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:6px">Prepared For</div>
      ${recipient.companyName ? `<div style="font-size:15px;font-weight:800;color:#1e293b">${recipient.companyName}</div>` : ""}
      ${recipient.contactName ? `<div style="font-size:12px;color:#475569;margin-top:2px">${recipient.contactName}</div>` : ""}
      ${recipient.email ? `<div style="font-size:12px;color:#475569">${recipient.email}</div>` : ""}
      ${recipient.phone ? `<div style="font-size:12px;color:#475569">${recipient.phone}</div>` : ""}
      ${recipient.address ? `<div style="font-size:12px;color:#475569;margin-top:2px">${recipient.address}</div>` : ""}
    </div>` : "<div style='flex:1'></div>"}
    <div style="flex:1">
      <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin-bottom:6px">From</div>
      <div style="font-size:13px;font-weight:700;color:#1e293b">Cleaniq Services Ltd</div>
      <div style="font-size:12px;color:#475569">info@cleaniqservices.com</div>
      <div style="font-size:12px;color:#475569">+44 7752 476368</div>
      <div style="font-size:12px;color:#475569">Manchester, United Kingdom</div>
    </div>
  </div>
  ${intro ? `<div style="margin:24px 40px 0;padding:16px 20px;background:#f8fafc;border-left:3px solid #0A5C43;border-radius:0 8px 8px 0"><p style="font-size:12px;color:#475569;line-height:1.7">${intro}</p></div>` : ""}
  <div style="margin:28px 40px 0">
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
      <thead><tr style="background:#1e293b">
        <th style="padding:12px 18px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8">Service</th>
        <th style="padding:12px 18px;text-align:right;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8">Price</th>
      </tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>
  ${showCoupon && couponPromoCode ? `
  <div style="margin:24px 40px 0;padding:18px 24px;background:linear-gradient(135deg,#0A5C43 0%,#0d7a5a 100%);border-radius:12px;display:flex;align-items:center;gap:20px">
    <div style="font-size:32px;line-height:1">🏷️</div>
    <div>
      <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.15em;color:rgba(255,255,255,.55);margin-bottom:4px">Exclusive Offer</div>
      <div style="font-size:16px;font-weight:900;color:#fff;letter-spacing:-.2px">Use code <span style="background:rgba(255,255,255,.15);padding:2px 10px;border-radius:6px;font-family:monospace;letter-spacing:.05em">${couponPromoCode.toUpperCase()}</span>${couponPromoPercent ? ` to get <span style="color:#6ee7b7">${couponPromoPercent}% off</span>` : ""} your booking</div>
      <div style="font-size:11px;color:rgba(255,255,255,.6);margin-top:5px">Book online at cleaniqservices.com — discount applied automatically at checkout</div>
    </div>
  </div>` : ""}
  <div style="margin:24px 40px 0;display:grid;grid-template-columns:1fr 1fr;gap:16px">
    ${includeVat ? `<div style="padding:14px 16px;background:#fef9c3;border:1px solid #fde68a;border-radius:8px"><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#92400e;margin-bottom:4px">VAT Notice</div><div style="font-size:11px;color:#78350f;line-height:1.6">All prices shown are exclusive of VAT. VAT at the prevailing rate (currently 20%) will be added where applicable.</div></div>` : ""}
    <div style="padding:14px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px"><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#166534;margin-bottom:4px">Terms</div><div style="font-size:11px;color:#15803d;line-height:1.6">Prices are subject to change. A formal quote will be issued before any work commences. POA = Price on Application.</div></div>
  </div>
  <div style="margin:32px 40px 0;padding-top:20px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:10px;color:#94a3b8">© ${new Date().getFullYear()} Cleaniq Services Ltd</div>
    <div style="font-size:10px;color:#94a3b8">cleaniqservices.com · info@cleaniqservices.com</div>
  </div>
</div></body></html>`;
  };

  const handlePrint = () => {
    const w = window.open("", "_blank");
    w.document.write(buildHtml());
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const handleDownload = () => {
    const html = buildHtml();
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 600); }
  };

  const handleSend = async () => {
    if (!recipient.email) { setToast({ msg: "Enter recipient email first", type: "error" }); return; }
    const items = priceRows.filter((r) => r.type === "item");
    if (!items.length) { setToast({ msg: "Add at least one service to the list", type: "error" }); return; }
    setSending(true);
    try {
      const res = await fetch(`${API}/custom-invoice/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: `PL-${Date.now().toString().slice(-6)}`,
          customerName:  recipient.contactName || recipient.companyName || "Valued Client",
          customerEmail: recipient.email,
          invoiceDate:   new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
          items: items.map((r) => ({ description: r.name + (r.description ? ` — ${r.description}` : ""), qty: 1, rate: r.price || 0 })),
          notes: intro,
          paymentInstructions: "",
          showPaidBadge: false,
          currencySymbol: "£",
          label: "Price List",
          isQuote: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setToast({ msg: `Price list sent to ${recipient.email}`, type: "success" });
    } catch (err) {
      setToast({ msg: err.message || "Failed to send", type: "error" });
    } finally {
      setSending(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const CAT_COLORS = {
    Base:   { dot: "bg-emerald-500", hdr: "bg-emerald-500/10 border-emerald-500/20", lbl: "text-emerald-400" },
    Rooms:  { dot: "bg-blue-500",    hdr: "bg-blue-500/10 border-blue-500/20",       lbl: "text-blue-400" },
    Extras: { dot: "bg-amber-500",   hdr: "bg-amber-500/10 border-amber-500/20",     lbl: "text-amber-400" },
  };

  return (
    <div className="space-y-6 pb-24">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0B2D22] border border-white/7 p-8">
        <div className="absolute inset-0 opacity-[0.07]">
          <Tag size={280} className="absolute -right-16 -bottom-12 text-white" />
        </div>
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <img src={logo} alt="Cleaniq Services" className="h-14 rounded-2xl shadow-lg shadow-black/30 flex-shrink-0" />
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Price List Generator</h1>
              <p className="text-sm text-white/40 mt-1">Build a branded price list and send it directly to any company</p>
            </div>
          </div>
          <button
            onClick={() => setTab(tab === "edit" ? "preview" : "edit")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 text-sm font-bold transition-all flex-shrink-0"
          >
            <Eye size={15} />
            {tab === "edit" ? "Preview" : "Back to Edit"}
          </button>
        </div>
      </div>

      {tab === "preview" ? (
        <div className="bg-[#0B2D22] rounded-2xl border border-white/7 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.04] bg-[#071D16] flex items-center justify-between">
            <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Live Preview</span>
            <div className="flex gap-2">
              <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-xs font-bold transition-all">
                <Download size={12} /> Save PDF
              </button>
              <button onClick={handleSend} disabled={sending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all disabled:opacity-60">
                <Send size={12} /> {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
          <iframe srcDoc={buildHtml()} className="w-full" style={{ height: "82vh", border: "none" }} title="Price List Preview" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Column 1: Catalogue ─────────────────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white/80 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center">
                  <Search size={11} className="text-white/40" />
                </span>
                Service Catalogue
              </h2>
              <span className="text-[11px] text-white/40 font-semibold bg-white/10 px-2 py-0.5 rounded-full">{catalogue.length} services</span>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-white/40 text-sm">
                <RefreshCw size={16} className="animate-spin mr-2" /> Loading catalogue…
              </div>
            ) : (
              CATEGORY_ORDER.map((cat) => {
                const items = filteredCatalogue[cat];
                if (!items.length) return null;
                const allAdded = items.every((s) => inList(s._id));
                const cc = CAT_COLORS[cat] || CAT_COLORS.Extras;
                return (
                  <div key={cat} className="bg-[#0B2D22] rounded-2xl border border-white/7 overflow-hidden">
                    <div className={`flex items-center justify-between px-4 py-3 border-b ${cc.hdr}`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cc.dot}`} />
                        <span className={`text-xs font-black uppercase tracking-wide ${cc.lbl}`}>{CATEGORY_LABELS[cat]}</span>
                      </div>
                      <button
                        onClick={() => addAllInCategory(cat)}
                        disabled={allAdded}
                        className={`text-xs font-bold transition-colors ${allAdded ? "text-white/25 cursor-not-allowed" : "text-emerald-400 hover:text-emerald-300"}`}
                      >
                        {allAdded ? "✓ All added" : "+ Add all"}
                      </button>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                      {items.map((s) => {
                        const added = inList(s._id);
                        return (
                          <div key={s._id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${added ? "bg-emerald-500/10" : "hover:bg-white/[0.04]"}`}>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${added ? "text-white/40" : "text-white"}`}>{s.name}</p>
                              {s.rate ? (
                                <p className={`text-xs tabular-nums mt-0.5 ${added ? "text-white/25" : "text-emerald-400 font-bold"}`}>
                                  £{Number(s.rate).toFixed(2)}{unitLabel(s.type)}
                                </p>
                              ) : null}
                            </div>
                            {added ? (
                              <CheckCircle2 size={17} className="text-emerald-400 flex-shrink-0" />
                            ) : (
                              <button
                                onClick={() => addFromCatalogue(s)}
                                className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center"
                              >
                                <Plus size={14} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Column 2: Price List (editable) ─────────────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white/80 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-emerald-500/15 flex items-center justify-center">
                  <Tag size={11} className="text-emerald-400" />
                </span>
                Your Price List
              </h2>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full">
                {listItems.filter((it) => it.name).length} items
              </span>
            </div>

            {listItems.length === 0 ? (
              <div className="bg-[#0B2D22] rounded-2xl border-2 border-dashed border-white/10 p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <Tag size={24} className="text-white/25" />
                </div>
                <p className="text-sm font-bold text-white/40">No services added yet</p>
                <p className="text-xs text-white/25 mt-1.5">Click + in the catalogue to add services</p>
              </div>
            ) : (
              <div className="bg-[#0B2D22] rounded-2xl border border-white/7 overflow-hidden">
                <div className="divide-y divide-white/[0.04]">
                  {listItems.map((it) => (
                    <div key={it.id} className="p-4 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          value={it.name}
                          onChange={(e) => updateItem(it.id, "name", e.target.value)}
                          placeholder="Service name"
                          className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
                        />
                        <button
                          onClick={() => removeItem(it.id)}
                          className="flex-shrink-0 w-8 h-8 rounded-xl text-white/25 hover:bg-rose-500/10 hover:text-rose-400 transition-all flex items-center justify-center border border-transparent hover:border-rose-500/20"
                        >
                          <X size={15} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 flex-1 bg-white/5 border border-white/10 rounded-xl px-3 focus-within:border-emerald-500/50 transition-all">
                          <span className="text-sm font-bold text-white/40">£</span>
                          <input
                            type="number" min="0" step="0.01"
                            value={it.price}
                            onChange={(e) => updateItem(it.id, "price", e.target.value)}
                            placeholder="0.00"
                            className="flex-1 py-2 bg-transparent text-sm font-bold text-right tabular-nums text-emerald-400 focus:outline-none"
                          />
                        </div>
                        <select
                          value={it.unit}
                          onChange={(e) => updateItem(it.id, "unit", e.target.value)}
                          className="px-2.5 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white/60 focus:outline-none focus:border-emerald-500/50 transition-all"
                        >
                          <option value="flat">flat</option>
                          <option value="hourly">/hr</option>
                          <option value="per_room">/room</option>
                        </select>
                      </div>
                      <input
                        value={it.description}
                        onChange={(e) => updateItem(it.id, "description", e.target.value)}
                        placeholder="Short description (optional)"
                        className="w-full px-3 py-1.5 rounded-lg border border-white/[0.04] bg-white/[0.03] text-xs text-white/40 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Room counter panel ──────────────────────────────── */}
            <div className="bg-[#0B2D22] rounded-2xl border border-white/7 overflow-hidden">
                <div className="px-4 py-3 border-b border-blue-500/20 bg-blue-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-black uppercase tracking-wide text-blue-400">Room Rates</span>
                    {hasActiveRooms && (
                      <span className="text-[10px] font-bold text-blue-300 bg-blue-500/15 px-1.5 py-0.5 rounded-full">
                        {roomCatalogueItems.reduce((s, r) => s + (roomCounts[r._id] || 0), 0)} rooms
                      </span>
                    )}
                  </div>
                  <button
                    onClick={saveRoomPrices}
                    disabled={savingPrices}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/35 hover:text-white text-[10px] font-bold transition-all disabled:opacity-50"
                  >
                    {savingPrices ? <RefreshCw size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                    {savingPrices ? "Saving…" : "Save Prices"}
                  </button>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {roomCatalogueItems.map((s) => {
                    const count = roomCounts[s._id] || 0;
                    return (
                      <div key={s._id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${count > 0 ? "bg-blue-500/5" : ""}`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${count > 0 ? "text-white" : "text-white/40"}`}>{s.name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] text-white/25">£</span>
                            <input
                              type="number" min="0" step="0.01"
                              placeholder="0.00"
                              value={roomPrices[s._id] || ""}
                              onChange={(e) => setRoomPrices((p) => ({ ...p, [s._id]: e.target.value }))}
                              className="w-20 px-1.5 py-0.5 rounded-md border border-white/10 bg-white/5 text-xs text-blue-300 font-bold placeholder:text-white/20 focus:outline-none focus:border-blue-500/50"
                            />
                            <span className="text-[10px] text-white/25">/room</span>
                            {count > 0 && Number(roomPrices[s._id]) > 0 && (
                              <span className="text-[10px] text-blue-300 ml-1">= £{(Number(roomPrices[s._id]) * count).toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        {/* Stepper */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => stepRoom(s._id, -1)}
                            disabled={count === 0}
                            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                          >
                            <Minus size={12} />
                          </button>
                          <span className={`w-6 text-center text-sm font-black tabular-nums ${count > 0 ? "text-blue-300" : "text-white/25"}`}>
                            {count}
                          </span>
                          <button
                            onClick={() => stepRoom(s._id, 1)}
                            className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {hasActiveRooms && (
                  <div className="px-4 py-2.5 border-t border-white/[0.04] flex items-center justify-between">
                    <span className="text-xs text-white/30 font-semibold">Room total</span>
                    <span className="text-xs font-black text-blue-300 tabular-nums">
                      £{roomCatalogueItems.reduce((s, r) => s + (roomCounts[r._id] || 0) * Number(r.rate || roomPrices[r._id] || 0), 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

            <button
              onClick={addCustom}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-white/10 text-sm font-bold text-white/40 hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all"
            >
              <Plus size={16} /> Add Custom Service
            </button>

            {listItems.length > 0 && (
              <button
                onClick={() => setListItems([])}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-white/40 hover:text-rose-400 transition-colors"
              >
                <Trash2 size={13} /> Clear all
              </button>
            )}
          </div>

          {/* ── Column 3: Recipient + Actions ───────────────────── */}
          <div className="space-y-4">
            {/* Recipient card */}
            <div className="bg-[#0B2D22] rounded-2xl border border-white/7 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.04] bg-[#071D16] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <Building2 size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white/80">Send To</p>
                  <p className="text-[10px] text-white/40 font-medium">Recipient details</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: "Company Name",  key: "companyName",  type: "text",  ph: "Acme Facilities Ltd" },
                  { label: "Contact Name",  key: "contactName",  type: "text",  ph: "Jane Smith" },
                  { label: "Email Address", key: "email",        type: "email", ph: "contact@company.com" },
                  { label: "Phone",         key: "phone",        type: "tel",   ph: "+44 7700 000000" },
                  { label: "Address",       key: "address",      type: "text",  ph: "Business address" },
                ].map(({ label, key, type, ph }) => (
                  <div key={key}>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">{label}</label>
                    <input type={type} value={recipient[key]} onChange={setR(key)} placeholder={ph} className={inp} />
                  </div>
                ))}
              </div>
            </div>

            {/* Cover note */}
            <div className="bg-[#0B2D22] rounded-2xl border border-white/7 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.04] bg-[#071D16] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <FileText size={14} className="text-emerald-400" />
                </div>
                <p className="text-sm font-black text-white/80">Cover Note</p>
              </div>
              <div className="p-5 space-y-3">
                <textarea
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-emerald-500/50 transition-all"
                  placeholder="Opening message…"
                />
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div
                    onClick={() => setIncludeVat((v) => !v)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${includeVat ? "bg-emerald-500 border-emerald-500" : "border-white/25"}`}
                  >
                    {includeVat && <X size={11} className="text-white" />}
                  </div>
                  <span className="text-sm font-semibold text-white/80">Include VAT notice</span>
                </label>

                {/* Coupon promo section */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none mt-1">
                  <div
                    onClick={() => setShowCoupon((v) => !v)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${showCoupon ? "bg-emerald-500 border-emerald-500" : "border-white/25"}`}
                  >
                    {showCoupon && <X size={11} className="text-white" />}
                  </div>
                  <span className="text-sm font-semibold text-white/80">Include coupon offer in PDF</span>
                </label>

                {showCoupon && (
                  <div className="mt-3 space-y-3 pl-7 border-l-2 border-emerald-500/20 ml-2.5">
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-wide block mb-1.5">Coupon Code</label>
                      <input
                        type="text"
                        value={couponPromoCode}
                        onChange={e => setCouponPromoCode(e.target.value.toUpperCase())}
                        placeholder="e.g. SUMMER20"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-wide block mb-1.5">Discount % <span className="text-white/20 normal-case font-normal">(optional)</span></label>
                      <input
                        type="number"
                        min="1" max="100"
                        value={couponPromoPercent}
                        onChange={e => setCouponPromoPercent(e.target.value)}
                        placeholder="e.g. 10"
                        className={inp}
                      />
                    </div>
                    {couponPromoCode && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-400 font-medium">
                        Preview: <span className="font-black">Use code {couponPromoCode}{couponPromoPercent ? ` to get ${couponPromoPercent}% off` : ""} your booking</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions sticky card */}
            <div className="bg-[#0B2D22] rounded-2xl border border-white/7 overflow-hidden sticky top-4">
              <div className="px-5 py-4 border-b border-white/[0.04] bg-gradient-to-r from-emerald-500/5 to-transparent">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-400">Actions</p>
              </div>
              <div className="p-5 space-y-2.5">
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm disabled:opacity-60 transition-colors"
                >
                  {sending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                  {sending ? "Sending…" : "Send to Email"}
                </button>
                <button
                  onClick={() => setTab("preview")}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 font-bold text-sm hover:bg-white/10 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
                >
                  <Eye size={15} /> Preview Price List
                </button>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold text-xs hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
                  >
                    <Download size={13} /> Save PDF
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold text-xs hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
                  >
                    <Printer size={13} /> Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
