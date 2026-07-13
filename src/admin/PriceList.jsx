import React, { useState, useEffect, useMemo } from "react";
import {
  Tag, Send, Download, Printer, Plus, Trash2, RefreshCw,
  X, Search, Building2, FileText, Sparkles, CheckCircle2,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold ${type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
    {msg}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={15} /></button>
  </div>
);

const inp = "w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white";

const CATEGORY_ORDER = ["Base", "Rooms", "Extras"];
const CATEGORY_LABELS = { Base: "Core Services", Rooms: "Room Rates", Extras: "Add-ons & Extras" };
const unitLabel = (type) => type === "hourly" ? "/hr" : type === "per_room" ? "/room" : "";

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

  const setR = (k) => (e) => setRecipient((p) => ({ ...p, [k]: e.target.value }));

  // ── Fetch services ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API}/services?region=UK`);
        const data = await res.json();
        const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        const baseN = ["residential cleaning","deep clean","airbnb cleaning","office cleaning","end of tenancy","general cleaning"];
        const roomN = ["bedroom","bathroom","cloakroom","kitchen","utility room","reception room","conservatory"];
        const mapped = data.map((s) => {
          let cat = s.category;
          if (!cat) {
            cat = "Extras";
            if (baseN.some((b) => clean(b) === clean(s.name))) cat = "Base";
            else if (roomN.some((r) => clean(r) === clean(s.name))) cat = "Rooms";
          }
          return { ...s, category: cat };
        });
        setCatalogue(mapped);
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
    // Group by category in order
    for (const cat of CATEGORY_ORDER) {
      const items = listItems.filter((it) => it.category === cat && it.name);
      if (items.length) {
        rows.push({ type: "heading", label: CATEGORY_LABELS[cat] });
        items.forEach((it) => rows.push({ type: "item", name: it.name, price: Number(it.price || 0), unit: it.unit, description: it.description }));
      }
    }
    const customs = listItems.filter((it) => it.category === "custom" && it.name);
    if (customs.length) {
      rows.push({ type: "heading", label: "Additional Services" });
      customs.forEach((it) => rows.push({ type: "item", name: it.name, price: Number(it.price || 0), unit: it.unit, description: it.description }));
    }
    return rows;
  }, [listItems]);

  const buildHtml = () => {
    const today      = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const validUntil = new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    const rowsHtml = priceRows.map((row) => {
      if (row.type === "heading") return `
        <tr><td colspan="2" style="padding:14px 18px 6px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#0A5C43;border-bottom:2px solid #0A5C43;background:#f0fdf4">${row.label}</td></tr>`;
      const priceStr = row.price ? `£${Number(row.price).toFixed(2)}${unitLabel(row.unit) ? ` <span style="font-size:10px;color:#94a3b8">${unitLabel(row.unit)}</span>` : ""}` : "POA";
      return `
        <tr style="border-bottom:1px solid #f1f5f9">
          <td style="padding:12px 18px">
            <div style="font-size:13px;font-weight:700;color:#1e293b">${row.name}</div>
            ${row.description ? `<div style="font-size:11px;color:#64748b;margin-top:2px">${row.description}</div>` : ""}
          </td>
          <td style="padding:12px 18px;text-align:right;font-size:14px;font-weight:900;color:#0A5C43;white-space:nowrap">${priceStr}</td>
        </tr>`;
    }).join("");

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cleaniq Services — Price List</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#1e293b}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style>
</head><body><div style="max-width:700px;margin:0 auto;padding:0 0 48px">
  <div style="background:#0A5C43;padding:40px 40px 32px;position:relative;overflow:hidden">
    <div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;background:rgba(255,255,255,.05);border-radius:50%"></div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;position:relative">
      <div>
        <div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-.5px">Cleaniq Services</div>
        <div style="font-size:11px;color:rgba(255,255,255,.65);margin-top:3px;letter-spacing:.08em;text-transform:uppercase">Professional Cleaning Solutions</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.5)">Price List</div>
        <div style="font-size:28px;font-weight:900;color:#fff;margin-top:2px">Services &amp; Rates</div>
        <div style="font-size:11px;color:rgba(255,255,255,.55);margin-top:4px">Issued: ${today}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.55)">Valid until: ${validUntil}</div>
      </div>
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
      <div style="font-size:12px;color:#475569">cleaniqservices@gmail.com</div>
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
  <div style="margin:24px 40px 0;display:grid;grid-template-columns:1fr 1fr;gap:16px">
    ${includeVat ? `<div style="padding:14px 16px;background:#fef9c3;border:1px solid #fde68a;border-radius:8px"><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#92400e;margin-bottom:4px">VAT Notice</div><div style="font-size:11px;color:#78350f;line-height:1.6">All prices shown are exclusive of VAT. VAT at the prevailing rate (currently 20%) will be added where applicable.</div></div>` : ""}
    <div style="padding:14px 16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px"><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#166534;margin-bottom:4px">Terms</div><div style="font-size:11px;color:#15803d;line-height:1.6">Prices are subject to change. A formal quote will be issued before any work commences. POA = Price on Application.</div></div>
  </div>
  <div style="margin:32px 40px 0;padding-top:20px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:10px;color:#94a3b8">© ${new Date().getFullYear()} Cleaniq Services Ltd</div>
    <div style="font-size:10px;color:#94a3b8">cleaniqservices.com · cleaniqservices@gmail.com</div>
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
    const blob = new Blob([buildHtml()], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `Cleaniq-PriceList-${recipient.companyName?.replace(/\s+/g, "-") || Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
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
  return (
    <div className="space-y-6 pb-24">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Tag size={22} className="text-primary" /> Price List Generator
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Add services from the catalogue, set your prices, then send a branded price list to any company.
          </p>
        </div>
        <button
          onClick={() => setTab(tab === "edit" ? "preview" : "edit")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-primary/40 hover:text-primary transition-all"
        >
          <Sparkles size={15} />
          {tab === "edit" ? "Preview" : "Back to Edit"}
        </button>
      </div>

      {tab === "preview" ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Preview</span>
          </div>
          <iframe srcDoc={buildHtml()} className="w-full" style={{ height: "82vh", border: "none" }} title="Price List Preview" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Column 1: Catalogue ────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-700">Service Catalogue</h2>
              <span className="text-xs text-slate-400 font-medium">{catalogue.length} services</span>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
                <RefreshCw size={16} className="animate-spin mr-2" /> Loading…
              </div>
            ) : (
              CATEGORY_ORDER.map((cat) => {
                const items = filteredCatalogue[cat];
                if (!items.length) return null;
                const allAdded = items.every((s) => inList(s._id));
                return (
                  <div key={cat} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <span className="text-xs font-black text-slate-600 uppercase tracking-wide">{CATEGORY_LABELS[cat]}</span>
                      <button
                        onClick={() => addAllInCategory(cat)}
                        disabled={allAdded}
                        className="text-xs font-bold text-primary hover:text-primary/70 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {allAdded ? "All added" : "+ Add all"}
                      </button>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {items.map((s) => {
                        const added = inList(s._id);
                        return (
                          <div key={s._id} className="flex items-center gap-3 px-4 py-3">
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${added ? "text-slate-400" : "text-slate-800"}`}>{s.name}</p>
                              {s.rate ? (
                                <p className="text-xs text-slate-400 tabular-nums">£{Number(s.rate).toFixed(2)}{unitLabel(s.type)}</p>
                              ) : null}
                            </div>
                            {added ? (
                              <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                            ) : (
                              <button
                                onClick={() => addFromCatalogue(s)}
                                className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center"
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

          {/* ── Column 2: Price List (editable) ───────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-700">Your Price List</h2>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {listItems.filter((it) => it.name).length} items
              </span>
            </div>

            {listItems.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
                <Tag size={28} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No services added yet</p>
                <p className="text-xs text-slate-300 mt-1">Click + in the catalogue to add services here</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {listItems.map((it) => (
                    <div key={it.id} className="px-4 py-3 space-y-2">
                      <div className="flex items-center gap-2">
                        {/* Name — editable */}
                        <input
                          value={it.name}
                          onChange={(e) => updateItem(it.id, "name", e.target.value)}
                          placeholder="Service name"
                          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border-2 border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                        <button
                          onClick={() => removeItem(it.id)}
                          className="flex-shrink-0 w-7 h-7 rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center"
                        >
                          <X size={15} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Price */}
                        <div className="flex items-center gap-1 flex-1">
                          <span className="text-sm font-bold text-slate-400">£</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.price}
                            onChange={(e) => updateItem(it.id, "price", e.target.value)}
                            placeholder="0.00"
                            className="flex-1 px-2.5 py-1.5 rounded-lg border-2 border-slate-200 text-sm font-bold text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          />
                        </div>
                        {/* Unit */}
                        <select
                          value={it.unit}
                          onChange={(e) => updateItem(it.id, "unit", e.target.value)}
                          className="px-2 py-1.5 rounded-lg border-2 border-slate-200 text-xs font-bold text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        >
                          <option value="flat">flat</option>
                          <option value="hourly">/hr</option>
                          <option value="per_room">/room</option>
                        </select>
                      </div>
                      {/* Optional description */}
                      <input
                        value={it.description}
                        onChange={(e) => updateItem(it.id, "description", e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full px-2.5 py-1.5 rounded-lg border-2 border-slate-100 text-xs text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add custom service */}
            <button
              onClick={addCustom}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-500 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
            >
              <Plus size={16} /> Add Custom Service
            </button>

            {/* Clear all */}
            {listItems.length > 0 && (
              <button
                onClick={() => setListItems([])}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={13} /> Clear all
              </button>
            )}
          </div>

          {/* ── Column 3: Recipient + Actions ─────────────────────── */}
          <div className="space-y-4">
            {/* Recipient */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-primary" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Send To</span>
              </div>
              {[
                { label: "Company Name",  key: "companyName",  type: "text",  ph: "Acme Facilities Ltd" },
                { label: "Contact Name",  key: "contactName",  type: "text",  ph: "Jane Smith" },
                { label: "Email Address", key: "email",        type: "email", ph: "contact@company.com" },
                { label: "Phone",         key: "phone",        type: "tel",   ph: "+44 7700 000000" },
                { label: "Address",       key: "address",      type: "text",  ph: "Business address" },
              ].map(({ label, key, type, ph }) => (
                <div key={key}>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{label}</label>
                  <input type={type} value={recipient[key]} onChange={setR(key)} placeholder={ph} className={inp} />
                </div>
              ))}
            </div>

            {/* Cover note */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-primary" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">Cover Note</span>
              </div>
              <textarea
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-3 rounded-xl border-2 border-slate-200 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Opening message…"
              />
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  onClick={() => setIncludeVat((v) => !v)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${includeVat ? "bg-primary border-primary" : "border-slate-300"}`}
                >
                  {includeVat && <X size={11} className="text-white" />}
                </div>
                <span className="text-sm font-semibold text-slate-600">Include VAT notice</span>
              </label>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5 sticky top-4">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Actions</p>
              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {sending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? "Sending…" : "Send to Email"}
              </button>
              <button
                onClick={() => setTab("preview")}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Sparkles size={15} /> Preview
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-xs hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Download size={13} /> Download
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-xs hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Printer size={13} /> Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
