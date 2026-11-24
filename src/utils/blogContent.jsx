// Turns a blog post's text into the article on the website.
// Supports what the admin editor (and "Draft with AI") writes:
//   blank line = new paragraph · "## " = subheading · "- " = bullet point
//   [link text](/service/... or https://...) = link · bare https://... addresses become links
//   ![caption](/uploads/blog/...) on its own = a photo (only our uploaded photos or https:// images)
// Only site paths (/...) and http(s) links are allowed, so nothing in a post can run code.
import { Link } from "react-router-dom";

const SITE_HOSTS = ["cleaniqservices.com", "www.cleaniqservices.com"];
const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g;

function safeHref(raw) {
  const href = String(raw || "").trim();
  if (href.startsWith("/") && !href.startsWith("//")) return { internal: href };
  try {
    const u = new URL(href);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (SITE_HOSTS.includes(u.hostname)) return { internal: `${u.pathname}${u.search}${u.hash}` || "/" };
    return { external: u.href };
  } catch {
    return null;
  }
}

const linkClass = "font-bold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary";

function inline(text, keyBase) {
  const out = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const label = m[1] ?? m[3];
    const href = safeHref(m[2] ?? m[3]);
    const key = `${keyBase}-${i++}`;
    if (!href) out.push(m[0]);
    else if (href.internal) out.push(<Link key={key} to={href.internal} className={linkClass}>{label}</Link>);
    else out.push(<a key={key} href={href.external} target="_blank" rel="noopener noreferrer" className={linkClass}>{label}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const UPLOADS_BASE = API.replace(/\/api\/?$/, "");
/** A photo address from a post: our uploads (/uploads/blog/…) or an https:// image. */
// eslint-disable-next-line react-refresh/only-export-components
export function blogPhotoUrl(src) {
  const s = String(src || "").trim();
  if (/^\/uploads\/blog\/[\w.-]+$/.test(s)) return `${UPLOADS_BASE}${s}`;
  if (/^https:\/\/[^\s"'<>]+$/.test(s)) return s;
  return null;
}
const PHOTO = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

// One block of lines → a heading, a bullet list, or a paragraph (a heading can be followed by
// more lines in the same block).
function renderBlock(lines, key) {
  const photo = lines.length === 1 && lines[0].match(PHOTO);
  if (photo && blogPhotoUrl(photo[2])) {
    return (
      <figure key={key} className="my-2">
        <img src={blogPhotoUrl(photo[2])} alt={photo[1]} loading="lazy" className="w-full rounded-2xl border border-slate-200 shadow-sm object-cover" />
        {photo[1] && photo[1] !== "Photo" && <figcaption className="mt-2 text-sm text-slate-500 text-center">{photo[1]}</figcaption>}
      </figure>
    );
  }
  if (lines[0].startsWith("## ")) {
    const heading = <h2 key={`${key}h`} className="text-2xl sm:text-3xl font-black text-primary-dark pt-4">{inline(lines[0].slice(3), `${key}h`)}</h2>;
    return lines.length === 1 ? heading : <div key={key} className="space-y-6">{heading}{renderBlock(lines.slice(1), `${key}r`)}</div>;
  }
  if (lines.every((l) => /^[-•*]\s+/.test(l))) {
    return (
      <ul key={key} className="list-disc pl-6 space-y-2 marker:text-primary">
        {lines.map((l, li) => <li key={li}>{inline(l.replace(/^[-•*]\s+/, ""), `${key}-${li}`)}</li>)}
      </ul>
    );
  }
  return <p key={key} className="whitespace-pre-wrap">{inline(lines.join("\n"), key)}</p>;
}

export function BlogContent({ text }) {
  const blocks = String(text || "").replace(/\r\n/g, "\n").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="text-slate-700 leading-relaxed text-base sm:text-lg space-y-6">
      {blocks.map((block, bi) => renderBlock(block.split("\n").map((l) => l.trim()).filter(Boolean), `b${bi}`))}
    </div>
  );
}
