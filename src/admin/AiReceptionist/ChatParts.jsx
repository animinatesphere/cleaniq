import { UserRound, Bot, Wrench, XCircle } from "lucide-react";
import { timeLabel } from "./format";

// Tool actions the AI took for a reply ("Booking BK-1234 created · £194.90").
export function ToolChips({ tools }) {
  if (!tools?.length) return null;
  return (
    <div className="mt-2 flex flex-col gap-1">
      {tools.map((t, i) => (
        <div
          key={i}
          className={`flex items-start gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-md border ${
            t.ok ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-rose-500/10 text-rose-300 border-rose-500/20"
          }`}
        >
          {t.ok ? <Wrench size={11} className="mt-0.5 shrink-0" /> : <XCircle size={11} className="mt-0.5 shrink-0" />}
          <span>{t.detail}</span>
        </div>
      ))}
    </div>
  );
}

export function Bubble({ role, text, at, tools, footer }) {
  const mine = role !== "customer";
  const who = role === "customer" ? "Customer" : role === "staff" ? "Staff" : "AI";
  const colour =
    role === "customer"
      ? "bg-white/[0.06] text-white/90 border-white/10"
      : role === "staff"
        ? "bg-sky-500/15 text-white border-sky-500/25"
        : "bg-emerald-500/15 text-white border-emerald-500/25";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl border px-4 py-2.5 ${colour}`}>
        <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase tracking-wider text-white/40">
          {role === "customer" ? <UserRound size={11} /> : role === "staff" ? <UserRound size={11} /> : <Bot size={11} />}
          {who}
          <span className="font-semibold normal-case tracking-normal">{timeLabel(at)}</span>
        </div>
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{text}</p>
        <ToolChips tools={tools} />
        {footer}
      </div>
    </div>
  );
}
