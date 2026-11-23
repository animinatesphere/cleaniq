// Turns a page's content (text, lists, groups) into simple edit boxes, so every page can be edited
// without a custom form. Labels and help text come from LABELS below.
import { ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";
import { SERVICE_PAGES, servicePagePath } from "../utils/servicePages";

// Friendly names for the content's field names.
const LABELS = {
  basics: ["Top of page & Google", "The page's main heading, intro and what Google shows in search results."],
  title: ["Title", ""],
  meta: ["Google description", "Shown under the page title in Google. Aim for 120–158 characters."],
  heading: ["Heading", ""],
  tagline: ["Tagline", ""],
  description: ["Intro text", ""],
  points: ["Key points", ""],
  services: ["Services list", ""],
  details: ["Page sections", ""],
  intro: ["Introduction", ""],
  whyChoose: ["Why choose us", "Each point keeps its icon."],
  checklist: ["Checklist", ""],
  rooms: ["Rooms", ""],
  room: ["Room", ""],
  tasks: ["Tasks", ""],
  whyMatters: ["Why it matters", ""],
  body: ["Text", ""],
  seoFooter: ["Small print at the bottom of the page", ""],
  seo: ["More sections", ""],
  banner: ["Top banner", ""],
  h2: ["Heading", ""],
  ticks: ["Tick points", ""],
  serviceFor: ["\"This is a service for\"", ""],
  label: ["Small label above the heading", ""],
  paras: ["Paragraphs", ""],
  how: ["How it works", ""],
  steps: ["Steps", ""],
  benefits: ["Benefits", ""],
  items: ["Items", ""],
  types: ["Types", ""],
  chips: ["Tags", ""],
  compare: ["Comparison", ""],
  cards: ["Cards", ""],
  experts: ["Our cleaners", ""],
  combine: ["Extra services", ""],
  links: ["Links", ""],
  to: ["Links to page", "A page address on this website, e.g. /service/deep-cleaning-manchester"],
  name: ["Name", ""],
  local: ["Local area", ""],
  tips: ["Tips", ""],
  quote: ["Quote box", ""],
  closing: ["Closing box (after the FAQs)", ""],
  faqTitle: ["FAQ heading", "Shown after \"Frequently Asked Questions:\""],
  faqs: ["FAQs", ""],
  q: ["Question", ""],
  a: ["Answer", ""],
  guide: ["Area guide", ""],
  highlights: ["Neighbourhoods (shown on the homepage)", ""],
  popular: ["Popular services here", ""],
  slug: ["Service", ""],
  why: ["Why it suits this area", ""],
  goodToKnow: ["Good to know", ""],
  postcodes: ["Postcodes", ""],
  homes: ["Homes in this area", ""],
};
const LONG = new Set(["meta", "description", "intro", "body", "seoFooter", "a", "homes", "why", "paras", "tips", "goodToKnow", "tasks", "points", "ticks"]);

// Name for one item in a list ("FAQ 3", "Step 2"…).
const ITEM = { faqs: "FAQ", steps: "Step", items: "Item", cards: "Card", links: "Link", rooms: "Room", popular: "Service", whyChoose: "Point", benefits: "Benefit" };
const itemLabel = (k) => ITEM[k] || label(k);
const isLongText = (v) => typeof v === "string" && v.length > 0;
const label = (k) => (LABELS[k] ? LABELS[k][0] : k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()));
const help = (k) => (LABELS[k] ? LABELS[k][1] : "");

// An empty item shaped like the first one, for "Add".
function blankLike(v) {
  if (typeof v === "string") return "";
  if (typeof v === "number") return 0;
  if (typeof v === "boolean") return false;
  if (Array.isArray(v)) return [];
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blankLike(x)]));
  return "";
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15";

