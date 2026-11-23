// A link or button that goes to a site page (client-side), a phone number, email or another website.
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { linkTarget } from "./blockUtils";

export default function BlockLink({ href, className, children, ...rest }) {
  const t = linkTarget(href);
  if (t.internal) return <Link to={t.href} className={className} {...rest}>{children}</Link>;
  const external = /^https?:\/\//.test(t.href);
  return (
    <a href={t.href} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
      {children}
    </a>
  );
}

// Button styles editors can choose from (same as the site's buttons).
const STYLES = {
  primary: "btn-primary py-4 px-8 group",
  outline: "btn-outline py-4 px-8 group font-black uppercase tracking-widest text-sm",
  secondary: "btn-secondary py-4 px-8 group",
  dark: "inline-flex items-center justify-center gap-2 font-bold text-white bg-primary hover:bg-primary-dark px-8 py-4 rounded-full transition-colors shadow-lg shadow-primary/30",
  text: "inline-flex items-center gap-2 font-black text-primary hover:gap-4 transition-all",
};

/** One button from a block's "buttons" list: { label, link, style, arrow }. */
export function BlockButton({ button, size = "", className = "" }) {
  if (!button?.label) return null;
  return (
    <BlockLink href={button.link} className={`${STYLES[button.style] || STYLES.primary} ${size} ${className}`}>
      {button.label}
      {button.arrow !== "no" && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
    </BlockLink>
  );
}

/** Text with [link text](/page) links, as used across the site's content. */
export function RichText({ text, linkClass = "font-bold text-primary hover:underline" }) {
  if (typeof text !== "string") return text ?? null;
  const out = [];
  let last = 0;
  for (const m of text.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    out.push(text.slice(last, m.index));
    out.push(<BlockLink key={m.index} href={m[2]} className={linkClass}>{m[1]}</BlockLink>);
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}
