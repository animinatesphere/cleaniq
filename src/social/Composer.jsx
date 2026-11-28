// Create or edit a post: choose accounts, write once (or per network), add photos, preview it as
// each network shows it, then post now, schedule or save as a draft.
import { useEffect, useMemo, useState } from "react";
import { Film, ImagePlus, Send, CalendarClock, Save, AlertTriangle, ArrowLeft, ArrowRight, Trash2, Heart, MessageCircle, Repeat2, Share2, Bookmark, ThumbsUp, Globe2, MoreHorizontal, Upload, Check } from "lucide-react";
import { api, photoUrl, uploadFiles } from "./api";
import { NETWORKS, NETWORK_ORDER, PHOTO_ONLY, VIDEO_ONLY, NetworkMark, AccountAvatar, Button, Card, Modal, inputCls, labelCls, toLocalInput } from "./ui";

const LIMITS = { facebook: 63206, instagram: 2200, linkedin: 3000, x: 280, threads: 500, google: 1500, tiktok: 2200, pinterest: 800, youtube: 4900 };
const vidEl = (video, cls) => <video src={photoUrl(video)} className={cls} muted playsInline controls preload="metadata" />;

const TIPS = {
  x: " X allows 280 characters.",
  instagram: " Put hashtags at the end.",
  threads: " Threads allows 500 characters.",
  google: " Keep it plain and local, no hashtags. A Learn more button to the website is added.",
  pinterest: " The first line becomes the pin title (up to 100 characters).",
  tiktok: " Photos go out as a photo post; the first line becomes the title.",
  youtube: " The first line becomes the video title (up to 100 characters); the rest is the description.",
};

