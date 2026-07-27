import React, { useState, useEffect } from 'react';
import {
  Globe, Shield,
  Save, RefreshCw, Plus, Trash2,
  Sliders, Star, Edit3, X, Check,
  Megaphone, Send, Key, ThumbsUp, ThumbsDown,
  UserPlus, Users as UsersIcon, Mail, Smartphone, Eye, EyeOff
} from 'lucide-react';

// Pages a restricted admin account can be granted access to. Dashboard
// (revenue) and Settings are intentionally excluded — never grantable.
const PERMISSION_OPTIONS = [
  { key: 'bookings', label: 'Bookings' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'rota', label: 'Rota' },
  { key: 'quotes', label: 'Quotes' },
  { key: 'services', label: 'Services' },
  { key: 'leads', label: 'Leads' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'recurring', label: 'Recurring' },
  { key: 'email-history', label: 'Email History' },
  { key: 'invoice-builder', label: 'Invoice Builder' },
  { key: 'staff-pay', label: 'Staff Pay' },
  { key: 'payments', label: 'Payment Approvals' },
  { key: 'withdrawals', label: 'Disbursement' },
  { key: 'expenses', label: 'Expense Tracker' },
  { key: 'workers', label: 'Staff' },
  { key: 'applicants', label: 'Applicants' },
  { key: 'customers', label: 'Customers' },
  { key: 'blog', label: 'Blog' },
  { key: 'chat', label: 'Chat Support' },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editServiceData, setEditServiceData] = useState({});
  const [newService, setNewService] = useState({ name: '', rate: '', region: 'UK', type: 'Cleaning' });
  const [broadcast, setBroadcast] = useState({
    subject: '',
    message: '',
    recipientType: 'custom',
    customEmails: '',
  });
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: '' });
  const [newAdmin, setNewAdmin] = useState({ username: '', email: '', password: '', role: 'restricted', permissions: [] });
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminMsg, setAdminMsg] = useState({ type: '', text: '' });
  const [showPricesPublic, setShowPricesPublic] = useState(true);
  const [savingAppSetting, setSavingAppSetting] = useState(false);
  const [appSettingMsg, setAppSettingMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'services') {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/services`);
        setServices(await res.json());
      } else if (activeTab === 'reviews') {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews`);
        setReviews(await res.json());
      } else if (activeTab === 'team') {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/admins`);
        setAdmins(await res.json());
      } else if (activeTab === 'marketing') {
        const [leadsRes, campaignsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/contact/leads`),
          fetch(`${import.meta.env.VITE_API_URL}/marketing/campaigns`),
        ]);
        setLeads(await leadsRes.json());
        setCampaigns(await campaignsRes.json());
      } else if (activeTab === 'app') {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/settings`);
        const all = await res.json();
        const sp = all.find((s) => s.key === 'showPricesPublic');
        setShowPricesPublic(sp ? Boolean(sp.value) : true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAddingAdmin(true);
    setAdminMsg({ type: '', text: '' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin),
      });
      const data = await res.json();
      if (res.ok) {
        setAdminMsg({ type: 'success', text: `Account created${newAdmin.email ? ' — invite email sent' : ''}.` });
        setNewAdmin({ username: '', email: '', password: '', role: 'restricted', permissions: [] });
        fetchData();
      } else {
        setAdminMsg({ type: 'error', text: data.message || 'Failed to create account' });
      }
    } catch (err) {
      setAdminMsg({ type: 'error', text: 'Failed to create account' });
    } finally {
      setAddingAdmin(false);
      setTimeout(() => setAdminMsg({ type: '', text: '' }), 4000);
    }
  };

  const togglePermission = (key) => {
    setNewAdmin((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm('Remove this admin account permanently?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/admins/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) fetchData();
      else setAdminMsg({ type: 'error', text: data.message || 'Failed to delete account' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateService = async (id) => {
    try {
      // Use PUT /:id for a clean, ID-based update — avoids creating duplicates
      const res = await fetch(`${import.meta.env.VITE_API_URL}/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editServiceData.name.trim(),
          rate: editServiceData.rate,
          type: editServiceData.type,
          region: editServiceData.region,
          category: editServiceData.category,
          description: editServiceData.description
        })
      });
      if (res.ok) {
        setEditingServiceId(null);
        fetchData();
      } else {
        alert('Error updating service');
      }
    } catch (err) { alert('Error updating'); }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newService, name: newService.name.trim(), category: newService.category || 'Extras' })
      });
      if (res.ok) {
        setNewService({ name: '', rate: '', region: 'UK', type: 'Cleaning', category: 'Extras' });
        fetchData();
      }
    } catch (err) { alert('Error adding'); }
  };

  const handleSendBroadcast = async () => {
    if (!broadcast.subject || !broadcast.message) return alert('Please fill in both fields');
    if (broadcast.recipientType === 'custom' && !broadcast.customEmails.trim()) {
      return alert('Please enter at least one recipient email.');
    }
    setSendingBroadcast(true);
    try {
      const recipients =
        broadcast.recipientType === 'custom'
          ? broadcast.customEmails
              .split(/[\n,]+/)
              .map((e) => e.trim())
              .filter(Boolean)
          : [];
      const res = await fetch(`${import.meta.env.VITE_API_URL}/marketing/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: broadcast.subject,
          message: broadcast.message,
          recipientType: broadcast.recipientType,
          recipients,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Campaign sent!');
        setBroadcast({ subject: '', message: '', recipientType: 'custom', customEmails: '' });
        fetchData();
      } else {
        alert(data.message || 'Failed to send campaign.');
      }
    } catch (err) { alert('Failed to send campaign.'); }
    finally { setSendingBroadcast(false); }
  };

  const handleUpdateReviewStatus = async (id, status) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleSaveAppSetting = async (key, value) => {
    setSavingAppSetting(true);
    setAppSettingMsg({ type: '', text: '' });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setAppSettingMsg({ type: 'success', text: 'Setting saved.' });
      } else {
        setAppSettingMsg({ type: 'error', text: 'Failed to save setting.' });
      }
    } catch {
      setAppSettingMsg({ type: 'error', text: 'Failed to save setting.' });
    } finally {
      setSavingAppSetting(false);
      setTimeout(() => setAppSettingMsg({ type: '', text: '' }), 3000);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/reviews/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const tabs = [
    { id: 'services', name: 'Services', icon: <Sliders size={18} /> },
    { id: 'marketing', name: 'Marketing', icon: <Megaphone size={18} /> },
    { id: 'reviews', name: 'Reviews', icon: <Star size={18} /> },
    { id: 'team', name: 'Team Access', icon: <UsersIcon size={18} /> },
    { id: 'app', name: 'App Settings', icon: <Smartphone size={18} /> },
    { id: 'security', name: 'Security', icon: <Shield size={18} /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-wrap gap-1 p-1.5 bg-white/[0.03] border border-white/[0.07] rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-sm'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab.icon} {tab.name}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl p-8">
                <h3 className="text-base font-bold text-white mb-6">Add Service</h3>
                <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Service Name" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none font-bold" required />
                  <input type="number" placeholder="Rate" value={newService.rate} onChange={e => setNewService({...newService, rate: e.target.value})} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none font-bold" required />
                  <select value={newService.region} onChange={e => setNewService({...newService, region: e.target.value})} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-emerald-500/50 focus:outline-none font-bold">
                    <option value="UK">UK (GBP)</option>
                    {/* <option value="NG">NG (NGN)</option> */}
                  </select>
                  <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl py-4 font-bold uppercase flex items-center justify-center gap-2 transition-all"><Plus size={18} /> Add</button>
                </form>
              </div>

              <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl overflow-hidden">
                <div className="p-8 border-b border-white/[0.07] bg-[#071D16] flex justify-between items-center">
                  <h3 className="text-base font-bold text-white">Service List</h3>
                  <RefreshCw size={18} className={`cursor-pointer text-white/40 ${loading ? 'animate-spin' : ''}`} onClick={fetchData} />
                </div>
                <div className="p-8 space-y-4">
                  {services.map((s) => (
                    <div key={s._id} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.03] flex items-center justify-between group hover:bg-white/[0.04] transition-colors">
                      <div className="flex-1">
                        {editingServiceId === s._id ? (
                          <div className="flex flex-col gap-3 w-full max-w-lg">
                            <div className="flex flex-wrap gap-3">
                              <input type="text" value={editServiceData.name} onChange={e => setEditServiceData({...editServiceData, name: e.target.value})} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm flex-1 focus:border-emerald-500/50 focus:outline-none" placeholder="Name" />
                              <input type="number" value={editServiceData.rate} onChange={e => setEditServiceData({...editServiceData, rate: e.target.value})} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm w-24 focus:border-emerald-500/50 focus:outline-none" placeholder="Rate" />
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <select value={editServiceData.type} onChange={e => setEditServiceData({...editServiceData, type: e.target.value})} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs flex-1 focus:border-emerald-500/50 focus:outline-none">
                                <option value="flat">Flat Rate</option>
                                <option value="hourly">Hourly Rate</option>
                              </select>
                              <select value={editServiceData.category} onChange={e => setEditServiceData({...editServiceData, category: e.target.value})} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs flex-1 focus:border-emerald-500/50 focus:outline-none">
                                <option value="Base">Base</option>
                                <option value="Rooms">Rooms</option>
                                <option value="Extras">Extras</option>
                              </select>
                              <select value={editServiceData.region} onChange={e => setEditServiceData({...editServiceData, region: e.target.value})} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs flex-1 focus:border-emerald-500/50 focus:outline-none">
                                <option value="UK">UK (GBP)</option>
                                <option value="NG">NG (NGN)</option>
                              </select>
                            </div>
                            <textarea value={editServiceData.description || ''} onChange={e => setEditServiceData({...editServiceData, description: e.target.value})} className="p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 font-medium text-xs h-16 w-full resize-none focus:border-emerald-500/50 focus:outline-none" placeholder="Description..." />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => handleUpdateService(s._id)} className="p-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"><Check size={14}/> Save</button>
                              <button onClick={() => setEditingServiceId(null)} className="p-2 px-4 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"><X size={14}/> Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="font-bold text-white">{s.name}</p>
                            {s.description && <p className="text-xs text-white/40 mt-1 mb-2 leading-relaxed">{s.description}</p>}
                            <p className="text-[11px] font-semibold text-white/40">{s.region} • {s.category || 'Extras'} • {s.region === 'UK' ? '£' : '₦'}{s.rate}/{s.type === 'hourly' ? 'hr' : 'flat'}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingServiceId(s._id); setEditServiceData(s); }} className="p-3 text-white/25 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-2xl transition-all"><Edit3 size={18}/></button>
                        <button onClick={async () => { if(window.confirm('Delete?')){ await fetch(`${import.meta.env.VITE_API_URL}/services/${s._id}`, {method: 'DELETE'}); fetchData(); } }} className="p-3 text-white/25 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all"><Trash2 size={18}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'marketing' && (
            <div className="space-y-6">
              <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl p-8 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white">Send Email Campaign</h3>
                  <p className="text-sm text-white/40 font-medium mt-1">Send to anyone, anytime — pick a recipient group or paste your own list.</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-white/40 mb-2">Recipients</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'custom', label: 'Custom List' },
                      { id: 'all', label: 'All Customers' },
                      { id: 'leads', label: `Leads (${leads.length})` },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setBroadcast({ ...broadcast, recipientType: opt.id })}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all ${broadcast.recipientType === opt.id ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-white/5 text-white/40 border-white/10 hover:border-emerald-500/30'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {broadcast.recipientType === 'custom' && (
                  <textarea
                    placeholder="Paste email addresses — separated by commas or one per line"
                    value={broadcast.customEmails}
                    onChange={e => setBroadcast({...broadcast, customEmails: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none font-medium text-sm h-24 resize-none transition-all"
                  />
                )}

                <input type="text" placeholder="Email Subject" value={broadcast.subject} onChange={e => setBroadcast({...broadcast, subject: e.target.value})} className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none font-bold" />
                <textarea placeholder="Your Message..." value={broadcast.message} onChange={e => setBroadcast({...broadcast, message: e.target.value})} className="w-full p-6 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none font-bold h-48 resize-none" />
                <button disabled={sendingBroadcast} onClick={handleSendBroadcast} className="w-full py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all">
                  {sendingBroadcast ? 'Sending...' : <><Send size={20} /> Send Campaign</>}
                </button>
              </div>

              <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/[0.07]">
                  <h3 className="text-base font-bold text-white">Recent Campaigns</h3>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {campaigns.length === 0 ? (
                    <p className="text-white/40 font-medium text-sm text-center py-10">No campaigns sent yet.</p>
                  ) : (
                    campaigns.map((c) => (
                      <div key={c._id} className="p-5 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors">
                        <div className="min-w-0">
                          <p className="font-semibold text-white/80 text-sm truncate">{c.subject}</p>
                          <p className="text-[11px] text-white/40 font-medium mt-0.5">
                            {new Date(c.sentAt).toLocaleString('en-GB')} · {c.recipientType}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 rounded-full flex-shrink-0">
                          {c.recipientCount} sent
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl overflow-hidden">
                <div className="p-8 border-b border-white/[0.07] bg-[#071D16] flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-white">Customer Reviews</h3>
                    <p className="text-[11px] font-semibold text-white/40 mt-1">Approve or reject submitted reviews</p>
                  </div>
                  <RefreshCw size={18} className={`cursor-pointer text-white/40 ${loading ? 'animate-spin text-emerald-400' : ''}`} onClick={fetchData} />
                </div>
                <div className="p-8 space-y-4">
                  {loading && <p className="text-white/40 font-bold text-sm">Loading reviews...</p>}
                  {!loading && reviews.length === 0 && (
                    <div className="text-center py-16">
                      <Star size={40} className="text-white/[0.12] mx-auto mb-4" />
                      <p className="text-white/40 font-bold">No reviews yet</p>
                      <p className="text-white/25 text-sm mt-1">Customer reviews will appear here once submitted.</p>
                    </div>
                  )}
                  {reviews.map((review) => (
                    <div key={review._id} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.04] transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center font-bold text-emerald-400 text-sm">
                              {(review.customerName || 'A')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm">{review.customerName}</p>
                              <p className="text-[11px] font-semibold text-white/40">
                                {new Date(review.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex gap-0.5 ml-auto">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} size={13} className={i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-white/[0.12]'} />
                              ))}
                            </div>
                          </div>
                          <p className="text-white/80 text-sm leading-relaxed mb-3">{review.comment}</p>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                            review.status === 'Approved' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                            review.status === 'Rejected' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25' :
                            'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          }`}>
                            {review.status === 'Approved' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                            {review.status === 'Rejected' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                            {review.status === 'Pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                            {review.status}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {review.status !== 'Approved' && (
                            <button
                              onClick={() => handleUpdateReviewStatus(review._id, 'Approved')}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 font-bold text-xs border border-emerald-500/25 transition-all"
                            >
                              <ThumbsUp size={13} /> Approve
                            </button>
                          )}
                          {review.status !== 'Rejected' && (
                            <button
                              onClick={() => handleUpdateReviewStatus(review._id, 'Rejected')}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 font-bold text-xs border border-rose-500/25 transition-all"
                            >
                              <ThumbsDown size={13} /> Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/5 text-white/40 hover:bg-rose-500/15 hover:text-rose-400 font-bold text-xs border border-white/10 transition-all"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6">
              {adminMsg.text && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${adminMsg.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' : 'bg-rose-500/15 border-rose-500/25 text-rose-400'}`}>
                  <p className="text-sm font-semibold">{adminMsg.text}</p>
                </div>
              )}

              <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl p-8">
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2"><UserPlus size={18} className="text-emerald-400" /> Add Team Member</h3>
                <p className="text-sm text-white/40 font-medium mb-6">Create a restricted account and choose exactly which pages it can access. Revenue (Dashboard) and Settings are never accessible to restricted accounts.</p>
                <form onSubmit={handleAddAdmin} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Username" value={newAdmin.username} onChange={e => setNewAdmin({...newAdmin, username: e.target.value})} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none font-medium text-sm transition-all" required />
                    <input type="email" placeholder="Email (for login invite)" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none font-medium text-sm transition-all" />
                    <input type="password" placeholder="Temporary Password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none font-medium text-sm transition-all" required />
                    <select value={newAdmin.role} onChange={e => setNewAdmin({...newAdmin, role: e.target.value})} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-emerald-500/50 focus:outline-none font-medium text-sm transition-all">
                      <option value="restricted">Restricted (choose pages below)</option>
                      <option value="superadmin">Superadmin (Full access)</option>
                    </select>
                  </div>

                  {newAdmin.role === 'restricted' && (
                    <div>
                      <p className="text-[11px] font-semibold text-white/40 mb-2">Pages this account can access</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {PERMISSION_OPTIONS.map((opt) => (
                          <button
                            type="button"
                            key={opt.key}
                            onClick={() => togglePermission(opt.key)}
                            className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${newAdmin.permissions.includes(opt.key) ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shadow-sm' : 'bg-white/5 text-white/40 border-white/10 hover:border-emerald-500/30'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={addingAdmin} className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {addingAdmin ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                    {addingAdmin ? 'Creating…' : 'Create Account'}
                  </button>
                </form>
              </div>

              <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/[0.07] flex justify-between items-center">
                  <h3 className="text-base font-bold text-white">Team Members</h3>
                  <RefreshCw size={16} className={`cursor-pointer text-white/40 ${loading ? 'animate-spin text-emerald-400' : ''}`} onClick={fetchData} />
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {loading && <p className="text-white/40 font-medium text-sm p-6">Loading…</p>}
                  {!loading && admins.length === 0 && (
                    <p className="text-white/40 font-medium text-sm text-center py-10">No team accounts yet.</p>
                  )}
                  {admins.map((a) => (
                    <div key={a._id} className="p-5 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {a.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white/80 text-sm">{a.username}</p>
                          {a.email && <p className="text-[11px] text-white/40 font-medium truncate flex items-center gap-1"><Mail size={10}/> {a.email}</p>}
                          {a.role === 'restricted' && a.permissions?.length > 0 && (
                            <p className="text-[10px] text-white/40 font-medium mt-1 truncate">
                              Access: {a.permissions.map(p => PERMISSION_OPTIONS.find(o => o.key === p)?.label || p).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border ${a.role === 'superadmin' ? 'bg-white/10 text-white/60 border-white/10' : 'bg-amber-500/15 text-amber-400 border-amber-500/25'}`}>
                          {a.role === 'superadmin' ? 'Superadmin' : 'Restricted'}
                        </span>
                        <button onClick={() => handleDeleteAdmin(a._id)} className="p-2 rounded-xl bg-white/5 text-white/40 hover:bg-rose-500/15 hover:text-rose-400 transition-all"><Trash2 size={15}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'app' && (
            <div className="space-y-6">
              {appSettingMsg.text && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${appSettingMsg.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' : 'bg-rose-500/15 border-rose-500/25 text-rose-400'}`}>
                  <p className="text-sm font-semibold">{appSettingMsg.text}</p>
                </div>
              )}

              <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Customer App Settings</h3>
                    <p className="text-sm text-white/40 font-medium mt-0.5">Control what guest users see in the app — no app update needed.</p>
                  </div>
                </div>

                <div className="border border-white/[0.07] rounded-2xl p-6 flex items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${showPricesPublic ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.06] text-white/30'}`}>
                      {showPricesPublic ? <Eye size={20} /> : <EyeOff size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">Show Prices to Guest Users</p>
                      <p className="text-xs text-white/40 font-medium mt-1 leading-relaxed">
                        When <span className="text-emerald-400 font-semibold">ON</span> — everyone sees service prices, including users who haven't signed up.<br />
                        When <span className="text-rose-400 font-semibold">OFF</span> — prices are hidden from guests. Only logged-in customers see them.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      const newVal = !showPricesPublic;
                      setShowPricesPublic(newVal);
                      await handleSaveAppSetting('showPricesPublic', newVal);
                    }}
                    disabled={savingAppSetting}
                    className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-all duration-300 focus:outline-none disabled:opacity-60 ${showPricesPublic ? 'bg-emerald-500' : 'bg-white/[0.12]'}`}
                  >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${showPricesPublic ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                <p className="text-[11px] text-white/30 font-medium leading-relaxed">
                  This setting takes effect immediately. The app reads it from the server on each launch — no build or update required.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-[#0B2D22] border border-white/[0.07] rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center"><Key size={24}/></div>
                <h3 className="text-base font-bold text-white">Security Settings</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-white/40 ml-4">New Password</label>
                  <input type="password" placeholder="••••••••" value={passwordData.newPassword} onChange={e => setPasswordData({newPassword: e.target.value})} className="w-full p-5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-emerald-500/50 focus:outline-none font-bold" />
                </div>
                <button onClick={async () => {
                  const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/change-password`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: localStorage.getItem('adminUser'), newPassword: passwordData.newPassword })
                  });
                  if (res.ok) { alert('Password updated! Logging out...'); localStorage.clear(); window.location.reload(); }
                }} className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl w-full py-5 text-sm font-bold transition-all">Update Password</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
