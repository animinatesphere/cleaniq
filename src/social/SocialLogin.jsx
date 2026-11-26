// /social/login: sign-in for the social media dashboard.
//  - Social media logins use the EMAIL and password a main admin created for them.
//  - Main admins use their usual admin USERNAME and password.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Lock, ArrowRight } from "lucide-react";
import { api, TOKEN_KEY } from "./api";
import { NetworkMark, NETWORK_ORDER } from "./ui";
import logo from "../assets/lOGO.png";

const API = import.meta.env.VITE_API_URL;

export default function SocialLogin() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const value = login.trim();
      if (value.includes("@")) {
        const { token } = await api("/login", { method: "POST", body: { email: value, password } });
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        const res = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: value, password }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Invalid username or password");
        localStorage.removeItem(TOKEN_KEY);
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUser", data.username);
        localStorage.setItem("adminRole", data.role || "superadmin");
        localStorage.setItem("adminPermissions", JSON.stringify(data.permissions || []));
      }
      navigate("/social", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <Helmet>
        <title>Sign in · Cleaniq Social</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#04140F] via-[#073B2A] to-primary p-12 text-white">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute -left-20 bottom-0 w-80 h-80 rounded-full bg-sky-400/10 blur-3xl" />
        <img src={logo} alt="Cleaniq" className="h-9 w-auto self-start brightness-0 invert" />
        <div className="relative">
          <div className="flex gap-3 mb-8">{NETWORK_ORDER.map((n, i) => <span key={n} className="rounded-2xl bg-white/10 p-3 backdrop-blur shadow-xl" style={{ transform: `translateY(${i % 2 ? 10 : 0}px)` }}><NetworkMark network={n} size={30} /></span>)}</div>
          <h1 className="text-4xl font-bold tracking-tight leading-tight max-w-md">All your social media, in one place.</h1>
          <p className="text-white/70 mt-4 max-w-md">Write once, preview it on every network, schedule it or post now — or let Claude write and post for you.</p>
        </div>
        <p className="relative text-xs text-white/40">Cleaniq Services · Social</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12 bg-[#F6F7F9] lg:bg-white">
        <form onSubmit={submit} className="w-full max-w-sm">
          <img src={logo} alt="Cleaniq" className="h-8 w-auto mb-10 lg:hidden" />
          <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5"><Lock size={20} /></span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to Social</h2>
          <p className="text-sm text-slate-500 mt-1.5 mb-8">Use your social media login email, or your main admin username.</p>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5" htmlFor="login">Email or admin username</label>
          <input id="login" autoComplete="username" required value={login} onChange={(e) => setLogin(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary mb-4" />
          <label className="block text-xs font-semibold text-slate-600 mb-1.5" htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary" />
          {error && <p className="mt-4 text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={busy} className="mt-6 w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-dark disabled:opacity-60 transition shadow-sm shadow-primary/25">
            {busy ? "Signing in…" : <>Sign in <ArrowRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
