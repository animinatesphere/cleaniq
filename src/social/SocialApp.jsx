// /social: the social media dashboard. Its own login (social users) — main admins can use it too.
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { LayoutDashboard, PenSquare, CalendarDays, ListChecks, Bot, Image as ImageIcon, Link2, Users, LogOut, Menu, X as Close, CheckCircle2, AlertTriangle } from "lucide-react";
import { api, getToken, signOut } from "./api";
import { NetworkMark, NETWORK_ORDER } from "./ui";
import Composer from "./Composer";
import Autopilot from "./Autopilot";
import { Overview, Calendar, PostsList, PostDetail } from "./Pages";
import { Accounts, Photos, Team } from "./Manage";
import logo from "../assets/lOGO.png";

const NAV = [
  ["overview", "Overview", LayoutDashboard],
  ["compose", "Create post", PenSquare],
  ["calendar", "Calendar", CalendarDays],
  ["posts", "Posts", ListChecks],
  ["autopilot", "Autopilot", Bot],
  ["photos", "Photos", ImageIcon],
  ["accounts", "Accounts", Link2],
];
const TITLES = { overview: "Overview", compose: "Create post", calendar: "Calendar", posts: "Posts", autopilot: "Autopilot", photos: "Photo library", accounts: "Accounts", team: "Team logins", edit: "Edit post" };

