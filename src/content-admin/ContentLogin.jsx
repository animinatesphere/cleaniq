// /content-admin/login: sign-in for the website content editor.
//  - Main admins use their usual admin USERNAME and password (same as /admin).
//  - Content editors use the EMAIL and password a main admin created for them.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Lock } from "lucide-react";
import { api, TOKEN_KEY } from "./api";
import logo from "../assets/lOGO.png";

export default function ContentLogin() {
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
        // content editor account
        const { token } = await api("/content-editors/login", { method: "POST", body: { email: value, password } });
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        // main admin: the same sign-in as /admin (also signs you in to the main admin)
        const data = await api("/auth/login", { method: "POST", body: { username: value, password } });
        localStorage.removeItem(TOKEN_KEY);
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUser", data.username);
        localStorage.setItem("adminRole", data.role || "superadmin");
        localStorage.setItem("adminPermissions", JSON.stringify(data.permissions || []));
      }
      navigate("/content-admin", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A3B2C] flex items-center justify-center p-4">
      <Helmet>
        <title>Website Content | Sign in</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl space-y-5">
        <div className="text-center">
          <img src={logo} alt="Cleaniq Services" className="h-10 mx-auto mb-4 bg-[#0A3B2C] rounded-xl p-1.5" />
          <h1 className="text-xl font-black text-slate-900">Website Content</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to edit the website's text.</p>
        </div>
        {error && <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p>}
        <label className="block">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Admin username or editor email</span>
          <input type="text" required autoComplete="username" autoCapitalize="none" spellCheck={false} value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Your admin username, or your email" className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500" />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</span>
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500" />
        </label>
        <button disabled={busy} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold flex items-center justify-center gap-2">
          <Lock size={16} /> {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-xs text-slate-400 text-center">
          Admins: use your normal admin username and password. Content editors: use your email. Need an account? Ask a
          Cleaniq admin to create one for you.
        </p>
      </form>
    </div>
  );
}
