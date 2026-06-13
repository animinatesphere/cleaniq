import React, { useState, useEffect } from 'react';
import { 
  Globe, Shield, 
  Save, RefreshCw, Plus, Trash2,
  Sliders, Star, Edit3, X, Check,
  Megaphone, Send, Key, ThumbsUp, ThumbsDown
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
                          <div className="flex flex-col gap-3 w-full max-w-lg">
                            <div className="flex flex-wrap gap-3">
                              <input type="text" value={editServiceData.name} onChange={e => setEditServiceData({...editServiceData, name: e.target.value})} className="p-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm flex-1" placeholder="Name" />
                              <input type="number" value={editServiceData.rate} onChange={e => setEditServiceData({...editServiceData, rate: e.target.value})} className="p-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm w-24" placeholder="Rate" />
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <select value={editServiceData.type} onChange={e => setEditServiceData({...editServiceData, type: e.target.value})} className="p-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs flex-1">
                                <option value="flat">Flat Rate</option>
                                <option value="hourly">Hourly Rate</option>
                              </select>
                              <select value={editServiceData.category} onChange={e => setEditServiceData({...editServiceData, category: e.target.value})} className="p-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs flex-1">
                                <option value="Base">Base</option>
                                <option value="Rooms">Rooms</option>
                                <option value="Extras">Extras</option>
                              </select>
                              <select value={editServiceData.region} onChange={e => setEditServiceData({...editServiceData, region: e.target.value})} className="p-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs flex-1">
                                <option value="UK">UK (GBP)</option>
                                <option value="NG">NG (NGN)</option>
                              </select>
                            </div>
                            <textarea value={editServiceData.description || ''} onChange={e => setEditServiceData({...editServiceData, description: e.target.value})} className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-medium text-xs h-16 w-full resize-none" placeholder="Description..." />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => handleUpdateService(s._id)} className="p-2 px-4 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-1"><Check size={14}/> Save</button>
                              <button onClick={() => setEditingServiceId(null)} className="p-2 px-4 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1"><X size={14}/> Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="font-bold text-primary-dark">{s.name}</p>
                            {s.description && <p className="text-xs text-slate-500 mt-1 mb-2 leading-relaxed">{s.description}</p>}
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.region} • {s.category || 'Extras'} • {s.region === 'UK' ? '£' : '₦'}{s.rate}/{s.type === 'hourly' ? 'hr' : 'flat'}</p>
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

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-primary-dark">Customer Reviews</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Approve or reject submitted reviews</p>
                  </div>
                  <RefreshCw size={18} className={loading ? 'animate-spin text-primary' : 'text-slate-400 cursor-pointer'} onClick={fetchData} />
                </div>
                <div className="p-8 space-y-4">
                  {loading && <p className="text-slate-400 font-bold text-sm">Loading reviews...</p>}
                  {!loading && reviews.length === 0 && (
                    <div className="text-center py-16">
                      <Star size={40} className="text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold">No reviews yet</p>
                      <p className="text-slate-300 text-sm mt-1">Customer reviews will appear here once submitted.</p>
                    </div>
                  )}
                  {reviews.map((review) => (
                    <div key={review._id} className="p-6 rounded-3xl border-2 border-slate-100 bg-white hover:border-slate-200 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-black text-primary-dark text-sm">
                              {(review.customerName || 'A')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-primary-dark text-sm">{review.customerName}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {new Date(review.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex gap-0.5 ml-auto">
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} size={13} className={i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed mb-3">{review.comment}</p>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            review.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                            review.status === 'Rejected' ? 'bg-rose-50 text-rose-500 border border-rose-200' :
                            'bg-amber-50 text-amber-600 border border-amber-200'
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
                              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-xs border border-emerald-200 transition-all"
                            >
                              <ThumbsUp size={13} /> Approve
                            </button>
                          )}
                          {review.status !== 'Rejected' && (
                            <button
                              onClick={() => handleUpdateReviewStatus(review._id, 'Rejected')}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 font-bold text-xs border border-rose-200 transition-all"
                            >
                              <ThumbsDown size={13} /> Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-rose-500 font-bold text-xs border border-slate-200 transition-all"
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
