// Overview, Calendar and Posts pages of the social media dashboard.
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, PenSquare, Bot, ExternalLink, RotateCcw, Trash2, Pencil, Send, Clock, CheckCircle2, AlertTriangle, Sparkles, Link2, ImageIcon } from "lucide-react";
import { api, photoUrl } from "./api";
import { NETWORKS, NETWORK_ORDER, NetworkMark, AccountAvatar, Button, Card, CardHeader, StatusBadge, Empty, Modal, fmtDate } from "./ui";
import { Preview } from "./Composer";

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const postDate = (p) => new Date(p.postedAt || p.scheduledAt || p.createdAt);
const netsOf = (post, accounts) => [...new Set((post.accounts || []).map((id) => accounts.find((a) => a._id === String(id))?.network).filter(Boolean))].sort((a, b) => NETWORK_ORDER.indexOf(a) - NETWORK_ORDER.indexOf(b));

function PostThumb({ post, size = 44 }) {
  return post.images?.length ? (
    <img src={photoUrl(post.images[0])} alt="" className="rounded-lg object-cover shrink-0 ring-1 ring-slate-200" style={{ width: size, height: size }} />
  ) : (
    <span className="rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0" style={{ width: size, height: size }}><ImageIcon size={size * 0.4} /></span>
  );
}

