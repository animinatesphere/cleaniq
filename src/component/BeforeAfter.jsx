import { useState } from "react";
import { MoveHorizontal } from "lucide-react";
import { beforeAfterFor } from "../utils/beforeAfter";

// Pair taken from different angles: before and after next to each other.
function SideBySide({ pair }) {
  return (
    <figure className="rounded-[28px] overflow-hidden bg-white border border-slate-100 shadow-sm">
      <div className="grid grid-cols-2 gap-0.5 bg-white">
        {[["before", "Before", "bg-black/60"], ["after", "After", "bg-primary"]].map(([k, text, tone]) => (
          <div key={k} className="relative aspect-[2/3] overflow-hidden bg-slate-100">
            <img src={pair[k]} alt={`${pair.label}: ${k} our clean`} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest ${tone}`}>{text}</span>
          </div>
        ))}
      </div>
      <figcaption className="px-5 py-4 text-sm font-bold text-primary-dark">{pair.label}</figcaption>
    </figure>
  );
}

// One photo pair: drag (or use the arrow keys on) the handle to compare.
function Compare({ pair }) {
  const [pos, setPos] = useState(50);
  return (
    <figure className="rounded-[28px] overflow-hidden bg-white border border-slate-100 shadow-sm">
      <div className="relative aspect-4/3 select-none overflow-hidden bg-slate-100">
        <img src={pair.after} alt={`${pair.label}: after our clean`} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <img src={pair.before} alt={`${pair.label}: before our clean`} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-black uppercase tracking-widest">Before</span>
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest">After</span>
        <div className="absolute inset-y-0 w-0.5 bg-white shadow pointer-events-none" style={{ left: `${pos}%` }}>
          <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-primary">
            <MoveHorizontal size={18} />
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`Compare before and after: ${pair.label}`}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
        />
      </div>
      <figcaption className="px-5 py-4 text-sm font-bold text-primary-dark">{pair.label}</figcaption>
    </figure>
  );
}

/**
 * Before & after section. With `slug` it shows only that service's photos; without, a mix from
 * every service. Renders nothing until photos are added.
 */
export default function BeforeAfter({ slug, title = "Before & after", limit = 6, className = "" }) {
  const pairs = beforeAfterFor(slug).slice(0, limit);
  if (!pairs.length) return null;
  return (
    <section className={className}>
      <h2 className="text-2xl md:text-4xl font-black text-primary-dark tracking-tight mb-2">{title}</h2>
      <p className="text-slate-500 font-medium mb-8">Real photos from our jobs. Drag the slider to compare.</p>
      <div className={`grid gap-6 ${pairs.length > 1 ? "md:grid-cols-2" : ""} ${pairs.length > 2 ? "lg:grid-cols-3" : ""}`}>
        {pairs.map((p) => (
          p.side ? <SideBySide key={`${p.service}-${p.n}`} pair={p} /> : <Compare key={`${p.service}-${p.n}`} pair={p} />
        ))}
      </div>
    </section>
  );
}
