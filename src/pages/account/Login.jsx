import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import logoImg from '../../assets/logo DP.jpg';

export default function CustomerLogin() {
  const { login } = useCustomerAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      navigate('/account/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-start sm:items-center justify-center px-4 pt-36 sm:py-20">
      <Helmet>
        <title>My Account — Cleaniq Services</title>
        <meta name="description" content="Login to your Cleaniq account to view bookings, chat with admin, and manage your cleaning services." />
      </Helmet>

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src={logoImg} alt="Cleaniq logo" className="h-16 w-auto object-contain rounded-2xl shadow-md border border-slate-100" />
          </Link>
          <h1 className="text-3xl font-extrabold text-primary-dark tracking-tight">Welcome back</h1>
          <p className="text-slate-400 font-bold text-sm mt-2">Log in to manage your bookings</p>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          {error && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl p-4 mb-6">
              <AlertCircle size={18} className="shrink-0" />
              <p className="font-bold text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
              <input
                id="login-email"
                type="email"
                placeholder="Email address"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full pl-12 pr-5 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 outline-none font-bold text-sm transition-all"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full pl-12 pr-14 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 outline-none font-bold text-sm transition-all"
              />
              <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-primary text-white font-black rounded-2xl text-sm tracking-wide hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-60"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="text-center text-sm font-bold text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/account/signup" className="text-primary hover:underline">Sign up free</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
