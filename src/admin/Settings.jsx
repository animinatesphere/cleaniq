import React, { useState, useEffect } from 'react';
import { 
  Globe, Shield, Bell, 
  CreditCard, Layout, Sliders,
  Save, RefreshCw, Plus, Trash2,
  ToggleLeft, ToggleRight, Star, 
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({ name: '', rate: '', region: 'UK', type: 'Cleaning' });
  const [passwordData, setPasswordData] = useState({ newPassword: '' });

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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
      });
      if (res.ok) {
        setNewService({ name: '', rate: '', region: 'UK', type: 'Cleaning' });
        fetchData();
      }
    } catch (err) { alert('Error adding service'); }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/services/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) { alert('Error deleting'); }
  };

  const handleUpdateReview = async (id, status) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) { alert('Error updating review'); }
  };

  const tabs = [
    { id: 'services', name: 'Services', icon: <Sliders size={18} /> },
    { id: 'reviews', name: 'Reviews', icon: <Star size={18} /> },
    { id: 'security', name: 'Security', icon: <Shield size={18} /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Settings Navigation */}
      <div className="flex flex-wrap gap-4 p-2 bg-slate-100 rounded-[28px] w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === tab.id 
              ? 'bg-white text-primary-dark shadow-sm' 
              : 'text-slate-500 hover:text-primary-dark'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'services' && (
            <div className="space-y-6">
              {/* Add Service Form */}
              <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm">
                <h3 className="text-xl font-black text-primary-dark mb-6">Add New Service</h3>
                <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" placeholder="Service Name (e.g. Deep Clean)"
                    value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold outline-none focus:border-primary"
                    required
                  />
                  <input 
                    type="number" placeholder="Rate (e.g. 15.00)"
                    value={newService.rate} onChange={e => setNewService({...newService, rate: e.target.value})}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold outline-none focus:border-primary"
                    required
                  />
                  <select 
                    value={newService.region} onChange={e => setNewService({...newService, region: e.target.value})}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold outline-none focus:border-primary"
                  >
                    <option value="UK">United Kingdom (GBP)</option>
                    <option value="NG">Nigeria (NGN)</option>
                  </select>
                  <button type="submit" className="btn-primary py-4 rounded-2xl text-sm uppercase tracking-widest font-black shadow-lg shadow-primary/20">
                    <Plus size={18} /> Add Service
                  </button>
                </form>
              </div>

              {/* Service List */}
              <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-xl font-black text-primary-dark">Existing Services</h3>
                  <RefreshCw size={18} className={`text-slate-400 cursor-pointer ${loading ? 'animate-spin' : ''}`} onClick={fetchData} />
                </div>
                <div className="p-8 space-y-4">
                  {services.map((s) => (
                    <div key={s._id} className="p-6 rounded-3xl border border-slate-100 bg-white flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${s.region === 'UK' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          <Globe size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-primary-dark">{s.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.region} • {s.region === 'UK' ? '£' : '₦'}{s.rate}/hr</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteService(s._id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xl font-black text-primary-dark">Manage Reviews</h3>
              </div>
              <div className="p-8 space-y-6">
                {reviews.length === 0 && <p className="text-center py-10 text-slate-400 font-bold uppercase text-xs tracking-widest">No reviews yet</p>}
                {reviews.map((r) => (
                  <div key={r._id} className="p-6 rounded-3xl border border-slate-100 bg-white space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-primary-dark">{r.customerName}</p>
                        <div className="flex gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className={i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                          ))}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        r.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 
                        r.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed italic">"{r.comment}"</p>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => handleUpdateReview(r._id, 'Approved')} className="flex-1 py-3 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">Approve</button>
                      <button onClick={() => handleUpdateReview(r._id, 'Rejected')} className="flex-1 py-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-all">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden p-8">
              <h3 className="text-xl font-black text-primary-dark mb-6">Security Settings</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">New Password</label>
                  <input 
                    type="password" placeholder="••••••••"
                    value={passwordData.newPassword} onChange={e => setPasswordData({newPassword: e.target.value})}
                    className="w-full p-5 rounded-[24px] border-2 border-slate-100 focus:border-primary focus:outline-none font-bold"
                  />
                </div>
                <button 
                  onClick={async () => {
                    const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/change-password`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        username: localStorage.getItem('adminUser'), 
                        newPassword: passwordData.newPassword 
                      })
                    });
                    if (res.ok) {
                      alert('Password updated! Logging out...');
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="btn-primary w-full py-5 rounded-3xl text-sm uppercase font-black tracking-widest shadow-xl shadow-primary/20"
                >
                  Update Password
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="p-8 rounded-[40px] bg-secondary text-primary-dark shadow-xl shadow-secondary/10">
            <h4 className="text-xl font-black mb-4 tracking-tight">System Info</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="opacity-60">Status</span>
                <span className="text-emerald-600 flex items-center gap-2">
                  <CheckCircle2 size={14} /> Operational
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="opacity-60">Database</span>
                <span>Connected</span>
              </div>
              <div className="h-px bg-primary-dark/10" />
              <button className="w-full py-4 rounded-2xl bg-primary-dark text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                <RefreshCw size={16} /> Force Sync
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