export default function SocialApp() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [page, setPage] = useState(() => (typeof window !== "undefined" && window.location.hash.slice(1)) || "overview");
  const [accounts, setAccounts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [autopilots, setAutopilots] = useState([]);
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const [newAt, setNewAt] = useState(null);
  // Back from connecting an account (?connected=… or ?error=…).
  const [toast, setToast] = useState(() => {
    if (typeof window === "undefined") return null;
    const q = new URLSearchParams(window.location.search);
    if (q.get("error")) return { text: q.get("error"), tone: "error", id: 1 };
    if (q.get("connected")) return { text: `Connected ${q.get("connected")} account${q.get("connected") === "1" ? "" : "s"}.`, tone: "ok", id: 1 };
    return null;
  });
  const [menu, setMenu] = useState(false);

  const notify = useCallback((text, tone = "ok") => {
    setToast({ text, tone, id: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // If loading fails, say so (instead of looking like nothing is connected).
  const reload = useCallback(() => {
    const failed = (e) => {
      if (e?.status === 401) { signOut(); navigate("/social/login", { replace: true }); return; }
      notify(`Couldn't load your dashboard (${e?.message || "no connection"}). Refresh the page, or log out and in again.`, "error");
    };
    api("/accounts").then(setAccounts).catch(failed);
    api("/posts").then(setPosts).catch(failed);
    api("/autopilots").then(setAutopilots).catch(failed);
    api("/status").then(setStatus).catch(failed);
  }, [notify, navigate]);

  useEffect(() => {
    if (!getToken()) {
      navigate("/social/login", { replace: true });
      return;
    }
    api("/me")
      .then(({ user }) => { setMe(user); reload(); })
      .catch(() => { signOut(); navigate("/social/login", { replace: true }); });
  }, [navigate, reload]);

  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, "", `/social${window.location.hash}`);
  }, []);

  // Keep the page list fresh while posts go out.
  useEffect(() => {
    if (!me) return undefined;
    const t = setInterval(() => api("/posts").then(setPosts).catch(() => {}), 30000);
    return () => clearInterval(t);
  }, [me]);

  const go = (p) => {
    setPage(p);
    setMenu(false);
    if (p !== "edit") setEditing(null);
    if (p !== "compose") setNewAt(null);
    window.history.replaceState(null, "", `#${p}`);
    window.scrollTo({ top: 0 });
  };
  const doneComposing = (saved) => {
    reload();
    setEditing(null);
    setNewAt(null);
    if (saved) setOpen(saved);
    go(saved?.status === "scheduled" ? "calendar" : saved ? "posts" : "overview");
  };
  const logout = () => {
    signOut();
    navigate("/social/login", { replace: true });
  };

  if (!me) return <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center text-sm text-slate-400">Loading…</div>;

  const scheduled = posts.filter((p) => p.status === "scheduled").length;
  const problems = posts.filter((p) => ["failed", "partial"].includes(p.status)).length;
  const nav = [...NAV, ...(me.isAdmin ? [["team", "Team logins", Users]] : [])];

  const sidebar = (
    <nav className="flex flex-col h-full">
      <div className="px-5 h-16 flex items-center gap-2.5 border-b border-slate-100">
        <span className="rounded-lg bg-primary px-2.5 py-1.5"><img src={logo} alt="Cleaniq" className="h-5 w-auto" /></span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-primary bg-primary/10 rounded-md px-1.5 py-0.5">Social</span>
      </div>
      <div className="px-3 py-4">
        <button type="button" onClick={() => go("compose")} className="w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-primary/25 hover:bg-primary-dark transition"><PenSquare size={16} /> Create post</button>
      </div>
      <div className="px-3 space-y-0.5 flex-1">
        {nav.filter(([k]) => k !== "compose").map(([k, label, Icon]) => {
          const active = page === k || (k === "posts" && page === "edit");
          const badge = k === "calendar" && scheduled ? scheduled : k === "posts" && problems ? problems : 0;
          return (
            <button key={k} type="button" onClick={() => go(k)} className={`w-full flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
              <Icon size={17} className={active ? "text-emerald-300" : "text-slate-400"} />
              {label}
              {badge > 0 && <span className={`ml-auto text-[11px] font-bold rounded-full px-1.5 min-w-[20px] h-5 flex items-center justify-center ${k === "posts" ? "bg-rose-100 text-rose-700" : active ? "bg-white/15 text-white" : "bg-sky-100 text-sky-700"}`}>{badge}</span>}
            </button>
          );
        })}
      </div>
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-1 px-2 pb-3">{NETWORK_ORDER.map((n) => <span key={n} className={accounts.some((a) => a.network === n) ? "" : "opacity-25 grayscale"} title={n}><NetworkMark network={n} size={15} /></span>)}<span className="text-[11px] text-slate-400 ml-1 whitespace-nowrap">{accounts.length} connected</span></div>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-emerald-400 text-white text-sm font-bold flex items-center justify-center">{(me.name || "?").charAt(0).toUpperCase()}</span>
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900 truncate">{me.name}</p><p className="text-[11px] text-slate-400 truncate">{me.isAdmin ? "Main admin" : me.email}</p></div>
          <button type="button" onClick={logout} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Sign out" title="Sign out"><LogOut size={16} /></button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-slate-900">
      <Helmet>
        <title>{TITLES[page] || "Social"} · Cleaniq Social</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200/80 z-30">{sidebar}</aside>
      {menu && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/40" onClick={() => setMenu(false)}>
          <aside className="w-72 h-full bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 h-16 bg-[#F6F7F9]/85 backdrop-blur border-b border-slate-200/70 flex items-center gap-3 px-4 sm:px-8">
          <button type="button" onClick={() => setMenu(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-white" aria-label="Menu"><Menu size={20} /></button>
          <h1 className="text-lg font-semibold tracking-tight">{TITLES[page] || "Overview"}</h1>
          {page !== "compose" && page !== "edit" && <button type="button" onClick={() => go("compose")} className="ml-auto lg:hidden h-9 px-3 rounded-lg bg-primary text-white text-sm font-semibold flex items-center gap-1.5"><PenSquare size={15} /> Post</button>}
        </header>
        <main className="px-4 sm:px-8 py-6 sm:py-8 max-w-[1400px]">
          {page === "overview" && <Overview me={me} posts={posts} accounts={accounts} autopilots={autopilots} go={go} onOpen={setOpen} status={status} />}
          {page === "compose" && <Composer key={newAt ? String(newAt) : "new"} accounts={accounts} notify={notify} onDone={doneComposing} defaultWhen={newAt} />}
          {page === "edit" && editing && <Composer key={editing._id} accounts={accounts} post={editing} notify={notify} onDone={doneComposing} />}
          {page === "calendar" && <Calendar posts={posts} accounts={accounts} onOpen={setOpen} onNewAt={(d) => { setNewAt(d); go("compose"); }} />}
          {page === "posts" && <PostsList posts={posts} accounts={accounts} onOpen={setOpen} go={go} />}
          {page === "autopilot" && <Autopilot autopilots={autopilots} accounts={accounts} reload={reload} notify={notify} onOpenPost={setOpen} status={status} />}
          {page === "photos" && <Photos notify={notify} />}
          {page === "accounts" && <Accounts accounts={accounts} status={status} reload={reload} notify={notify} />}
          {page === "team" && me.isAdmin && <Team notify={notify} />}
        </main>
      </div>

      {open && (
        <PostDetail
          key={open._id}
          post={open}
          accounts={accounts}
          notify={notify}
          onClose={() => setOpen(null)}
          onEdit={(p) => { setOpen(null); setEditing(p); go("edit"); }}
          onChanged={(p) => { setOpen(p); reload(); }}
        />
      )}

      {toast && (
        <div key={toast.id} className="fixed bottom-5 left-1/2 -translate-x-1/2 lg:left-[calc(50%+8rem)] z-[60] max-w-md w-[calc(100%-2rem)]">
          <div className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-2xl text-sm font-medium ${toast.tone === "error" ? "bg-rose-600 text-white" : "bg-slate-900 text-white"}`}>
            {toast.tone === "error" ? <AlertTriangle size={18} className="shrink-0 mt-px" /> : <CheckCircle2 size={18} className="shrink-0 mt-px text-emerald-300" />}
            <span className="flex-1">{toast.text}</span>
            <button type="button" onClick={() => setToast(null)} className="opacity-70 hover:opacity-100" aria-label="Close"><Close size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
