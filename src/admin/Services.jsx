import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Plus, Trash2, 
  RefreshCcw, DollarSign, MapPin, 
  AlertCircle, CheckCircle2, Clock,
  Info, Layout, Zap, Home as HomeIcon, Star
} from 'lucide-react';

const ServicesManagement = () => {
  const [services, setServices] = useState([]);
  const [activeRegion, setActiveRegion] = useState('UK');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [newFeature, setNewFeature] = useState({ name: '', rate: '', type: 'flat' });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services?region=${activeRegion}`);
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, [activeRegion]);

  const handleRateChange = (id, newRate) => {
    setServices(prev => prev.map(s => s._id === id ? { ...s, rate: parseFloat(newRate) || 0 } : s));
  };

  const saveService = async (service) => {
    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...service, region: activeRegion })
      });
      if (response.ok) {
        setMessage({ type: 'success', text: `"${service.name}" updated successfully!` });
        fetchServices();
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) { setMessage({ type: 'error', text: 'Failed to update rate' }); } finally { setSaving(false); }
  };

  const deleteService = async (id) => {
    if (!window.confirm('Are you sure you want to remove this pricing entry?')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services/${id}`, { method: 'DELETE' });
      if (response.ok) fetchServices();
    } catch (error) { console.error('Delete error:', error); }
  };

  const handleAddFeature = async () => {
    if (!newFeature.name || !newFeature.rate) return;
    await saveService({ ...newFeature, region: activeRegion });
    setNewFeature({ name: '', rate: '', type: 'flat' });
  };

  // Grouping services for the UI
  const categories = {
    'Base Services': services.filter(s => ['Residential Cleaning', 'Deep Clean', 'Airbnb Cleaning', 'Office Cleaning'].includes(s.name)),
    'Property Rooms': services.filter(s => ['Bedroom', 'Bathroom', 'Cloakroom', 'Kitchen', 'Utility Room', 'Reception Room', 'Conservatory'].includes(s.name)),
    'Extra Add-ons': services.filter(s => !['Residential Cleaning', 'Deep Clean', 'Airbnb Cleaning', 'Office Cleaning', 'Bedroom', 'Bathroom', 'Cloakroom', 'Kitchen', 'Utility Room', 'Reception Room', 'Conservatory'].includes(s.name))
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-primary-dark tracking-tight">Price Command Center</h2>
          <p className="text-slate-500 font-medium mt-1">Global management of all rates and features</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {['UK', 'NG'].map(r => (
            <button key={r} onClick={() => setActiveRegion(r)} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeRegion === r ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}>
              {r === 'UK' ? 'United Kingdom (£)' : 'Nigeria (₦)'}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`p-5 rounded-[24px] border flex items-center gap-4 animate-in slide-in-from-top-2 shadow-sm ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
          {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <p className="text-sm font-black uppercase tracking-widest">{message.text}</p>
        </div>
      )}

      {/* Add New Feature */}
      <div className="bg-primary/5 p-8 rounded-[40px] border border-primary/10">
        <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Plus size={18}/> Add New Property Type or Extra</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <input type="text" placeholder="e.g. Conservatory" value={newFeature.name} onChange={(e) => setNewFeature({...newFeature, name: e.target.value})} className="p-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-sm" />
          <input type="number" placeholder="Rate" value={newFeature.rate} onChange={(e) => setNewFeature({...newFeature, rate: e.target.value})} className="p-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-sm" />
          <select value={newFeature.type} onChange={(e) => setNewFeature({...newFeature, type: e.target.value})} className="p-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-sm">
            <option value="flat">Flat Rate</option>
            <option value="hourly">Hourly Rate</option>
          </select>
          <button onClick={handleAddFeature} className="bg-primary text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">Add Feature</button>
        </div>
      </div>

      {/* Categorized Rates */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400"><RefreshCcw size={40} className="animate-spin mb-4"/><p className="font-black uppercase tracking-widest text-xs">Syncing Database...</p></div>
      ) : (
        Object.entries(categories).map(([category, items]) => (
          <div key={category} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200"/>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{category}</h3>
              <div className="h-px flex-1 bg-slate-200"/>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((service) => (
                <div key={service._id} className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-black text-primary-dark group-hover:text-primary transition-colors">{service.name}</h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{service.type} rate</p>
                    </div>
                    <button onClick={() => deleteService(service._id)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">{activeRegion === 'UK' ? '£' : '₦'}</span>
                      <input 
                        type="number"
                        value={service.rate}
                        onChange={(e) => handleRateChange(service._id, e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 rounded-xl border-none font-black text-primary-dark text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <button onClick={() => saveService(service)} className="bg-primary/10 text-primary p-3 rounded-xl hover:bg-primary hover:text-white transition-all"><Save size={20}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ServicesManagement;