/** One post in a list: photo, text, networks, status and when. */
export function PostRow({ post, accounts, onOpen }) {
  const nets = netsOf(post, accounts);
  return (
    <button type="button" onClick={() => onOpen(post)} className="w-full flex items-center gap-3.5 px-5 py-3.5 text-left hover:bg-slate-50/80 transition">
      <PostThumb post={post} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-900 truncate">{post.text || post.variants?.facebook || post.variants?.x || "(no text)"}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="flex gap-1">{nets.map((n) => <NetworkMark key={n} network={n} size={15} />)}</span>
          {post.source === "autopilot" && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded-md"><Bot size={11} /> Autopilot</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <StatusBadge status={post.status} />
        <p className="text-xs text-slate-400 mt-1 tabular-nums">{fmtDate(postDate(post))}</p>
      </div>
    </button>
  );
}

/** The post's details: preview per network, what happened on each account, and actions. */
export function PostDetail({ post, accounts, onClose, onEdit, onChanged, notify }) {
  const [busy, setBusy] = useState("");
  const nets = post ? netsOf(post, accounts) : [];
  const [net, setNet] = useState(null);
  if (!post) return null;
  const show = net && nets.includes(net) ? net : nets[0] || "facebook";
  const text = (post.variants?.[show]?.trim() ? post.variants[show] : post.text) + (post.credit ? `\n\n${post.credit}` : "");
  const act = async (what) => {
    setBusy(what);
    try {
      if (what === "retry") {
        const p = await api(`/posts/${post._id}/retry`, { method: "POST" });
        notify(p.status === "posted" ? "Posted everywhere now." : "Some accounts still didn't work — see below.", p.status === "posted" ? "ok" : "error");
        onChanged(p);
      } else if (what === "delete") {
        if (!window.confirm(post.status === "scheduled" ? "Delete this scheduled post? It won't go out." : "Remove this post from the dashboard? Anything already posted stays on the networks.")) return;
        await api(`/posts/${post._id}`, { method: "DELETE" });
        notify("Post deleted.");
        onChanged(null);
      } else if (what === "now") {
        const p = await api(`/posts/${post._id}`, { method: "PATCH", body: { action: "now" } });
        notify(p.status === "posted" ? "Posted." : "Posted with problems — see below.", p.status === "posted" ? "ok" : "error");
        onChanged(p);
      }
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy("");
    }
  };
  const editable = ["draft", "scheduled", "failed"].includes(post.status) && !(post.results || []).some((r) => r.status === "posted");
  return (
    <Modal open onClose={onClose} title="Post" wide>
      <div className="grid md:grid-cols-[minmax(0,1fr)_360px]">
        <div className="p-6 space-y-5 border-b md:border-b-0 md:border-r border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={post.status} />
            <span className="text-sm text-slate-500">{post.status === "scheduled" ? `Goes out ${fmtDate(post.scheduledAt, { weekday: "long" })}` : post.postedAt ? `Posted ${fmtDate(post.postedAt, { weekday: "short" })}` : `Created ${fmtDate(post.createdAt)}`}</span>
            {post.source === "autopilot" && <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md"><Bot size={12} /> {post.createdBy}</span>}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Accounts</p>
            <div className="space-y-2">
              {(post.accounts || []).map((id) => {
                const a = accounts.find((x) => x._id === String(id));
                const r = (post.results || []).find((x) => String(x.account) === String(id));
                return (
                  <div key={id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                    {a ? <AccountAvatar account={a} size={30} /> : <span className="w-[30px] h-[30px] rounded-full bg-slate-100" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{a?.name || r?.name || "Removed account"}</p>
                      {r?.status === "failed" && <p className="text-xs text-rose-600 mt-0.5">{r.error}</p>}
                    </div>
                    {r?.status === "posted" ? (
                      r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"><CheckCircle2 size={14} /> View <ExternalLink size={12} /></a> : <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={14} /> Posted</span>
                    ) : r?.status === "failed" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600"><AlertTriangle size={14} /> Failed</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400"><Clock size={13} /> Waiting</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {editable && <Button variant="secondary" onClick={() => onEdit(post)}><Pencil size={15} /> Edit</Button>}
            {["draft", "scheduled"].includes(post.status) && <Button onClick={() => act("now")} disabled={!!busy}><Send size={15} /> {busy === "now" ? "Posting…" : "Post now"}</Button>}
            {["failed", "partial"].includes(post.status) && <Button onClick={() => act("retry")} disabled={!!busy}><RotateCcw size={15} /> {busy === "retry" ? "Trying…" : "Try again where it failed"}</Button>}
            <Button variant="danger" onClick={() => act("delete")} disabled={!!busy} className="ml-auto"><Trash2 size={15} /> Delete</Button>
          </div>
        </div>
        <div className="p-6 bg-slate-50/70 rounded-br-2xl">
          <div className="flex gap-1 bg-slate-200/60 rounded-lg p-1 mb-4 w-fit">
            {nets.map((n) => <button key={n} type="button" onClick={() => setNet(n)} className={`w-8 h-7 rounded-md flex items-center justify-center ${show === n ? "bg-white shadow-sm" : "opacity-50 hover:opacity-100"}`} aria-label={NETWORKS[n].label}><NetworkMark network={n} size={15} /></button>)}
          </div>
          <Preview network={show} account={accounts.find((a) => a.network === show && (post.accounts || []).map(String).includes(a._id))} text={text} images={post.images || []} />
        </div>
      </div>
    </Modal>
  );
}

/* ── Overview ─────────────────────────────────────────────────────────── */
export function Overview({ me, posts, accounts, autopilots, go, onOpen, status }) {
  const now = new Date();
  const upcoming = posts.filter((p) => p.status === "scheduled").sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const weekAgo = new Date(now.getTime() - 7 * 864e5);
  const postedWeek = posts.filter((p) => ["posted", "partial"].includes(p.status) && new Date(p.postedAt) > weekAgo).length;
  const failed = posts.filter((p) => ["failed", "partial"].includes(p.status));
  const recent = posts.filter((p) => ["posted", "partial", "failed"].includes(p.status)).slice(0, 6);
  const activeAuto = autopilots.filter((a) => a.enabled);
  const nextAuto = activeAuto.map((a) => a.nextRunAt).filter(Boolean).sort()[0];
  const hour = now.getHours();
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const stats = [
    { label: "Scheduled", value: upcoming.length, icon: CalendarDays, tone: "text-sky-600 bg-sky-50" },
    { label: "Posted this week", value: postedWeek, icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Connected accounts", value: accounts.length, icon: Link2, tone: "text-primary bg-primary/10" },
    { label: "Autopilots on", value: activeAuto.length, icon: Bot, tone: "text-violet-600 bg-violet-50" },
  ];
  const needsSetup = !accounts.length;
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#04140F] via-[#073B2A] to-primary p-6 sm:p-8 text-white">
        <div className="absolute -right-16 -top-20 w-72 h-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute right-6 bottom-6 hidden md:flex gap-2 opacity-90">{NETWORK_ORDER.map((n) => <span key={n} className="rounded-xl bg-white/10 p-2 backdrop-blur"><NetworkMark network={n} size={22} /></span>)}</div>
        <p className="text-emerald-200/90 text-sm font-medium">{now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">{hello}, {String(me?.name || "").split(" ")[0] || "there"}</h1>
        <p className="text-white/70 mt-2 max-w-lg">{needsSetup ? "Connect your social accounts to start posting." : upcoming.length ? `${upcoming.length} post${upcoming.length === 1 ? " is" : "s are"} lined up.${nextAuto ? ` Next autopilot post ${fmtDate(nextAuto, { weekday: "short" })}.` : ""}` : "Nothing scheduled yet — create a post or switch on an autopilot."}</p>
        <div className="flex flex-wrap gap-2 mt-6">
          {needsSetup ? (
            <Button className="!bg-white !text-slate-900 hover:!bg-emerald-50" size="lg" onClick={() => go("accounts")}><Link2 size={16} /> Connect accounts</Button>
          ) : (
            <>
              <Button className="!bg-white !text-slate-900 hover:!bg-emerald-50" size="lg" onClick={() => go("compose")}><PenSquare size={16} /> Create post</Button>
              <Button className="!bg-white/10 !text-white hover:!bg-white/20 border border-white/15" size="lg" onClick={() => go("autopilot")}><Sparkles size={16} /> Autopilot</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="p-5">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}><Icon size={19} /></span>
            <p className="text-3xl font-bold text-slate-900 mt-4 tabular-nums">{value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {(failed.length > 0 || (status && !status.ai)) && (
        <Card className="p-4 border-amber-200 bg-amber-50/60 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            {failed.length > 0 && <p><b>{failed.length} post{failed.length === 1 ? "" : "s"}</b> didn't go out everywhere. <button type="button" className="underline font-semibold" onClick={() => onOpen(failed[0])}>See why</button></p>}
            {status && !status.ai && <p>Autopilot needs the Claude key (ANTHROPIC_API_KEY) on the server.</p>}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Coming up" subtitle="Scheduled posts" action={<Button variant="ghost" size="sm" onClick={() => go("calendar")}>Calendar</Button>} />
          {upcoming.length ? <div className="divide-y divide-slate-100 pb-2">{upcoming.slice(0, 6).map((p) => <PostRow key={p._id} post={p} accounts={accounts} onOpen={onOpen} />)}</div> : <Empty icon={CalendarDays} title="Nothing scheduled" text="Schedule a post and it'll show here." action={!needsSetup && <Button variant="secondary" onClick={() => go("compose")}><PenSquare size={15} /> Create post</Button>} />}
        </Card>
        <Card>
          <CardHeader title="Recently posted" action={<Button variant="ghost" size="sm" onClick={() => go("posts")}>All posts</Button>} />
          {recent.length ? <div className="divide-y divide-slate-100 pb-2">{recent.map((p) => <PostRow key={p._id} post={p} accounts={accounts} onOpen={onOpen} />)}</div> : <Empty icon={Send} title="No posts yet" text="Posts you publish will show here with links to them." />}
        </Card>
      </div>
    </div>
  );
}

/* ── Calendar ─────────────────────────────────────────────────────────── */
export function Calendar({ posts, accounts, onOpen, onNewAt }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const days = useMemo(() => {
    const start = new Date(month);
    start.setDate(1 - ((start.getDay() + 6) % 7)); // Monday first
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [month]);
  const byDay = (d) => posts.filter((p) => p.status !== "draft" && sameDay(postDate(p), d)).sort((a, b) => postDate(a) - postDate(b));
  const today = new Date();
  const shift = (n) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={16} /></Button>
          <Button variant="secondary" size="sm" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={16} /></Button>
          <h2 className="text-lg font-semibold text-slate-900 ml-2">{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500" /> Scheduled</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Posted</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Failed</span>
          <Button variant="ghost" size="sm" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</Button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-100">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="px-3 py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const list = byDay(d);
          const out = d.getMonth() !== month.getMonth();
          const isToday = sameDay(d, today);
          const past = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          return (
            <div key={i} className={`group min-h-[118px] border-b border-r border-slate-100 p-1.5 ${out ? "bg-slate-50/60" : ""} ${i % 7 === 6 ? "border-r-0" : ""}`}>
              <div className="flex items-center justify-between px-1">
                <span className={`text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center ${isToday ? "bg-primary text-white" : out ? "text-slate-300" : "text-slate-600"}`}>{d.getDate()}</span>
                {!past && <button type="button" onClick={() => onNewAt(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0))} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary text-lg leading-none px-1" aria-label="Schedule a post on this day">+</button>}
              </div>
              <div className="mt-1 space-y-1">
                {list.slice(0, 3).map((p) => {
                  const dot = p.status === "scheduled" ? "bg-sky-500" : ["posted"].includes(p.status) ? "bg-emerald-500" : p.status === "partial" ? "bg-amber-500" : "bg-rose-500";
                  return (
                    <button key={p._id} type="button" onClick={() => onOpen(p)} className="w-full flex items-center gap-1.5 rounded-md bg-white ring-1 ring-slate-200 hover:ring-primary/40 hover:shadow-sm px-1.5 py-1 text-left transition">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                      <span className="text-[10px] font-semibold text-slate-500 tabular-nums">{postDate(p).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="text-[11px] text-slate-700 truncate flex-1">{p.text}</span>
                      <span className="hidden sm:flex gap-0.5">{netsOf(p, accounts).slice(0, 3).map((n) => <NetworkMark key={n} network={n} size={11} />)}</span>
                    </button>
                  );
                })}
                {list.length > 3 && <p className="text-[11px] font-semibold text-slate-400 px-1.5">+{list.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Posts list ───────────────────────────────────────────────────────── */
const FILTERS = [["all", "All"], ["scheduled", "Scheduled"], ["posted", "Posted"], ["draft", "Drafts"], ["failed", "Problems"]];
export function PostsList({ posts, accounts, onOpen, go }) {
  const [f, setF] = useState("all");
  const [net, setNet] = useState("");
  const list = posts.filter((p) => (f === "all" ? true : f === "failed" ? ["failed", "partial"].includes(p.status) : p.status === f)).filter((p) => !net || netsOf(p, accounts).includes(net));
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {FILTERS.map(([k, label]) => {
            const n = k === "all" ? posts.length : posts.filter((p) => (k === "failed" ? ["failed", "partial"].includes(p.status) : p.status === k)).length;
            return <button key={k} type="button" onClick={() => setF(k)} className={`px-3 h-8 rounded-md text-sm font-semibold transition ${f === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{label} <span className="text-slate-400 font-medium">{n}</span></button>;
          })}
        </div>
        <div className="flex gap-1">
          {NETWORK_ORDER.map((n) => <button key={n} type="button" onClick={() => setNet(net === n ? "" : n)} className={`w-9 h-9 rounded-lg flex items-center justify-center border transition ${net === n ? "border-primary bg-primary/5" : "border-transparent opacity-60 hover:opacity-100"}`} aria-label={`Only ${NETWORKS[n].label}`}><NetworkMark network={n} size={17} /></button>)}
        </div>
      </div>
      {list.length ? <div className="divide-y divide-slate-100">{list.map((p) => <PostRow key={p._id} post={p} accounts={accounts} onOpen={onOpen} />)}</div> : <Empty icon={PenSquare} title="No posts here" text="Create a post, or switch on an autopilot to have Claude write them." action={<Button onClick={() => go("compose")}><PenSquare size={15} /> Create post</Button>} />}
    </Card>
  );
}
