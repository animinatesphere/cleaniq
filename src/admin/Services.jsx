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
  const [activeTab, setActiveTab] = useState('Extras'); // Default to Extras as requested
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [newFeature, setNewFeature] = useState({ name: '', rate: '', type: 'flat', description: '' });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services?region=${activeRegion}`);
      const data = await response.json();
      const clean = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
      const baseNames = ['Residential Cleaning', 'Deep Clean', 'Airbnb Cleaning', 'Office Cleaning', 'End of Tenancy'];
      const roomNames = ['Bedroom', 'Bathroom', 'Cloakroom', 'Kitchen', 'Utility Room', 'Reception Room', 'Conservatory'];

      const mappedData = data.map(s => {
        let cat = s.category; // Use backend category if available
        if (!cat) {
          cat = 'Extras';
          if (baseNames.some(b => clean(b) === clean(s.name))) cat = 'Base';
          else if (roomNames.some(r => clean(r) === clean(s.name))) cat = 'Rooms';
        }
        return { ...s, category: cat, originalCategory: cat };
      });

      setServices(mappedData);
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

  const handleNameChange = (id, newName) => {
    setServices(prev => prev.map(s => s._id === id ? { ...s, name: newName } : s));
  };

  const saveService = async (service) => {
    setSaving(true);
    try {
      const isExisting = service._id && service._id.match(/^[0-9a-fA-F]{24}$/);
      const url = isExisting 
        ? `${import.meta.env.VITE_API_URL}/services/${service._id}`
        : `${import.meta.env.VITE_API_URL}/services`;
      const method = isExisting ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...service, 
          name: service.name.trim(), 
          region: activeRegion,
          category: service.category || service.originalCategory || 'Extras'
        })
      });
      if (response.ok) {
        setMessage({ type: 'success', text: `"${service.name}" updated successfully!` });
        fetchServices();
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) { 
      console.error('Save error:', error);
      setMessage({ type: 'error', text: `Failed to update: ${error.message}` }); 
    } finally { setSaving(false); }
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
    await saveService({ ...newFeature, name: newFeature.name.trim(), region: activeRegion, category: activeTab });
    setNewFeature({ name: '', rate: '', type: 'flat', description: '' });
  };

  const categories = (() => {
    return {
      'Base': services.filter(s => s.originalCategory === 'Base'),
      'Rooms': services.filter(s => s.originalCategory === 'Rooms'),
      'Extras': services.filter(s => s.originalCategory === 'Extras' || !s.originalCategory)
    };
  })();

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-primary-dark tracking-tight">Services & Pricing</h2>
          <p className="text-slate-500 font-medium mt-1">Manage all rates, rooms, and extra add-ons</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 border-b border-slate-200 pb-4">
        {Object.keys(categories).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-primary hover:bg-primary/5'}`}>
            {tab} Services
          </button>
        ))}
      </div>

      {message && (
        <div className={`p-5 rounded-[24px] border flex items-center gap-4 animate-in slide-in-from-top-2 shadow-sm ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
          {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <p className="text-sm font-black uppercase tracking-widest">{message.text}</p>
        </div>
      )}

      {/* Add New Service for current Tab */}
      <div className="bg-primary/5 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-primary/10">
        <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Plus size={18}/> Add New {activeTab} Service</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input type="text" placeholder="Name (e.g. Fridge Cleaning)" value={newFeature.name} onChange={(e) => setNewFeature({...newFeature, name: e.target.value})} className="p-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-sm" />
          <input type="number" placeholder="Rate / Price" value={newFeature.rate} onChange={(e) => setNewFeature({...newFeature, rate: e.target.value})} className="p-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-sm" />
          <select value={newFeature.type} onChange={(e) => setNewFeature({...newFeature, type: e.target.value})} className="p-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-sm">
            <option value="flat">Flat Rate</option>
            <option value="hourly">Hourly Rate</option>
          </select>
          <button onClick={handleAddFeature} className="bg-primary text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">Add {activeTab}</button>
          <div className="md:col-span-2 lg:col-span-4">
            <input type="text" placeholder="Brief description (optional)" value={newFeature.description} onChange={(e) => setNewFeature({...newFeature, description: e.target.value})} className="w-full p-4 rounded-2xl bg-white border border-slate-200 outline-none font-bold text-sm" />
          </div>
        </div>
      </div>

      {/* Categorized Rates */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400"><RefreshCcw size={40} className="animate-spin mb-4"/><p className="font-black uppercase tracking-widest text-xs">Syncing Database...</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories[activeTab].map((service) => (
            <div key={service._id} className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1 mr-2">
                  <input 
                    type="text"
                    value={service.name}
                    onChange={(e) => handleNameChange(service._id, e.target.value)}
                    className="font-black text-primary-dark group-hover:text-primary bg-transparent border-b border-transparent hover:border-slate-200 focus:border-primary focus:ring-0 outline-none text-sm transition-all w-full py-1 mb-1"
                  />
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
      )}
    </div>
  );
};

export default ServicesManagement;
