/* eslint-disable react-refresh/only-export-components -- small shared helpers live with the components */
// Shared look for the social media dashboard: network marks and colours, buttons, cards, badges.
import { useEffect, useId } from "react";
import { X as Close } from "lucide-react";

export const NETWORKS = {
  facebook: { label: "Facebook", color: "#1877F2", soft: "bg-[#1877F2]/10 text-[#1877F2]" },
  instagram: { label: "Instagram", color: "#E1306C", soft: "bg-[#E1306C]/10 text-[#C13584]" },
  linkedin: { label: "LinkedIn", color: "#0A66C2", soft: "bg-[#0A66C2]/10 text-[#0A66C2]" },
  x: { label: "X", color: "#0F1419", soft: "bg-slate-900/10 text-slate-900" },
  google: { label: "Google Business", color: "#1A73E8", soft: "bg-[#1A73E8]/10 text-[#1A73E8]" },
  threads: { label: "Threads", color: "#000000", soft: "bg-slate-900/10 text-slate-900" },
  tiktok: { label: "TikTok", color: "#000000", soft: "bg-slate-900/10 text-slate-900" },
  pinterest: { label: "Pinterest", color: "#E60023", soft: "bg-[#E60023]/10 text-[#E60023]" },
  youtube: { label: "YouTube", color: "#FF0000", soft: "bg-[#FF0000]/10 text-[#CC0000]" },
};
// Pinterest was removed from the dashboard (2026-11-28); its server code is kept, add "pinterest" back here to show it again.
export const NETWORK_ORDER = ["facebook", "instagram", "linkedin", "x", "google", "threads", "tiktok", "youtube"];
/** Networks that only take videos. */
export const VIDEO_ONLY = ["youtube"];
/** Networks that can't post without a photo. */
export const PHOTO_ONLY = ["instagram", "tiktok", "pinterest"];

