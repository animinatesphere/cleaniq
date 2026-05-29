import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import logoImg from '../../assets/logo DP.jpg';

export default function CustomerSignup() {
  const { register } = useCustomerAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, password: form.password });
      navigate('/account/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Weak', color: 'bg-rose-400', width: 'w-1/4' };
    if (p.length < 10) return { label: 'Fair', color: 'bg-amber-400', width: 'w-2/4' };
    return { label: 'Strong', color: 'bg-emerald-400', width: 'w-full' };
  };
  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-start sm:items-center justify-center px-4 pt-36 sm:py-20">
      <Helmet>
        <title>Create Account — Cleaniq Services</title>
        <meta name="description" content="Sign up for a Cleaniq account to track your bookings, chat with admin and manage your cleaning schedule." />
      </Helmet>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src={logoImg} alt="Cleaniq logo" className="h-16 w-auto object-contain rounded-2xl shadow-md border border-slate-100" />
          </Link>
          <h1 className="text-3xl font-extrabold text-primary-dark tracking-tight">Create your account</h1>
          <p className="text-slate-400 font-bold text-sm mt-2">Track bookings, chat with admin, and more</p>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          {error && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl p-4 mb-6">
              <AlertCircle size={18} className="shrink-0" />
              <p className="font-bold text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={16} />
                <input id="signup-firstname" type="text" placeholder="First name" required value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })}
                  className="w-full pl-10 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 outline-none font-bold text-sm transition-all" />
              </div>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={16} />
                <input id="signup-lastname" type="text" placeholder="Last name" required value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })}
                  className="w-full pl-10 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 outline-none font-bold text-sm transition-all" />
              </div>
            </div>

            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
              <input id="signup-email" type="email" placeholder="Email address" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full pl-12 pr-5 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 outline-none font-bold text-sm transition-all" />
            </div>

            <div className="relative group">
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
              <input id="signup-phone" type="tel" placeholder="Phone number (optional)" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full pl-12 pr-5 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 outline-none font-bold text-sm transition-all" />
            </div>

            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
              <input id="signup-password" type={showPass ? 'text' : 'password'} placeholder="Password (min 8 chars)" required value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full pl-12 pr-14 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 outline-none font-bold text-sm transition-all" />
              <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password strength bar */}
            {strength && (
              <div className="space-y-1">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${strength.color} ${strength.width}`} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{strength.label}</p>
              </div>
            )}

            <div className="relative group">
              <CheckCircle2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
              <input id="signup-confirm" type={showPass ? 'text' : 'password'} placeholder="Confirm password" required value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                className="w-full pl-12 pr-5 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 outline-none font-bold text-sm transition-all" />
            </div>

            <button id="signup-submit" type="submit" disabled={loading}
              className="w-full py-5 bg-primary text-white font-black rounded-2xl text-sm tracking-wide hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-60">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm font-bold text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/account/login" className="text-primary hover:underline">Log in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
