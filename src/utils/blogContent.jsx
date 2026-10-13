// Turns a blog post's text into the article on the website.
// Supports what the admin editor (and "Draft with AI") writes:
//   blank line = new paragraph · "## " = subheading · "- " = bullet point
//   [link text](/service/... or https://...) = link · bare https://... addresses become links
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

// One block of lines → a heading, a bullet list, or a paragraph (a heading can be followed by
// more lines in the same block).
function renderBlock(lines, key) {
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
