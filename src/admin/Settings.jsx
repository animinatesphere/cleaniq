import React, { useState, useEffect } from 'react';
import { 
  Globe, Shield, 
  Save, RefreshCw, Plus, Trash2,
  Sliders, Star, Edit3, X, Check,
  Megaphone, Send, Key
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editServiceData, setEditServiceData] = useState({});
  const [newService, setNewService] = useState({ name: '', rate: '', region: 'UK', type: 'Cleaning' });
  const [broadcast, setBroadcast] = useState({ subject: '', message: '' });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
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
    setSendingBroadcast(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/marketing/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcast)
      });
      if (res.ok) {
        alert('Broadcast sent!');
        setBroadcast({ subject: '', message: '' });
      }
    } catch (err) { alert('Failed'); }
    finally { setSendingBroadcast(false); }
  };

  const tabs = [
    { id: 'services', name: 'Services', icon: <Sliders size={18} /> },
    { id: 'marketing', name: 'Marketing', icon: <Megaphone size={18} /> },
    { id: 'reviews', name: 'Reviews', icon: <Star size={18} /> },
    { id: 'security', name: 'Security', icon: <Shield size={18} /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-wrap gap-4 p-2 bg-slate-100 rounded-[28px] w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === tab.id ? 'bg-white text-primary-dark shadow-sm' : 'text-slate-500 hover:text-primary-dark'
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
              <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm">
                <h3 className="text-xl font-black text-primary-dark mb-6">Add Service</h3>
                <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Service Name" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" required />
                  <input type="number" placeholder="Rate" value={newService.rate} onChange={e => setNewService({...newService, rate: e.target.value})} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" required />
                  <select value={newService.region} onChange={e => setNewService({...newService, region: e.target.value})} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold">
                    <option value="UK">UK (GBP)</option>
                    {/* <option value="NG">NG (NGN)</option> */}
                  </select>
                  <button type="submit" className="btn-primary py-4 rounded-2xl font-black uppercase"><Plus size={18} /> Add</button>
                </form>
              </div>

              <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-xl font-black text-primary-dark">Service List</h3>
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} onClick={fetchData} />
                </div>
                <div className="p-8 space-y-4">
                  {services.map((s) => (
                    <div key={s._id} className="p-6 rounded-3xl border border-slate-100 bg-white flex items-center justify-between group">
                      <div className="flex-1">
                        {editingServiceId === s._id ? (
                          <div className="flex flex-wrap gap-3">
                            <input type="text" value={editServiceData.name} onChange={e => setEditServiceData({...editServiceData, name: e.target.value})} className="p-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm" />
                            <input type="number" value={editServiceData.rate} onChange={e => setEditServiceData({...editServiceData, rate: e.target.value})} className="p-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm w-24" />
                            <button onClick={() => handleUpdateService(s._id)} className="p-2 bg-primary text-white rounded-xl"><Check size={18}/></button>
                            <button onClick={() => setEditingServiceId(null)} className="p-2 bg-slate-200 text-slate-600 rounded-xl"><X size={18}/></button>
                          </div>
                        ) : (
                          <div>
                            <p className="font-bold text-primary-dark">{s.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.region} • {s.region === 'UK' ? '£' : '₦'}{s.rate}/hr</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingServiceId(s._id); setEditServiceData(s); }} className="p-3 text-slate-300 hover:text-primary hover:bg-primary/10 rounded-2xl"><Edit3 size={18}/></button>
                        <button onClick={async () => { if(window.confirm('Delete?')){ await fetch(`${import.meta.env.VITE_API_URL}/services/${s._id}`, {method: 'DELETE'}); fetchData(); } }} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl"><Trash2 size={18}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'marketing' && (
            <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-primary-dark">Marketing Broadcast</h3>
              <div className="space-y-4">
                <input type="text" placeholder="Email Subject" value={broadcast.subject} onChange={e => setBroadcast({...broadcast, subject: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" />
                <textarea placeholder="Your Message..." value={broadcast.message} onChange={e => setBroadcast({...broadcast, message: e.target.value})} className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-100 font-bold h-48 resize-none" />
                <button disabled={sendingBroadcast} onClick={handleSendBroadcast} className="w-full py-5 rounded-3xl bg-primary text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50">
                  {sendingBroadcast ? 'Sending...' : <><Send size={20} /> Send Broadcast</>}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center"><Key size={24}/></div>
                <h3 className="text-xl font-black text-primary-dark">Security Settings</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">New Password</label>
                  <input type="password" placeholder="••••••••" value={passwordData.newPassword} onChange={e => setPasswordData({newPassword: e.target.value})} className="w-full p-5 rounded-[24px] border-2 border-slate-100 focus:border-primary focus:outline-none font-bold" />
                </div>
                <button onClick={async () => {
                  const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/change-password`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: localStorage.getItem('adminUser'), newPassword: passwordData.newPassword })
                  });
                  if (res.ok) { alert('Password updated! Logging out...'); localStorage.clear(); window.location.reload(); }
                }} className="btn-primary w-full py-5 rounded-3xl text-sm uppercase font-black tracking-widest">Update Password</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
