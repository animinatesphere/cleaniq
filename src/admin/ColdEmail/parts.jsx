export function Pill({ map, value, fallback = "other" }) {
  const m = map[value] || map[fallback];
  if (!m) return null;
  return (
    <span title={m.tip || ""} className={`inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap ${m.cls}`}>
      {m.label}
    </span>
  );
}

// Sent → Delivered → Opened → Clicked → Replied → Interested
export function Funnel({ f }) {
  if (!f) return null;
  const items = [
    { label: "Sent",       value: f.sent,       sub: f.pending ? `${f.pending} waiting` : "",       color: "text-white" },
    { label: "Delivered",  value: f.delivered,  sub: `${f.deliveredRate}%`,                           color: "text-blue-300" },
    { label: "Opened",     value: f.opened,     sub: `${f.openRate}%`,                                color: "text-cyan-300" },
    { label: "Clicked",    value: f.clicked,    sub: `${f.clickRate}%`,                               color: "text-indigo-300" },
    { label: "Replied",    value: f.replied,    sub: `${f.replyRate}%`,                               color: "text-emerald-300" },
    { label: "Interested", value: f.interested, sub: "",                                              color: "text-lime-300" },
    { label: "Bounced",    value: f.bounced,    sub: `${f.bounceRate}%`,                              color: f.bounceRate > 3 ? "text-rose-300" : "text-orange-300" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
      {items.map((it) => (
        <div key={it.label} className="bg-[#0B2D22] border border-white/[0.06] rounded-xl px-3.5 py-3">
          <p className={`font-black text-2xl leading-none ${it.color}`}>{(it.value || 0).toLocaleString()}</p>
          <p className="text-white/40 text-[11px] mt-1 flex items-center justify-between gap-1">
            <span>{it.label}</span>
            {it.sub && <span className={`font-bold ${it.color} opacity-80`}>{it.sub}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}

export function FunnelNote({ f }) {
  if (!f) return null;
  const notes = [];
  if (f.bounceRate > 3) notes.push(`Bounces are ${f.bounceRate}% — above 3% hurts your mailbox. Use "Check emails" in Contacts before sending.`);
  if (f.sent >= 30 && f.openRate === 0) notes.push("No opens yet — make sure open tracking is on for this campaign.");
  return (
    <p className="text-white/30 text-[11px] leading-relaxed">
      Opens are an estimate: Apple Mail and some company spam filters open emails automatically, so we ignore opens in the first minute and known scanners. Replies, bounces and clicks are exact.
      {notes.map((n) => <span key={n} className="block text-amber-300/80 mt-1">⚠ {n}</span>)}
    </p>
  );
}

const SERIES = [
  { key: "sent",    label: "Sent",    color: "#94a3b8" },
  { key: "opened",  label: "Opened",  color: "#22d3ee" },
  { key: "clicked", label: "Clicked", color: "#818cf8" },
  { key: "replied", label: "Replied", color: "#34d399" },
  { key: "bounced", label: "Bounced", color: "#fb923c" },
];

// Last 30 days, grouped bars per day.
export function DailyChart({ days }) {
  if (!days?.length) return null;
  const max = Math.max(1, ...days.flatMap((d) => SERIES.map((s) => d[s.key] || 0)));
  const any = days.some((d) => SERIES.some((s) => d[s.key]));
  return (
    <div className="bg-[#0B2D22] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Last 30 days</p>
        <div className="flex gap-3 flex-wrap">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-white/50">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />{s.label}
            </span>
          ))}
        </div>
      </div>
      {!any ? (
        <p className="text-white/30 text-sm py-10 text-center">Nothing sent in the last 30 days yet.</p>
      ) : (
        <div className="flex items-end gap-[3px] h-40">
          {days.map((d) => (
            <div key={d.date} className="flex-1 h-full flex items-end gap-px group relative" title={`${new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}\n${SERIES.map((s) => `${s.label}: ${d[s.key] || 0}`).join("\n")}`}>
              {SERIES.map((s) => (
                <div key={s.key} className="flex-1 rounded-t-sm min-h-0" style={{ height: `${((d[s.key] || 0) / max) * 100}%`, background: s.color, opacity: 0.85 }} />
              ))}
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-between text-[10px] text-white/25 mt-1.5">
        <span>{new Date(days[0].date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

// Rows of { name, sent, delivered, openRate, clickRate, replyRate, bounceRate }
export function RateTable({ title, rows, nameKey = "name", onRow }) {
  if (!rows?.length) return null;
  return (
    <div className="bg-[#0B2D22] border border-white/[0.06] rounded-2xl overflow-hidden">
      <p className="text-white/60 text-xs font-bold uppercase tracking-wider px-4 pt-4 pb-2">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-white/30 uppercase tracking-wider text-left">
              <th className="px-4 py-2 font-bold">Name</th>
              <th className="px-2 py-2 font-bold text-right">Sent</th>
              <th className="px-2 py-2 font-bold text-right">Delivered</th>
              <th className="px-2 py-2 font-bold text-right">Opened</th>
              <th className="px-2 py-2 font-bold text-right">Clicked</th>
              <th className="px-2 py-2 font-bold text-right">Replied</th>
              <th className="px-4 py-2 font-bold text-right">Bounced</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} onClick={onRow ? () => onRow(r) : undefined} className={`border-t border-white/[0.04] ${onRow ? "cursor-pointer hover:bg-white/[0.03]" : ""}`}>
                <td className="px-4 py-2.5 text-white/80 max-w-[260px] truncate">{r[nameKey]}</td>
                <td className="px-2 py-2.5 text-right text-white/60">{r.sent}</td>
                <td className="px-2 py-2.5 text-right text-blue-300">{r.delivered}</td>
                <td className="px-2 py-2.5 text-right text-cyan-300">{r.opened} <span className="text-white/30 text-xs">{r.openRate}%</span></td>
                <td className="px-2 py-2.5 text-right text-indigo-300">{r.clicked} <span className="text-white/30 text-xs">{r.clickRate}%</span></td>
                <td className="px-2 py-2.5 text-right text-emerald-300">{r.replied} <span className="text-white/30 text-xs">{r.replyRate}%</span></td>
                <td className={`px-4 py-2.5 text-right ${r.bounceRate > 3 ? "text-rose-300" : "text-orange-300"}`}>{r.bounced} <span className="text-white/30 text-xs">{r.bounceRate ?? ""}{r.bounceRate !== undefined ? "%" : ""}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Spinner({ small }) {
  return <div className={`${small ? "w-4 h-4" : "w-7 h-7"} border-2 border-emerald-500 border-t-transparent rounded-full animate-spin`} />;
}
