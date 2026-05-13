import React, { useState, useEffect } from 'react';
import { 
  Globe, Shield, 
  Save, RefreshCw, Plus, Trash2,
  Sliders, Star, Edit3, X, Check,
  Megaphone, Send, Mail
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
        alert('Broadcast sent successfully to all customers!');
        setBroadcast({ subject: '', message: '' });
      }
    } catch (err) { alert('Failed to send broadcast'); }
    finally { setSendingBroadcast(false); }
  };

  // ... (Other functions remain same)
  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
      });
      if (res.ok) { fetchData(); setNewService({ name: '', rate: '', region: 'UK' }); }
    } catch (err) { alert('Error adding'); }
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
          {activeTab === 'marketing' && (
            <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Megaphone size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-primary-dark">Broadcast Center</h3>
                  <p className="text-sm text-slate-500">Send an email to all registered customers</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Subject</label>
                  <input 
                    type="text" placeholder="e.g. New Year Special Discount!"
                    value={broadcast.subject} onChange={e => setBroadcast({...broadcast, subject: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Message</label>
                  <textarea 
                    placeholder="Type your announcement here..."
                    value={broadcast.message} onChange={e => setBroadcast({...broadcast, message: e.target.value})}
                    className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-100 font-bold h-48 resize-none"
                  />
                </div>
                <button 
                  disabled={sendingBroadcast}
                  onClick={handleSendBroadcast}
                  className="w-full py-5 rounded-3xl bg-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {sendingBroadcast ? 'Sending...' : <><Send size={20} /> Send Broadcast Now</>}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm">
                <h3 className="text-xl font-black text-primary-dark mb-6 text-center">Manage Services</h3>
                <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Service Name" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" required />
                  <input type="number" placeholder="Rate" value={newService.rate} onChange={e => setNewService({...newService, rate: e.target.value})} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold" required />
                  <button type="submit" className="btn-primary col-span-full py-4 rounded-2xl font-black uppercase"><Plus size={18} /> Add Service</button>
                </form>
              </div>
              {/* Service List UI... */}
              <div className="space-y-4">
                {services.map(s => (
                  <div key={s._id} className="p-6 bg-white border border-slate-200 rounded-3xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-primary-dark">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.region} • {s.region === 'UK' ? '£' : '₦'}{s.rate}</p>
                    </div>
                    <button onClick={async () => { if(window.confirm('Delete?')){ await fetch(`${import.meta.env.VITE_API_URL}/services/${s._id}`, {method: 'DELETE'}); fetchData(); } }} className="p-3 text-rose-400 hover:bg-rose-50 rounded-xl"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm">
              <h3 className="text-xl font-black text-primary-dark mb-6">Moderation</h3>
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r._id} className="p-6 border border-slate-100 rounded-3xl">
                    <p className="font-bold">{r.customerName}</p>
                    <p className="text-sm text-slate-500 italic mb-4">"{r.comment}"</p>
                    <div className="flex gap-2">
                      <button onClick={async () => { await fetch(`${import.meta.env.VITE_API_URL}/reviews/${r._id}`, {method: 'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:'Approved'})}); fetchData(); }} className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs">Approve</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
