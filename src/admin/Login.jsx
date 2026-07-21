import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import logo from "../assets/logo DP.jpg";
import officeImg from "../assets/office.jpg";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', data.username);
        localStorage.setItem('adminRole', data.role || 'superadmin');
        localStorage.setItem('adminPermissions', JSON.stringify(data.permissions || []));
        onLogin(data.token);
      } else {
        setError(data.message || 'Invalid login credentials');
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#061A13] flex overflow-hidden font-sans">

      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-16">
        <img
          src={officeImg}
          alt="Cleaniq Office"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#061A13]/80 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061A13] via-[#061A13]/50 to-transparent" />

        <div className="relative z-10 bg-[#0B2D22] border border-white/10 p-4 rounded-3xl inline-block shadow-2xl">
          <img src={logo} alt="Cleaniq" className="h-12 object-contain" />
        </div>

        <div className="relative z-10 space-y-6 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles size={14} className="text-emerald-400" />
            Admin Operations Portal
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]"
          >
            Streamlining <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">
              Professional Cleaning
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg font-medium text-white/70 max-w-md leading-relaxed"
          >
            Manage bookings, workers, clients, and pricing from a single secure dashboard built for Manchester's top cleaning service.
          </motion.p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative bg-[#061A13]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md w-full relative z-10"
        >
          <div className="lg:hidden text-center mb-10">
            <div className="bg-[#0B2D22] border border-white/10 p-4 rounded-3xl inline-block shadow-sm mb-6">
              <img src={logo} alt="Cleaniq" className="h-10 object-contain" />
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-bold text-white tracking-tighter mb-3">Welcome Back</h2>
            <p className="text-white/40 font-medium">Please enter your credentials to access the admin operations center.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/25 text-rose-400 flex items-center gap-3 text-sm font-bold">
                    <AlertCircle size={18} className="shrink-0" />
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2 group">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-2 transition-colors group-focus-within:text-emerald-400">
                Administrator ID
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-5 text-white/30 group-focus-within:text-emerald-400 transition-colors" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@cleaniq"
                  className="w-full pl-14 pr-6 py-4 bg-[#071D16] border border-white/10 focus:border-emerald-500/50 rounded-[20px] outline-none font-bold text-white placeholder:text-white/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <div className="flex justify-between items-center ml-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest transition-colors group-focus-within:text-emerald-400">
                  Password
                </label>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-5 text-white/30 group-focus-within:text-emerald-400 transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-14 pr-6 py-4 bg-[#071D16] border border-white/10 focus:border-emerald-500/50 rounded-[20px] outline-none font-bold text-white placeholder:text-white/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full relative overflow-hidden bg-emerald-500 text-white py-5 rounded-[20px] font-bold tracking-widest uppercase text-sm group hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-xl shadow-emerald-900/40 disabled:opacity-60"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <div className="relative flex items-center justify-center gap-3">
                  {loading ? 'Authenticating...' : 'Access Dashboard'}
                  {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </div>
              </button>
            </div>
          </form>

          <div className="mt-12 flex items-center justify-center gap-2 text-[10px] text-white/25 font-bold uppercase tracking-widest">
            <ShieldCheck size={14} className="text-emerald-500" />
            256-Bit Encrypted Connection
          </div>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export default Login;