/** Each network's mark, drawn simply (not the official logo files). */
export function NetworkMark({ network, size = 16, className = "" }) {
  const s = { width: size, height: size };
  // Each icon needs its own gradient name: a shared one breaks when the first icon is hidden.
  const gid = `ig-${useId().replace(/:/g, "")}`;
  if (network === "facebook")
    return (
      <svg viewBox="0 0 24 24" style={s} className={className} aria-label="Facebook" role="img">
        <circle cx="12" cy="12" r="12" fill="#1877F2" />
        <path fill="#fff" d="M13.4 19.5v-6.1h2.1l.3-2.4h-2.4V9.5c0-.7.2-1.2 1.2-1.2h1.3V6.2c-.2 0-1-.1-1.9-.1-1.9 0-3.1 1.1-3.1 3.2V11H8.8v2.4h2.1v6.1h2.5z" />
      </svg>
    );
  if (network === "instagram")
    return (
      <svg viewBox="0 0 24 24" style={s} className={className} aria-label="Instagram" role="img">
        <defs>
          <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#FEDA75" />
            <stop offset=".35" stopColor="#FA7E1E" />
            <stop offset=".6" stopColor="#D62976" />
            <stop offset="1" stopColor="#4F5BD5" />
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="6.5" fill={`url(#${gid})`} />
        <rect x="6" y="6" width="12" height="12" rx="3.6" fill="none" stroke="#fff" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="2.9" fill="none" stroke="#fff" strokeWidth="1.7" />
        <circle cx="16.2" cy="7.8" r="1" fill="#fff" />
      </svg>
    );
  if (network === "linkedin")
    return (
      <svg viewBox="0 0 24 24" style={s} className={className} aria-label="LinkedIn" role="img">
        <rect width="24" height="24" rx="5" fill="#0A66C2" />
        <path fill="#fff" d="M7.2 9.6h2.4v7.7H7.2zM8.4 5.8a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8zM11.1 9.6h2.3v1.1c.3-.6 1.1-1.3 2.3-1.3 2.4 0 2.9 1.6 2.9 3.7v4.2h-2.4v-3.7c0-.9 0-2-1.2-2s-1.5 1-1.5 2v3.8h-2.4z" />
      </svg>
    );
  if (network === "google")
    return (
      <svg viewBox="0 0 24 24" style={s} className={className} aria-label="Google Business Profile" role="img">
        <rect width="24" height="24" rx="5" fill="#1A73E8" />
        <path fill="#fff" d="M5.5 9.2 6.8 6h10.4l1.3 3.2c0 1.2-.9 2-2 2-.8 0-1.4-.4-1.8-1-.3.6-1 1-1.7 1s-1.4-.4-1.7-1c-.4.6-1 1-1.8 1-.8 0-1.4-.4-1.8-1-.3.6-1 1-1.7 1-1 0-2-.8-2-2z" />
        <path fill="#fff" d="M7 12.3c.3.1.6.1.9.1v5.6h8.2v-5.6c.3 0 .6 0 .9-.1V19H7z" />
        <path fill="#FBBC04" d="M12 13.4a2 2 0 0 1 2 2h-.9a1.1 1.1 0 1 0-.3.8h-.9v-.8H14v.2a2 2 0 1 1-2-2.2z" />
      </svg>
    );
  if (network === "threads")
    return (
      <svg viewBox="0 0 24 24" style={s} className={className} aria-label="Threads" role="img">
        <rect width="24" height="24" rx="5" fill="#000" />
        <path fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" d="M15.6 11.2c-.3-2-1.6-3-3.6-3-2.3 0-3.7 1.6-3.7 3.9s1.4 3.9 3.7 3.9c1.8 0 3-.9 3.3-2.3.3-1.6-.8-2.7-2.7-2.7-1.4 0-2.2.7-2.2 1.6 0 .9.8 1.5 1.8 1.4 1.6-.1 2.2-1.4 2.2-3.2 0-.2 0 3.4 2.1 3.4 1.3 0 1.9-1.3 1.9-3 0-3.2-2.4-5.6-5.5-5.6-3.4 0-5.6 2.4-5.6 6s2.2 6 5.6 6c1.4 0 2.5-.3 3.4-.9" />
      </svg>
    );
  if (network === "tiktok")
    return (
      <svg viewBox="0 0 24 24" style={s} className={className} aria-label="TikTok" role="img">
        <rect width="24" height="24" rx="5" fill="#000" />
        <path fill="#25F4EE" transform="translate(-.6 -.5)" d="M10.3 10.6v-.8a5.2 5.2 0 1 0 3.6 5V9.9a6.5 6.5 0 0 0 3.8 1.2V8.4a3.8 3.8 0 0 1-3-3.2h-2.6v10.3a2.4 2.4 0 1 1-1.8-2.3z" />
        <path fill="#FE2C55" transform="translate(.6 .5)" d="M10.3 10.6v-.8a5.2 5.2 0 1 0 3.6 5V9.9a6.5 6.5 0 0 0 3.8 1.2V8.4a3.8 3.8 0 0 1-3-3.2h-2.6v10.3a2.4 2.4 0 1 1-1.8-2.3z" />
        <path fill="#fff" d="M10.3 10.6v-.8a5.2 5.2 0 1 0 3.6 5V9.9a6.5 6.5 0 0 0 3.8 1.2V8.4a3.8 3.8 0 0 1-3-3.2h-2.6v10.3a2.4 2.4 0 1 1-1.8-2.3z" />
      </svg>
    );
  if (network === "youtube")
    return (
      <svg viewBox="0 0 24 24" style={s} className={className} aria-label="YouTube" role="img">
        <rect width="24" height="24" rx="5" fill="#FF0000" />
        <path fill="#fff" d="M10 8.6v6.8l5.8-3.4z" />
      </svg>
    );
  if (network === "pinterest")
    return (
      <svg viewBox="0 0 24 24" style={s} className={className} aria-label="Pinterest" role="img">
        <circle cx="12" cy="12" r="12" fill="#E60023" />
        <path fill="#fff" d="M12.3 5C8.4 5 6.3 7.6 6.3 10.4c0 1.3.7 2.9 1.8 3.4.2.1.3 0 .3-.1l.3-1.1c0-.1 0-.2-.1-.3-.4-.5-.7-1.3-.7-2.1 0-2 1.5-4 4.2-4 2.3 0 3.9 1.6 3.9 3.8 0 2.5-1.3 4.3-2.9 4.3-.9 0-1.6-.8-1.4-1.7.3-1.1.8-2.3.8-3.1 0-.7-.4-1.3-1.2-1.3-.9 0-1.7 1-1.7 2.3 0 .8.3 1.4.3 1.4l-1.1 4.6c-.3 1.3 0 3.2.1 3.4 0 .1.1.1.2 0 .1-.2 1.3-1.8 1.6-3l.6-2.3c.3.6 1.2 1.1 2.2 1.1 2.9 0 4.9-2.6 4.9-6.1C18.2 7.4 15.8 5 12.3 5z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" style={s} className={className} aria-label="X" role="img">
      <rect width="24" height="24" rx="5" fill="#0F1419" />
      <path fill="#fff" d="M15.9 6h1.9l-4.1 4.7L18.5 18h-3.8l-3-3.9L8.3 18H6.4l4.4-5L6.2 6h3.9l2.7 3.6zm-.7 10.8h1L9.6 7.1H8.5z" />
    </svg>
  );
}

