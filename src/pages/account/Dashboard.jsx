import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Calendar, Clock, MapPin, User, MessageCircle, LogOut,
  CheckCircle2, XCircle, AlertCircle, ChevronRight, Send,
  RefreshCw, Trash2, UserCheck, Package, X, Ban
} from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useRegion } from '../../context/RegionContext';

const API = import.meta.env.VITE_API_URL;

const STATUS_STYLES = {
  Confirmed:    'bg-emerald-50 text-emerald-600 border-emerald-100',
  Cancelled:    'bg-rose-50 text-rose-600 border-rose-100',
  Completed:    'bg-blue-50 text-blue-600 border-blue-100',
  'In Progress':'bg-amber-50 text-amber-600 border-amber-100',
  Pending:      'bg-slate-50 text-slate-500 border-slate-100',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CustomerDashboard() {
  const { customer, logout, authFetch } = useCustomerAuth();
  const { region } = useRegion();
  const navigate = useNavigate();

  const [tab, setTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState('');
  const [cancelModal, setCancelModal] = useState(null); // booking to cancel
  const [successToast, setSuccessToast] = useState('');

  // Chat state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatEndRef = useRef(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!customer) navigate('/account/login');
  }, [customer, navigate]);

  // Fetch bookings
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await authFetch(`${API}/customer-bookings`);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (customer) fetchBookings();
  }, [customer]);

  // Fetch messages for selected booking
  const fetchMessages = async (bookingId) => {
    setLoadingMessages(true);
    try {
      const res = await authFetch(`${API}/customer-chat/${bookingId}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedBooking) fetchMessages(selectedBooking.bookingId);
  }, [selectedBooking]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll messages every 8 seconds when chat is open
  useEffect(() => {
    if (!selectedBooking) return;
    const interval = setInterval(() => fetchMessages(selectedBooking.bookingId), 8000);
    return () => clearInterval(interval);
  }, [selectedBooking]);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleCancel = async () => {
    const booking = cancelModal;
    if (!booking) return;
    setCancelModal(null);
    setCancellingId(booking._id);
    setCancelError('');
    try {
      const res = await authFetch(`${API}/customer-bookings/${booking._id}/cancel`, { method: 'PUT' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchBookings();
      setSuccessToast(`Booking #${booking.bookingId} has been cancelled successfully.`);
      setTimeout(() => setSuccessToast(''), 5000);
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgText.trim() || !selectedBooking) return;
    setSendingMsg(true);
    try {
      const res = await authFetch(`${API}/customer-chat/${selectedBooking.bookingId}`, {
        method: 'POST',
        body: JSON.stringify({ text: msgText.trim() })
      });
      if (res.ok) {
        setMsgText('');
        await fetchMessages(selectedBooking.bookingId);
      }
    } finally {
      setSendingMsg(false);
    }
  };

  const canCancel = (b) => {
    return b.status === 'Confirmed' || b.status === 'Pending';
  };

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-32 pb-20">
      <Helmet>
        <title>My Dashboard — Cleaniq Services</title>
        <meta name="description" content="Manage your Cleaniq bookings, cancel orders and chat with admin from your personal dashboard." />
      </Helmet>

      {/* ---- SUCCESS TOAST ---- */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-600/30 font-bold text-sm max-w-sm w-[90%]"
          >
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{successToast}</span>
            <button onClick={() => setSuccessToast('')} className="ml-auto opacity-70 hover:opacity-100"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- CANCEL CONFIRMATION MODAL ---- */}
      <AnimatePresence>
        {cancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setCancelModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Ban size={32} className="text-rose-500" />
              </div>
              <h2 className="text-xl font-extrabold text-primary-dark text-center mb-2">Cancel this booking?</h2>
              <p className="text-slate-500 font-bold text-sm text-center mb-1">{cancelModal.service}</p>
              <p className="text-slate-300 font-bold text-xs text-center mb-6">
                #{cancelModal.bookingId} &bull; {formatDate(cancelModal.schedule?.date)}
              </p>
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6">
                <p className="text-rose-600 font-bold text-sm text-center">
                  ⚠️ This action cannot be undone. Your booking will be permanently cancelled.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelModal(null)}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-slate-100 text-slate-500 font-black text-sm hover:bg-slate-50 transition-all"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3.5 rounded-2xl bg-rose-500 text-white font-black text-sm hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/30 transition-all"
                >
                  Yes, Cancel It
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-primary-dark tracking-tight">
              Hey, {customer.firstName}! 👋
            </h1>
            <p className="text-slate-400 font-bold text-sm mt-1">{customer.email}</p>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-rose-500 font-bold text-sm transition-colors">
            <LogOut size={16} /> Log out
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: bookings.length, icon: <Package size={18} />, color: 'text-primary bg-primary/5' },
            { label: 'Confirmed', value: bookings.filter(b => b.status === 'Confirmed').length, icon: <CheckCircle2 size={18} />, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Completed', value: bookings.filter(b => b.status === 'Completed').length, icon: <UserCheck size={18} />, color: 'text-blue-600 bg-blue-50' },
            { label: 'Cancelled', value: bookings.filter(b => b.status === 'Cancelled').length, icon: <XCircle size={18} />, color: 'text-rose-500 bg-rose-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-black text-primary-dark">{stat.value}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-fit">
          {[
            { id: 'bookings', label: 'My Bookings', icon: <Calendar size={14} /> },
            { id: 'chat', label: 'Messages', icon: <MessageCircle size={14} /> },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all ${tab === t.id ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-primary'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ---- BOOKINGS TAB ---- */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            {cancelError && (
              <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl p-4">
                <AlertCircle size={16} className="shrink-0" /> <p className="font-bold text-sm">{cancelError}</p>
              </div>
            )}

            {loadingBookings ? (
              <div className="text-center py-20">
                <RefreshCw size={32} className="text-primary mx-auto animate-spin mb-4" />
                <p className="font-bold text-slate-400">Loading your bookings…</p>
              </div>
            ) : bookings.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar size={28} className="text-slate-300" />
                </div>
                <h3 className="font-extrabold text-primary-dark text-lg mb-2">No bookings yet</h3>
                <p className="text-slate-400 font-bold text-sm mb-6">
                  Your booking history will appear here once you book a cleaning.
                </p>
                <Link to="/booking"
                  className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-black text-sm hover:shadow-lg hover:shadow-primary/30 transition-all">
                  Book a Clean <ChevronRight size={16} />
                </Link>
              </motion.div>
            ) : (
              bookings.map((b, i) => (
                <motion.div key={b._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Left info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_STYLES[b.status] || STATUS_STYLES.Pending}`}>
                          {b.status}
                        </span>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{b.bookingId}</span>
                      </div>

                      <h3 className="font-extrabold text-primary-dark text-lg tracking-tight">{b.service}</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                          <Calendar size={14} className="text-primary" />
                          {formatDate(b.schedule?.date)}
                        </div>
                        {b.schedule?.timeSlot && (
                          <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                            <Clock size={14} className="text-primary" /> {b.schedule.timeSlot}
                          </div>
                        )}
                        {b.details?.address && (
                          <div className="flex items-center gap-2 text-sm text-slate-500 font-bold sm:col-span-2">
                            <MapPin size={14} className="text-primary shrink-0" />
                            <span className="truncate">{b.details.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Assigned cleaner */}
                      {b.assignedWorkerName && (
                        <div className="flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3 w-fit">
                          <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                            <User size={14} className="text-white" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Your Cleaner</p>
                            <p className="font-black text-primary-dark text-sm">{b.assignedWorkerName}</p>
                          </div>
                        </div>
                      )}

                      {/* Amount */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Paid:</span>
                        <span className="font-black text-primary-dark">{region.symbol}{b.payment?.amount}</span>
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <button onClick={() => { setTab('chat'); setSelectedBooking(b); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-primary/20 text-primary font-black text-xs hover:bg-primary/5 transition-all">
                        <MessageCircle size={14} /> Chat
                      </button>
                      {canCancel(b) && (
                        <button onClick={() => setCancelModal(b)} disabled={cancellingId === b._id}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-rose-100 text-rose-500 font-black text-xs hover:bg-rose-50 transition-all disabled:opacity-50">
                          <Trash2 size={14} /> {cancellingId === b._id ? 'Cancelling…' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* ---- CHAT TAB ---- */}
        {tab === 'chat' && (
          <div className="grid md:grid-cols-3 gap-6 h-[600px]">
            {/* Booking list (left sidebar) */}
            <div className="md:col-span-1 bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select a booking</p>
              </div>
              <div className="overflow-y-auto flex-1">
                {bookings.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 font-bold text-sm">No bookings to chat about.</div>
                ) : (
                  bookings.map(b => (
                    <button key={b._id} onClick={() => setSelectedBooking(b)}
                      className={`w-full text-left p-4 border-b border-slate-50 transition-all hover:bg-slate-50 ${selectedBooking?._id === b._id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}>
                      <p className="font-black text-primary-dark text-sm truncate">{b.service}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{formatDate(b.schedule?.date)} • #{b.bookingId}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${STATUS_STYLES[b.status] || STATUS_STYLES.Pending}`}>
                        {b.status}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat window (right) */}
            <div className="md:col-span-2 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
              {!selectedBooking ? (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle size={28} className="text-slate-300" />
                    </div>
                    <p className="font-extrabold text-primary-dark mb-2">Select a booking to chat</p>
                    <p className="text-slate-400 font-bold text-sm">Choose from the list on the left to start a conversation with our team.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <MessageCircle size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-extrabold text-primary-dark text-sm">{selectedBooking.service}</p>
                      <p className="text-[10px] font-bold text-slate-400">#{selectedBooking.bookingId} • {formatDate(selectedBooking.schedule?.date)}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {loadingMessages ? (
                      <div className="text-center py-10">
                        <RefreshCw size={24} className="text-primary mx-auto animate-spin mb-2" />
                        <p className="font-bold text-slate-400 text-sm">Loading messages…</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-10">
                        <MessageCircle size={28} className="text-slate-200 mx-auto mb-3" />
                        <p className="font-bold text-slate-400 text-sm">No messages yet. Say hello!</p>
                      </div>
                    ) : (
                      messages.map(m => (
                        <div key={m._id} className={`flex ${m.senderType === 'Customer' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${m.senderType === 'Customer' ? 'bg-primary text-white rounded-br-sm' : 'bg-slate-100 text-primary-dark rounded-bl-sm'}`}>
                            {m.senderType === 'Admin' && (
                              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{m.senderName}</p>
                            )}
                            <p className="font-bold text-sm leading-relaxed">{m.text}</p>
                            <p className={`text-[9px] font-bold mt-1 opacity-60 ${m.senderType === 'Customer' ? 'text-white' : 'text-slate-500'}`}>
                              {new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Message input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 flex gap-3">
                    <input value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Type a message…"
                      className="flex-1 py-3 px-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-primary/30 outline-none font-bold text-sm transition-all" />
                    <button type="submit" disabled={sendingMsg || !msgText.trim()}
                      className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 shrink-0">
                      <Send size={16} />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