function TextBox({ value, onChange, long, fieldKey, path }) {
  const tag = { "data-cms-path": path };
  if (fieldKey === "slug") {
    return (
      <select {...tag} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {SERVICE_PAGES.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
      </select>
    );
  }
  if (fieldKey === "to") {
    return (
      <select {...tag} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {[...SERVICE_PAGES.map((p) => [servicePagePath(p.slug), p.name]), ["/commercial-cleaning", "Commercial Cleaning"], ["/get-a-quote", "Get a quote"], ["/booking", "Booking"]].map(([v, n]) => (
          <option key={v} value={v}>{n} ({v})</option>
        ))}
        {!value?.startsWith("/service/") && !["/commercial-cleaning", "/get-a-quote", "/booking"].includes(value) && <option value={value}>{value}</option>}
      </select>
    );
  }
  const isLong = long || (value || "").length > 90;
  const linkHint = isLongText(value) && /\[[^\]]+\]\([^)]+\)/.test(value) ? <span className="block text-[11px] text-slate-400">Links are written as [link text](/page-address).</span> : null;
  const count = fieldKey === "meta" ? <span className={`text-[11px] font-semibold ${value.length > 158 ? "text-rose-500" : "text-slate-400"}`}>{value.length} characters</span> : null;
  return (
    <div>
      {isLong ? (
        <textarea {...tag} value={value} onChange={(e) => onChange(e.target.value)} rows={Math.min(10, Math.max(2, Math.ceil((value || "").length / 90)))} className={`${inputCls} leading-relaxed`} />
      ) : (
        <input {...tag} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      )}
      {count}
      {linkHint}
    </div>
  );
}

function ListControls({ i, n, onMove, onRemove }) {
  return (
    <div className="flex gap-1 shrink-0">
      <button type="button" disabled={i === 0} onClick={() => onMove(i, -1)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30" aria-label="Move up"><ArrowUp size={14} /></button>
      <button type="button" disabled={i === n - 1} onClick={() => onMove(i, 1)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30" aria-label="Move down"><ArrowDown size={14} /></button>
      <button type="button" onClick={() => onRemove(i)} className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50" aria-label="Remove"><Trash2 size={14} /></button>
    </div>
  );
}

/** Edits `value` (any text/list/group) and calls onChange with the new value. */
export default function FieldEditor({ value, onChange, fieldKey = "", depth = 0, template, path = "" }) {
  const at = (k) => (path ? `${path}.${k}` : String(k));
  if (typeof value === "string" || value == null) {
    return <TextBox value={value ?? ""} onChange={onChange} long={LONG.has(fieldKey)} fieldKey={fieldKey} path={path} />;
  }
  if (typeof value === "number") {
    return <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className={inputCls} />;
  }
  if (typeof value === "boolean") {
    return <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />;
  }
  if (Array.isArray(value)) {
    const move = (i, d) => { const a = [...value]; [a[i], a[i + d]] = [a[i + d], a[i]]; onChange(a); };
    const remove = (i) => onChange(value.filter((_, j) => j !== i));
    const sample = value[0] ?? template ?? "";
    const isText = typeof sample === "string";
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className={isText ? "flex gap-2 items-start" : "rounded-xl border border-slate-200 bg-slate-50/60 p-3"}>
            {isText ? (
              <>
                <div className="flex-1"><FieldEditor value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} fieldKey={fieldKey} depth={depth + 1} path={at(i)} /></div>
                <ListControls i={i} n={value.length} onMove={move} onRemove={remove} />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{itemLabel(fieldKey)} {i + 1}</span>
                  <ListControls i={i} n={value.length} onMove={move} onRemove={remove} />
                </div>
                <FieldEditor value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} fieldKey={fieldKey} depth={depth + 1} path={at(i)} />
              </>
            )}
          </div>
        ))}
        <button type="button" onClick={() => onChange([...value, blankLike(sample)])} className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-600 px-2 py-1 rounded-md hover:bg-emerald-50">
          <Plus size={13} /> Add {isText ? "line" : "item"}
        </button>
      </div>
    );
  }
  // group of fields
  return (
    <div className={depth === 0 ? "space-y-6" : "space-y-3"}>
      {Object.entries(value).map(([k, v]) => {
        const groupHeader = depth === 0;
        const field = <FieldEditor value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} fieldKey={k} depth={depth + 1} path={at(k)} />;
        if (groupHeader) {
          return (
            <section key={k} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-black text-slate-900">{label(k)}</h3>
              {help(k) && <p className="text-xs text-slate-500 mt-0.5">{help(k)}</p>}
              <div className="mt-4">{field}</div>
            </section>
          );
        }
        return (
          <div key={k}>
            <p className="text-xs font-bold text-slate-600 mb-1">{label(k)}</p>
            {help(k) && <p className="text-[11px] text-slate-400 -mt-0.5 mb-1">{help(k)}</p>}
            {field}
          </div>
        );
      })}
    </div>
  );
}
