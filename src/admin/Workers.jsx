import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, Search, 
  MoreVertical, Edit3, Trash2, ShieldCheck, 
  X, Copy, CheckCircle2, AlertCircle, Eye,
  Smartphone
} from 'lucide-react';
import { useRegion } from '../context/RegionContext';

const Workers = () => {
  const { region } = useRegion();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [newCredentials, setNewCredentials] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    region: region.id
  });

  const fetchWorkers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/workers`);
      const data = await response.json();
      setWorkers(data);
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [region]);

  const handleAddWorker = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (response.ok) {
        setWorkers([data, ...workers]);
        setShowAddModal(false);
        setNewCredentials({ email: data.email, tempPassword: data.tempPassword });
        setShowCredsModal(true);
        setFormData({ firstName: '', lastName: '', email: '', phone: '', region: region.id });
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error adding worker:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this worker?')) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/workers/${id}`, { method: 'DELETE' });
        setWorkers(workers.filter(w => w._id !== id));
      } catch (error) {
        console.error('Error deleting worker:', error);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredWorkers = workers.filter(w => 
    w.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary-dark tracking-tight">Worker Management</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage your cleaning staff and app access</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-all"
        >
          <Plus size={16} /> Add Worker
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center"><Briefcase size={24} /></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Staff</p><p className="text-2xl font-black text-primary-dark">{workers.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center"><ShieldCheck size={24} /></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active (App Access)</p><p className="text-2xl font-black text-primary-dark">{workers.filter(w => w.status === 'Active' || w.appAccessGranted).length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center"><AlertCircle size={24} /></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Setup</p><p className="text-2xl font-black text-primary-dark">{workers.filter(w => w.status === 'Pending').length}</p></div>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <h2 className="text-lg font-black text-primary-dark">Staff Directory</h2>
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 focus-within:border-primary/50 transition-all w-full md:w-80 shadow-sm">
            <Search size={18} className="text-slate-400" />
            <input type="text" placeholder="Search staff..." className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-700" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Worker ID & Name</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status & Region</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-bold">Loading staff...</td></tr>
              ) : filteredWorkers.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-bold">No staff found.</td></tr>
              ) : (
                filteredWorkers.map((w) => (
                  <tr key={w._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black uppercase text-sm shrink-0">
                          {w.firstName[0]}{w.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-primary-dark">{w.firstName} {w.lastName}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase">{w.workerId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <p className="font-bold text-sm text-slate-600">{w.email}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{w.phone}</p>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest mb-1
                        ${w.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                          w.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                          'bg-rose-50 text-rose-600 border border-rose-100'}
                      `}>
                        {w.status}
                      </span>
                      <p className="text-xs font-black text-slate-400 mt-1">Region: {w.region}</p>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-1 text-sm font-black text-secondary">
                        <span className="text-primary-dark">⭐ {w.rating}</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase mt-1">{w.jobsCompleted} Jobs</p>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"><Edit3 size={16} /></button>
                        <button onClick={() => handleDelete(w._id)} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-all"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary-dark/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white rounded-[40px] p-8 w-full max-w-lg shadow-2xl border-4 border-white animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-500 transition-all"><X size={20}/></button>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center"><Briefcase size={24}/></div>
              <div><h3 className="text-xl font-black text-primary-dark tracking-tight">Onboard New Worker</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Generate App Credentials</p></div>
            </div>
            
            <form onSubmit={handleAddWorker} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required type="text" placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
                <input required type="text" placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <input required type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
              <input required type="tel" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
              <select value={formData.region} onChange={(e) => setFormData({...formData, region: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none">
                <option value="UK">United Kingdom</option>
                <option value="NG">Nigeria</option>
              </select>
              <button type="submit" className="w-full py-4 mt-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">Generate Credentials</button>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Modal (Shown after adding) */}
      {showCredsModal && newCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary-dark/80 backdrop-blur-md" onClick={() => setShowCredsModal(false)}></div>
          <div className="relative bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl border-4 border-white animate-in zoom-in-95 duration-200 text-center text-balance">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6"><ShieldCheck size={40}/></div>
            <h3 className="text-2xl font-black text-primary-dark tracking-tight mb-2">Worker Added Successfully</h3>
            <p className="text-slate-500 font-medium text-sm mb-8">Share these temporary credentials with the worker so they can log into the CleanIQ App.</p>
            
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left space-y-4 mb-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Login ID (Email)</p>
                <p className="font-bold text-primary-dark">{newCredentials.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Temporary Password</p>
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                  <span className="font-mono font-bold text-primary tracking-wider">{newCredentials.tempPassword}</span>
                  <button onClick={() => copyToClipboard(newCredentials.tempPassword)} className="p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-primary/10 hover:text-primary transition-all">
                    {copied ? <CheckCircle2 size={16}/> : <Copy size={16}/>}
                  </button>
                </div>
              </div>
            </div>

            <button onClick={() => setShowCredsModal(false)} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">Done</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Workers;
