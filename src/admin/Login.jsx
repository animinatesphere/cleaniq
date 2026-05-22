import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import logo from "../assets/lOGO.png";

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
    <div className="min-h-screen bg-primary-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -ml-64 -mb-64" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-[60px] p-8 md:p-12 shadow-2xl relative z-10 border-8 border-white/10">
          <div className="text-center mb-10">
            <img src={logo} alt="Cleaniq" className="h-16 mx-auto mb-8" />
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              Secure Admin Access
            </div>
            <h2 className="text-3xl font-black text-primary-dark tracking-tighter">Welcome Back.</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center gap-3 text-sm font-bold"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Username</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="cleaniqadmin"
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-[24px] outline-none font-bold text-primary-dark transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-primary focus:bg-white rounded-[24px] outline-none font-bold text-primary-dark transition-all"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-5 text-lg group shadow-xl shadow-primary/20"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Protected by Cleaniq Security Protocol
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