/** An account's picture (or its initial) with its network mark in the corner. */
export function AccountAvatar({ account, size = 36 }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {account.picture ? (
        <img src={account.picture} alt="" className="w-full h-full rounded-full object-cover ring-1 ring-slate-200" />
      ) : (
        <span className="w-full h-full rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center ring-1 ring-slate-200" style={{ fontSize: size * 0.4 }}>
          {(account.name || "?").charAt(0).toUpperCase()}
        </span>
      )}
      <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-[1.5px]">
        <NetworkMark network={account.network} size={Math.round(size * 0.42)} />
      </span>
    </span>
  );
}

const BTN = {
  primary: "bg-primary text-white hover:bg-primary-dark shadow-sm shadow-primary/20",
  secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-white text-rose-600 border border-rose-200 hover:bg-rose-50",
  dark: "bg-slate-900 text-white hover:bg-slate-800",
};
export function Button({ variant = "primary", size = "md", className = "", children, ...rest }) {
  const sz = size === "sm" ? "h-8 px-3 text-xs" : size === "lg" ? "h-11 px-5 text-sm" : "h-9 px-4 text-sm";
  return (
    <button type="button" className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none ${sz} ${BTN[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Card({ className = "", children, ...rest }) {
  return <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`} {...rest}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const STATUS = {
  draft: ["Draft", "bg-slate-100 text-slate-600"],
  scheduled: ["Scheduled", "bg-sky-50 text-sky-700 ring-1 ring-sky-200"],
  posting: ["Posting…", "bg-amber-50 text-amber-700 ring-1 ring-amber-200"],
  posted: ["Posted", "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"],
  partial: ["Partly posted", "bg-amber-50 text-amber-700 ring-1 ring-amber-200"],
  failed: ["Failed", "bg-rose-50 text-rose-700 ring-1 ring-rose-200"],
};
export function StatusBadge({ status }) {
  const [label, cls] = STATUS[status] || STATUS.draft;
  return <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}><span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />{label}</span>;
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-14">
      {Icon && <span className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4"><Icon size={22} /></span>}
      <p className="font-semibold text-slate-900">{title}</p>
      {text && <p className="text-sm text-slate-500 mt-1 max-w-sm">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`w-full ${wide ? "max-w-5xl" : "max-w-lg"} bg-white rounded-2xl shadow-2xl my-8`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><Close size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition";
export const labelCls = "block text-xs font-semibold text-slate-600 mb-1.5";

export const fmtDate = (d, opts = {}) => (d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", ...opts }) : "");
export const toLocalInput = (d) => {
  const x = new Date(d);
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
};