/** Photo library picker: our job photos and uploaded photos; upload new ones here too. */
export function PhotoPicker({ open, ...rest }) {
  return open ? <PickerBody {...rest} /> : null;
}
function PickerBody({ onClose, onPick, multiple = true, kind = "photo" }) {
  const [lib, setLib] = useState(null);
  const [chosen, setChosen] = useState([]);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [upName, setUpName] = useState("");
  const [error, setError] = useState("");
  const load = () => api("/photos").then(setLib).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  const upload = async (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setPct(0);
    setUpName(files.length > 1 ? `${files.length} files` : files[0].name);
    setError("");
    try {
      const form = new FormData();
      files.forEach((f) => form.append("photos", f));
      const added = await uploadFiles("/photos", form, setPct);
      await load();
      setChosen((c) => (multiple ? [...c, ...added.map((p) => p.ref)] : [added[0]?.ref].filter(Boolean)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const toggle = (ref) => setChosen((c) => (c.includes(ref) ? c.filter((x) => x !== ref) : multiple ? [...c, ref] : [ref]));
  const all = lib
    ? [...lib.uploaded.filter((p) => (p.kind || "photo") === kind).map((p) => ({ ...p, group: "Uploaded" })), ...(kind === "photo" ? lib.ours.map((p) => ({ ...p, group: "Our job photos" })) : [])]
    : [];
  const noun = kind === "video" ? "video" : "photo";
  return (
    <Modal open onClose={onClose} title={kind === "video" ? "Choose a video" : "Choose photos"} wide>
      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <p className="text-sm text-slate-500">{kind === "video" ? "MP4 or MOV, up to 500 MB. Vertical videos work best for Reels, TikTok and Shorts." : "Tick the photos to add. Instagram needs JPEG photos."}</p>
          <label className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold cursor-pointer ${busy ? "bg-slate-100 text-slate-400" : "bg-primary/10 text-primary hover:bg-primary/15"}`}>
            <Upload size={16} /> {busy ? `Uploading ${pct}%` : kind === "video" ? "Upload a video" : "Upload photos"}
            <input type="file" accept={kind === "video" ? "video/mp4,video/quicktime" : "image/jpeg,image/png"} multiple={multiple} className="hidden" onChange={upload} disabled={busy} />
          </label>
        </div>
        {busy && (
          <div className="mb-4">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1"><span>{pct >= 100 ? "Saving on the server…" : `Uploading ${upName}…`}</span><span className="tabular-nums">{pct}%</span></div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${pct}%` }} /></div>
          </div>
        )}
        {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}
        {!lib ? (
          <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
        ) : !all.length ? (
          <p className="text-sm text-slate-400 py-10 text-center">No {noun}s yet. Upload one above.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[55vh] overflow-y-auto pr-1">
            {all.map((p) => {
              const on = chosen.includes(p.ref);
              return (
                <button key={p.ref} type="button" onClick={() => toggle(p.ref)} title={p.description} className={`relative aspect-square rounded-xl overflow-hidden ring-2 transition ${on ? "ring-primary" : "ring-transparent hover:ring-slate-300"}`}>
                  {kind === "video" ? <video src={photoUrl(p.ref)} muted preload="metadata" className="w-full h-full object-cover bg-black" /> : <img src={photoUrl(p.ref)} alt={p.description} loading="lazy" className="w-full h-full object-cover" />}
                  {kind === "video" && <span className="absolute inset-0 flex items-center justify-center"><span className="w-9 h-9 rounded-full bg-black/55 text-white flex items-center justify-center"><Film size={16} /></span></span>}
                  <span className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${on ? "bg-primary" : "bg-black/30 ring-2 ring-white/80"}`}>{on && <Check size={14} />}</span>
                  <span className="absolute bottom-0 inset-x-0 px-1.5 py-1 text-[10px] font-medium text-white bg-gradient-to-t from-black/70 to-transparent text-left truncate">{p.group}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={() => { onPick(chosen); onClose(); }} disabled={!chosen.length}>Add {chosen.length ? `${chosen.length} ${noun}${chosen.length > 1 ? "s" : ""}` : `${noun}s`}</Button>
      </div>
    </Modal>
  );
}

/* ── previews: how each network shows the post ─────────────────────── */
function PreviewText({ text, clamp }) {
  return <p className={`whitespace-pre-wrap break-words ${clamp ? "line-clamp-6" : ""}`}>{text.split(/(#\w+|https?:\/\/\S+)/g).map((part, i) => (/^(#\w+|https?:\/\/)/.test(part) ? <span key={i} className="text-[#1D72D8]">{part}</span> : part))}</p>;
}
function Photos({ images, video, className = "" }) {
  if (video) return vidEl(video, `w-full max-h-96 bg-black ${className}`);
  if (!images.length) return null;
  if (images.length === 1) return <img src={photoUrl(images[0])} alt="" className={`w-full object-cover max-h-80 ${className}`} />;
  return (
    <div className={`grid grid-cols-2 gap-0.5 ${className}`}>
      {images.slice(0, 4).map((r, i) => (
        <div key={r} className="relative aspect-square">
          <img src={photoUrl(r)} alt="" className="w-full h-full object-cover" />
          {i === 3 && images.length > 4 && <span className="absolute inset-0 bg-black/50 text-white text-xl font-semibold flex items-center justify-center">+{images.length - 4}</span>}
        </div>
      ))}
    </div>
  );
}
export function Preview({ network, account, text, images, video }) {
  const name = account?.name || NETWORKS[network].label;
  if (network === "youtube") {
    const [title, ...rest] = text.split("\n");
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-slate-900">
        {video ? vidEl(video, "w-full aspect-video bg-black") : <div className="aspect-video bg-slate-900 flex flex-col items-center justify-center gap-2 text-white/60"><Film size={28} /><span className="text-xs font-medium">YouTube needs a video</span></div>}
        <div className="p-3 flex gap-2.5">
          {account ? <AccountAvatar account={account} size={34} /> : <span className="w-[34px] h-[34px] rounded-full bg-slate-200" />}
          <div className="min-w-0"><p className="font-semibold text-[14px] leading-snug line-clamp-2">{title.replace(/#\w+/g, "").trim() || "Video title"}</p><p className="text-xs text-slate-500 mt-0.5">{name} · 0 views · just now</p><p className="text-xs text-slate-500 mt-1 line-clamp-2">{rest.join(" ").trim()}</p></div>
        </div>
      </div>
    );
  }
  if (network === "pinterest") {
    const [title, ...rest] = text.split("\n");
    return (
      <div className="mx-auto max-w-[260px] text-slate-900">
        {video ? vidEl(video, "w-full aspect-[2/3] rounded-2xl object-cover bg-black") : images.length ? <img src={photoUrl(images[0])} alt="" className="w-full rounded-2xl object-cover" /> : <div className="aspect-[2/3] rounded-2xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">Pinterest needs a photo</div>}
        <p className="mt-2 font-semibold text-[14px] leading-snug line-clamp-2">{title.replace(/#\w+/g, "").trim()}</p>
        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{rest.join(" ").trim()}</p>
        <div className="flex items-center gap-1.5 mt-2">{account && <AccountAvatar account={account} size={20} />}<span className="text-xs font-medium">{account?.name || "Board"}</span></div>
      </div>
    );
  }
  if (network === "tiktok") {
    return (
      <div className="mx-auto w-[230px] aspect-[9/16] rounded-[28px] overflow-hidden bg-black relative text-white shadow-xl">
        {video ? vidEl(video, "absolute inset-0 w-full h-full object-cover") : images.length ? <img src={photoUrl(images[0])} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-xs text-white/50">TikTok needs a photo or video</div>}
        {images.length > 1 && <div className="absolute top-3 inset-x-0 flex justify-center gap-1">{images.slice(0, 6).map((r, i) => <span key={r} className={`h-1 w-4 rounded-full ${i ? "bg-white/40" : "bg-white"}`} />)}</div>}
        <div className="absolute inset-x-0 bottom-0 p-3 pt-16 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-[12px] font-semibold">@{account?.name || "cleaniq"}</p>
          <p className="text-[11px] leading-snug line-clamp-3 mt-1">{text}</p>
        </div>
      </div>
    );
  }
  if (network === "google") {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-[13px] text-slate-900">
        <div className="flex items-center gap-2.5 px-3.5 pt-3">{account ? <AccountAvatar account={account} size={34} /> : <span className="w-[34px] h-[34px] rounded-full bg-slate-200" />}<div className="leading-tight"><p className="font-semibold">{name}</p><p className="text-[11px] text-slate-500">Just now · Google</p></div></div>
        {video ? <p className="mx-3.5 mt-3 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-medium px-2.5 py-1.5">Google Business posts can't show video — this goes out as text.</p> : images.length > 0 && <img src={photoUrl(images[0])} alt="" className="w-full aspect-[4/3] object-cover mt-3" />}
        <div className="px-3.5 py-3"><PreviewText text={text} clamp /></div>
        <div className="px-3.5 pb-3.5"><span className="inline-block rounded-full border border-slate-300 px-3.5 py-1.5 text-[12px] font-medium text-[#1A73E8]">Learn more</span></div>
      </div>
    );
  }
  if (network === "threads") {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 text-[14px] text-slate-900">
        <div className="flex gap-2.5">
          {account ? <AccountAvatar account={account} size={36} /> : <span className="w-9 h-9 rounded-full bg-slate-200" />}
          <div className="min-w-0 flex-1">
            <p className="leading-tight"><span className="font-semibold">{account?.name || "cleaniq"}</span> <span className="text-slate-400">now</span></p>
            <div className="mt-1 leading-snug"><PreviewText text={text} /></div>
            {video && vidEl(video, "mt-2.5 w-full max-h-72 rounded-lg bg-black")}
            {!video && images.length > 0 && <div className="flex gap-1.5 mt-2.5 overflow-hidden">{images.slice(0, 3).map((r) => <img key={r} src={photoUrl(r)} alt="" className="h-36 w-28 rounded-lg object-cover shrink-0" />)}</div>}
            <div className="flex gap-4 text-slate-500 mt-3"><Heart size={17} /><MessageCircle size={17} /><Repeat2 size={17} /><Send size={16} /></div>
          </div>
        </div>
      </div>
    );
  }
  if (network === "instagram") {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-[13px] text-slate-900">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          {account && <AccountAvatar account={account} size={28} />}
          <span className="font-semibold">{account?.handle?.replace("@", "") || name}</span>
          <MoreHorizontal size={16} className="ml-auto text-slate-500" />
        </div>
        {video ? (
          <div className="relative">{vidEl(video, "w-full aspect-[4/5] object-cover bg-black")}<span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[11px] font-semibold">Reel</span></div>
        ) : images.length ? (
          <div className="relative">
            <img src={photoUrl(images[0])} alt="" className="w-full aspect-square object-cover" />
            {images.length > 1 && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[11px] font-semibold">1/{images.length}</span>}
          </div>
        ) : (
          <div className="aspect-square bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2"><ImagePlus size={28} /><span className="text-xs font-medium">Instagram needs a photo</span></div>
        )}
        <div className="flex items-center gap-3.5 px-3 pt-2.5 text-slate-800"><Heart size={20} /><MessageCircle size={20} /><Send size={19} /><Bookmark size={20} className="ml-auto" /></div>
        <div className="px-3 pt-2 pb-3"><span className="font-semibold mr-1.5">{account?.handle?.replace("@", "") || name}</span><span className="whitespace-pre-wrap break-words">{text.length > 160 ? `${text.slice(0, 160)}… more` : text}</span></div>
      </div>
    );
  }
  if (network === "x") {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 text-[14px] text-slate-900">
        <div className="flex gap-2.5">
          {account ? <AccountAvatar account={account} size={38} /> : <span className="w-[38px] h-[38px] rounded-full bg-slate-200" />}
          <div className="min-w-0 flex-1">
            <p className="leading-tight"><span className="font-bold">{name}</span> <span className="text-slate-500">{account?.handle || "@cleaniq"} · now</span></p>
            <div className="mt-1 leading-snug"><PreviewText text={text} /></div>
            <Photos images={images} video={video} className="mt-2.5 rounded-2xl overflow-hidden border border-slate-200" />
            <div className="flex justify-between text-slate-500 mt-3 pr-6"><MessageCircle size={16} /><Repeat2 size={16} /><Heart size={16} /><Share2 size={16} /></div>
          </div>
        </div>
      </div>
    );
  }
  if (network === "linkedin") {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-[13px] text-slate-900">
        <div className="flex items-center gap-2.5 px-3.5 pt-3">
          {account ? <AccountAvatar account={account} size={40} /> : <span className="w-10 h-10 rounded bg-slate-200" />}
          <div className="leading-tight"><p className="font-semibold">{name}</p><p className="text-[11px] text-slate-500">{account?.handle || "Company page"}</p><p className="text-[11px] text-slate-500 flex items-center gap-1">now · <Globe2 size={10} /></p></div>
        </div>
        <div className="px-3.5 py-2.5"><PreviewText text={text} clamp /></div>
        <Photos images={images} video={video} />
        <div className="flex justify-around text-slate-500 text-xs font-semibold border-t border-slate-100 py-2"><span className="flex items-center gap-1"><ThumbsUp size={14} /> Like</span><span className="flex items-center gap-1"><MessageCircle size={14} /> Comment</span><span className="flex items-center gap-1"><Repeat2 size={14} /> Repost</span><span className="flex items-center gap-1"><Send size={14} /> Send</span></div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-[14px] text-slate-900">
      <div className="flex items-center gap-2.5 px-3.5 pt-3">
        {account ? <AccountAvatar account={account} size={40} /> : <span className="w-10 h-10 rounded-full bg-slate-200" />}
        <div className="leading-tight"><p className="font-semibold">{name}</p><p className="text-xs text-slate-500 flex items-center gap-1">Just now · <Globe2 size={11} /></p></div>
        <MoreHorizontal size={18} className="ml-auto text-slate-500" />
      </div>
      <div className="px-3.5 py-2.5"><PreviewText text={text} clamp /></div>
      <Photos images={images} video={video} />
      <div className="flex justify-around text-slate-500 text-[13px] font-semibold border-t border-slate-100 mx-3 py-2"><span className="flex items-center gap-1.5"><ThumbsUp size={16} /> Like</span><span className="flex items-center gap-1.5"><MessageCircle size={16} /> Comment</span><span className="flex items-center gap-1.5"><Share2 size={16} /> Share</span></div>
    </div>
  );
}

/* ── the composer ───────────────────────────────────────────────────── */
// Reddit and Nextdoor don't let new apps post for you (Reddit needs approval under its Responsible
// Builder Policy; Nextdoor's posting API is for approved partners). Until then: copy the post and
// open the site with it filled in, ready to post by hand.
function HandShare({ text, images }) {
  const [sub, setSub] = useState("");
  const [copied, setCopied] = useState("");
  const body = text.trim();
  const title = (body.split("\n").find((l) => l.trim()) || "").slice(0, 300);
  const rest = body.slice(body.indexOf(title) + title.length).trim();
  const copy = async (what) => {
    try { await navigator.clipboard.writeText(body); } catch { /* still opens the site */ }
    setCopied(what);
    setTimeout(() => setCopied(""), 2500);
  };
  const subName = sub.trim().replace(/^\/?r\//i, "").replace(/[^A-Za-z0-9_]/g, "");
  const redditUrl = `https://www.reddit.com/${subName ? `r/${subName}/` : ""}submit?type=TEXT&title=${encodeURIComponent(title)}&text=${encodeURIComponent(rest)}`;
  const nextdoorUrl = `https://nextdoor.com/sharekit/?source=${encodeURIComponent("https://www.cleaniqservices.com")}&body=${encodeURIComponent(body)}`;
  const btn = (href, what, color, label) => (
    <a href={body ? href : undefined} target="_blank" rel="noreferrer" onClick={() => body && copy(what)}
      className={`flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white transition ${body ? "hover:opacity-90" : "opacity-40 pointer-events-none"}`} style={{ background: color }}>
      {copied === what ? <><Check size={15} /> Copied — paste if needed</> : label}
    </a>
  );
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-slate-900">Google Business, Reddit & Nextdoor <span className="font-normal text-slate-400">(post by hand)</span></p>
      <p className="text-xs text-slate-500 mt-0.5 mb-3">These don't allow automatic posting yet. Click to open the site with your post filled in (it's also copied, in case the site doesn't fill it). Add your photos there and press Post.</p>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-2">
          <input value={sub} onChange={(e) => setSub(e.target.value)} placeholder="Subreddit (optional), e.g. manchester" className={inputCls} />
          {btn(redditUrl, "reddit", "#FF4500", "Open in Reddit")}
          <p className="text-[11px] text-slate-400">The first line becomes the title. Most subreddits ban adverts — check their rules, or post to your own profile.</p>
        </div>
        <div className="space-y-2">
          <div className="h-[38px] flex items-center text-xs text-slate-500">Your Google listing (Search & Maps).</div>
          {btn("https://business.google.com/", "google", "#1A73E8", "Open Google Business")}
          <p className="text-[11px] text-slate-400">Your post is copied. Click Add update (or Posts), paste, add a photo, then Post.</p>
        </div>
        <div className="space-y-2">
          <div className="h-[38px] flex items-center text-xs text-slate-500">Your Nextdoor neighbourhood.</div>
          {btn(nextdoorUrl, "nextdoor", "#1B8751", "Open in Nextdoor")}
          <p className="text-[11px] text-slate-400">To post as the business, switch to your Cleaniq business page in Nextdoor first.</p>
        </div>
      </div>
      {images.length > 0 && (
        <p className="text-xs text-slate-500 mt-3">Photos to add: {images.map((r, i) => <a key={r} href={photoUrl(r)} target="_blank" rel="noreferrer" download className="text-primary font-semibold hover:underline mr-2">photo {i + 1}</a>)}</p>
      )}
    </Card>
  );
}

export default function Composer({ accounts, post, onDone, notify, defaultWhen }) {
  const editing = !!post?._id;
  // Until you change it: the post's accounts, or every switched-on account for a new post.
  const [picked, setChosen] = useState(() => (post?.accounts?.length ? post.accounts.map(String) : null));
  const chosen = picked ?? accounts.filter((a) => a.active).map((a) => a._id);
  const [text, setText] = useState(post?.text || "");
  const [variants, setVariants] = useState({ facebook: "", instagram: "", linkedin: "", x: "", ...(post?.variants || {}) });
  const [images, setImages] = useState(post?.images || []);
  const [video, setVideo] = useState(post?.video || "");
  const [videoPicker, setVideoPicker] = useState(false);
  const [tab, setTab] = useState("all");
  const [mode, setMode] = useState(post?.status === "scheduled" || defaultWhen ? "schedule" : "now");
  const [when, setWhen] = useState(() => toLocalInput(post?.scheduledAt && post.status === "scheduled" ? post.scheduledAt : defaultWhen || Date.now() + 3600 * 1000));
  const [minWhen] = useState(() => toLocalInput(Date.now()));
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const selected = accounts.filter((a) => chosen.includes(a._id));
  const nets = NETWORK_ORDER.filter((n) => selected.some((a) => a.network === n));
  const [pickedNet, setPreviewNet] = useState(null);
  const previewNet = nets.includes(pickedNet) ? pickedNet : nets[0] || "facebook";

  const textFor = (n) => (variants[n]?.trim() ? variants[n] : text) + (post?.credit ? `\n\n${post.credit}` : "");
  const problems = useMemo(() => {
    const out = [];
    if (!selected.length) out.push("Choose at least one account.");
    if (!text.trim() && !nets.some((n) => variants[n]?.trim())) out.push("Write something to post.");
    for (const n of PHOTO_ONLY) if (nets.includes(n) && !images.length && !video) out.push(`${NETWORKS[n].label} needs a photo or a video.`);
    for (const n of VIDEO_ONLY) if (nets.includes(n) && !video) out.push(`${NETWORKS[n].label} needs a video.`);
    if (video && nets.includes("pinterest") && !images.length) out.push("Pinterest video pins need a cover photo — add a photo too.");
    if (!video && nets.includes("instagram") && images.some((r) => !/\.jpe?g$/i.test(r))) out.push("Instagram only accepts JPEG photos — one of your photos is a PNG.");
    if (!video && nets.includes("tiktok") && images.some((r) => !/\.(jpe?g|webp)$/i.test(r))) out.push("TikTok only accepts JPEG photos — one of your photos is a PNG.");
    for (const n of nets) if (textFor(n).length > LIMITS[n]) out.push(`${NETWORKS[n].label} text is too long (${textFor(n).length} of ${LIMITS[n]} characters).`);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, text, variants, images, video, nets]);

  const save = async (action) => {
    setBusy(action);
    setError("");
    try {
      const body = { text, variants, images, video, accounts: chosen, action, ...(action === "schedule" ? { scheduledAt: new Date(when).toISOString() } : {}) };
      const saved = editing ? await api(`/posts/${post._id}`, { method: "PATCH", body }) : await api("/posts", { method: "POST", body });
      if (action === "now") {
        const ok = saved.results?.filter((r) => r.status === "posted").length || 0;
        notify(saved.status === "posted" ? `Posted to ${ok} account${ok === 1 ? "" : "s"}.` : saved.status === "partial" ? `Posted to ${ok} of ${saved.accounts.length} accounts — see the post for what went wrong.` : "The post didn't go out. Open it to see why.", saved.status === "posted" ? "ok" : "error");
      } else notify(action === "schedule" ? `Scheduled for ${new Date(when).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.` : "Draft saved.");
      onDone(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const current = tab === "all" ? text : variants[tab];
  const setCurrent = (v) => (tab === "all" ? setText(v) : setVariants((x) => ({ ...x, [tab]: v })));
  const countNet = tab === "all" ? (nets.includes("x") ? "x" : nets[0]) : tab;
  const count = countNet ? textFor(countNet).length : current.length;
  const limit = countNet ? LIMITS[countNet] : null;
  const move = (i, d) => setImages((list) => { const j = i + d; if (j < 0 || j >= list.length) return list; const c = [...list]; [c[i], c[j]] = [c[j], c[i]]; return c; });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
      <div className="space-y-5">
        <Card className="p-5">
          <p className={labelCls}>Post to</p>
          {accounts.length === 0 ? (
            <p className="text-sm text-slate-500">No accounts connected yet. Connect them on the Accounts page.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {accounts.map((a) => {
                const on = chosen.includes(a._id);
                return (
                  <button key={a._id} type="button" onClick={() => setChosen(on ? chosen.filter((x) => x !== a._id) : [...chosen, a._id])}
                    className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border text-sm font-medium transition ${on ? "border-primary bg-primary/5 text-slate-900 ring-2 ring-primary/15" : "border-slate-200 text-slate-500 hover:border-slate-300 opacity-70"}`}>
                    <AccountAvatar account={a} size={26} />
                    <span className="max-w-[160px] truncate">{a.name}</span>
                    {on && <Check size={14} className="text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-1 px-3 pt-3 border-b border-slate-100 overflow-x-auto">
            {["all", ...nets].map((n) => (
              <button key={n} type="button" onClick={() => setTab(n)} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap ${tab === n ? "border-primary text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
                {n === "all" ? "All networks" : <><NetworkMark network={n} size={14} /> {NETWORKS[n].label}{variants[n]?.trim() && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}</>}
              </button>
            ))}
          </div>
          <div className="p-5">
            {tab !== "all" && (
              <p className="text-xs text-slate-500 mb-2">Wording just for {NETWORKS[tab].label}. Leave empty to use the main text.{TIPS[tab] || ""}</p>
            )}
            <textarea value={current} onChange={(e) => setCurrent(e.target.value)} rows={tab === "x" ? 5 : 9}
              placeholder={tab === "all" ? "What would you like to share? e.g. a cleaning tip, a before & after, a special day…" : `Leave empty to use the main text: "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`}
              className="w-full resize-y rounded-xl border-0 bg-slate-50 px-4 py-3 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/10" />
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-slate-400">{tab === "all" ? "Used for every network unless you change a network's wording." : ""}</span>
              {limit && <span className={`font-semibold tabular-nums ${count > limit ? "text-rose-600" : count > limit * 0.9 ? "text-amber-600" : "text-slate-400"}`}>{countNet && tab === "all" && nets.length > 1 ? `${NETWORKS[countNet].label}: ` : ""}{count.toLocaleString()} / {limit.toLocaleString()}</span>}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Video</p>
              <p className="text-xs text-slate-500 mt-0.5">Goes out as a Reel on Instagram, a video on TikTok, YouTube, Facebook, LinkedIn, X and Threads.</p>
            </div>
            {!video && <Button variant="secondary" size="sm" onClick={() => setVideoPicker(true)}><Film size={15} /> Add a video</Button>}
          </div>
          {video ? (
            <div className="flex items-start gap-4">
              {vidEl(video, "w-56 max-h-72 rounded-xl bg-black")}
              <div className="space-y-2">
                <Button variant="secondary" size="sm" onClick={() => setVideoPicker(true)}><Film size={14} /> Change video</Button>
                <Button variant="danger" size="sm" onClick={() => setVideo("")}><Trash2 size={14} /> Remove video</Button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setVideoPicker(true)} className="w-full rounded-xl border-2 border-dashed border-slate-200 py-6 text-sm text-slate-500 hover:border-primary/40 hover:text-primary transition flex flex-col items-center gap-2">
              <Film size={22} /> Add a video (MP4 or MOV) — optional
            </button>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-900">{video ? "Cover photo" : "Photos"} <span className="font-normal text-slate-400">{video ? "(optional)" : `(${images.length}/10)`}</span></p>
            <Button variant="secondary" size="sm" onClick={() => setPicker(true)} disabled={images.length >= 10}><ImagePlus size={15} /> Add photos</Button>
          </div>
          {images.length ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((r, i) => (
                <div key={r} className="relative shrink-0 w-28 group">
                  <img src={photoUrl(r)} alt="" className="w-28 h-28 rounded-xl object-cover ring-1 ring-slate-200" />
                  {i === 0 && <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold">Cover</span>}
                  <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-0 group-hover:opacity-100 transition">
                    <span className="flex gap-1">
                      <button type="button" onClick={() => move(i, -1)} className="w-6 h-6 rounded-md bg-white/95 shadow flex items-center justify-center" aria-label="Move left"><ArrowLeft size={12} /></button>
                      <button type="button" onClick={() => move(i, 1)} className="w-6 h-6 rounded-md bg-white/95 shadow flex items-center justify-center" aria-label="Move right"><ArrowRight size={12} /></button>
                    </span>
                    <button type="button" onClick={() => setImages((l) => l.filter((x) => x !== r))} className="w-6 h-6 rounded-md bg-white/95 shadow text-rose-600 flex items-center justify-center" aria-label="Remove"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <button type="button" onClick={() => setPicker(true)} className="w-full rounded-xl border-2 border-dashed border-slate-200 py-8 text-sm text-slate-500 hover:border-primary/40 hover:text-primary transition flex flex-col items-center gap-2">
              <ImagePlus size={22} /> Add photos from your library or upload new ones
            </button>
          )}
        </Card>

        <HandShare text={text} images={images} />

        <Card className="p-5">
          <p className={labelCls}>When</p>
          <div className="grid sm:grid-cols-3 gap-2 mb-4">
            {[["now", Send, "Post now"], ["schedule", CalendarClock, "Schedule"], ["draft", Save, "Save as draft"]].map(([m, Icon, label]) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-semibold transition ${mode === m ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/15" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}><Icon size={16} /> {label}</button>
            ))}
          </div>
          {mode === "schedule" && (
            <div className="mb-4 max-w-xs">
              <label className={labelCls} htmlFor="when">Date and time (your time)</label>
              <input id="when" type="datetime-local" value={when} min={minWhen} onChange={(e) => setWhen(e.target.value)} className={inputCls} />
            </div>
          )}
          {mode !== "draft" && problems.length > 0 && (
            <ul className="mb-4 space-y-1.5">
              {problems.map((p) => <li key={p} className="flex gap-2 text-sm text-amber-700"><AlertTriangle size={15} className="shrink-0 mt-0.5" />{p}</li>)}
            </ul>
          )}
          {error && <p className="mb-4 text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => onDone(null)}>Cancel</Button>
            <Button size="lg" onClick={() => save(mode)} disabled={!!busy || (mode !== "draft" && problems.length > 0)}>
              {busy ? "Working…" : mode === "now" ? <><Send size={16} /> Post now</> : mode === "schedule" ? <><CalendarClock size={16} /> {editing && post.status === "scheduled" ? "Update schedule" : "Schedule post"}</> : <><Save size={16} /> Save draft</>}
            </Button>
          </div>
        </Card>
      </div>

      <div className="xl:sticky xl:top-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Preview</p>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(nets.length ? nets : ["facebook"]).map((n) => (
              <button key={n} type="button" onClick={() => setPreviewNet(n)} className={`w-8 h-7 rounded-md flex items-center justify-center transition ${previewNet === n ? "bg-white shadow-sm" : "opacity-50 hover:opacity-100"}`} aria-label={NETWORKS[n].label}><NetworkMark network={n} size={15} /></button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-100/80 p-4">
          <Preview network={previewNet} account={selected.find((a) => a.network === previewNet)} text={textFor(previewNet) || "Your post will appear here."} images={images} video={video} />
        </div>
        <p className="text-xs text-slate-400 px-1">A close guide to how it will look; each network may crop photos a little differently.</p>
      </div>

      <PhotoPicker open={picker} onClose={() => setPicker(false)} onPick={(refs) => setImages((l) => [...l, ...refs.filter((r) => !l.includes(r))].slice(0, 10))} />
      <PhotoPicker open={videoPicker} kind="video" multiple={false} onClose={() => setVideoPicker(false)} onPick={(refs) => refs[0] && setVideo(refs[0])} />
    </div>
  );
}
