import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Plus, Trash2, 
  RefreshCcw, DollarSign, MapPin, 
  AlertCircle, CheckCircle2, Clock,
  Info, Layout, Zap, Home as HomeIcon, Star, ListChecks, X as XIcon
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
      const baseNames = ['Residential Cleaning', 'Deep Clean', 'Airbnb Cleaning', 'Office Cleaning', 'End of Tenancy', 'General Cleaning'];
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
    // Keep originalCategory stable when renaming so the service stays in the right tab
    setServices(prev => prev.map(s => s._id === id ? { ...s, name: newName, originalCategory: s.originalCategory || s.category } : s));
  };

  const handleDescriptionChange = (id, newDesc) => {
    setServices(prev => prev.map(s => s._id === id ? { ...s, description: newDesc } : s));
  };

  const handleTypeChange = (id, newType) => {
    setServices(prev => prev.map(s => s._id === id ? { ...s, type: newType } : s));
  };

  const handleBulletChange = (id, idx, val) => {
    setServices(prev => prev.map(s => {
      if (s._id !== id) return s;
      const bullets = [...(s.bullets || [])];
      bullets[idx] = val;
      return { ...s, bullets };
    }));
  };

  const handleAddBullet = (id) => {
    setServices(prev => prev.map(s => {
      if (s._id !== id) return s;
      return { ...s, bullets: [...(s.bullets || []), ''] };
    }));
  };

  const handleRemoveBullet = (id, idx) => {
    setServices(prev => prev.map(s => {
      if (s._id !== id) return s;
      const bullets = (s.bullets || []).filter((_, i) => i !== idx);
      return { ...s, bullets };
    }));
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
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Services & Pricing</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">Manage all rates, rooms, and extra add-ons</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {Object.keys(categories).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-2 shadow-sm ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p className="text-sm font-semibold">{message.text}</p>
        </div>
      )}

      {/* Add New Service for current Tab */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2"><Plus size={16} className="text-primary"/> Add New {activeTab} Service</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input type="text" placeholder="Name (e.g. Fridge Cleaning)" value={newFeature.name} onChange={(e) => setNewFeature({...newFeature, name: e.target.value})} className="p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          <input type="number" placeholder="Rate / Price" value={newFeature.rate} onChange={(e) => setNewFeature({...newFeature, rate: e.target.value})} className="p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          <select value={newFeature.type} onChange={(e) => setNewFeature({...newFeature, type: e.target.value})} className="p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
            <option value="flat">Flat Rate</option>
            <option value="hourly">Hourly Rate</option>
          </select>
          <button onClick={handleAddFeature} className="bg-primary text-white p-3 rounded-xl font-bold text-sm hover:bg-primary-dark transition-all">Add {activeTab}</button>
          <div className="md:col-span-2 lg:col-span-4">
            <input type="text" placeholder="Brief description (optional)" value={newFeature.description} onChange={(e) => setNewFeature({...newFeature, description: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-medium text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
          </div>
        </div>
      </div>

      {/* Categorized Rates */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400"><RefreshCcw size={32} className="animate-spin mb-3"/><p className="font-semibold text-sm">Loading services…</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories[activeTab].map((service) => (
            <div key={service._id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all group">
              <div className="flex justify-between items-start mb-5">
                <div className="flex-1 mr-2">
                  <input
                    type="text"
                    value={service.name}
                    onChange={(e) => handleNameChange(service._id, e.target.value)}
                    className="font-bold text-slate-900 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl px-3 py-2 text-sm transition-all w-full mb-1 cursor-text"
                    title="Click to edit name"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-semibold text-slate-400 px-1">Rate Type:</span>
                    <select
                      value={service.type}
                      onChange={(e) => handleTypeChange(service._id, e.target.value)}
                      className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-lg px-2 py-0.5 outline-none transition-all cursor-pointer"
                    >
                      <option value="flat">Flat</option>
                      <option value="hourly">Hourly</option>
                    </select>
                  </div>
                  <textarea
                    value={service.description || ''}
                    onChange={(e) => handleDescriptionChange(service._id, e.target.value)}
                    placeholder="Enter brief description..."
                    className="font-medium text-slate-500 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl px-3 py-2 text-xs transition-all w-full mt-2 h-16 resize-none cursor-text"
                    title="Click to edit description"
                  />
                </div>
                <button onClick={() => deleteService(service._id)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors shrink-0"><Trash2 size={16}/></button>
              </div>
              
              {/* Bullets editor — only for Base services */}
              {service.originalCategory === 'Base' && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <ListChecks size={12} /> Feature Bullets
                    </p>
                    <button onClick={() => handleAddBullet(service._id)}
                      className="flex items-center gap-1 text-[10px] font-bold text-primary hover:bg-primary/5 px-2 py-1 rounded-lg transition-all">
                      <Plus size={11} /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(service.bullets || []).map((bullet, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle2 size={11} className="text-primary/30 shrink-0" />
                        <input
                          type="text"
                          value={bullet}
                          onChange={e => handleBulletChange(service._id, idx, e.target.value)}
                          placeholder={`Bullet point ${idx + 1}`}
                          className="flex-1 text-xs font-bold bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white focus:outline-none rounded-lg px-3 py-1.5 transition-all"
                        />
                        <button onClick={() => handleRemoveBullet(service._id, idx)}
                          className="text-slate-300 hover:text-rose-400 transition-colors shrink-0">
                          <XIcon size={13} />
                        </button>
                      </div>
                    ))}
                    {(!service.bullets || service.bullets.length === 0) && (
                      <p className="text-[10px] text-slate-300 font-bold italic">No bullets yet — click Add to create one</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">{activeRegion === 'UK' ? '£' : '₦'}</span>
                  <input 
                    type="number"
                    value={service.rate}
                    onChange={(e) => handleRateChange(service._id, e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 rounded-xl border-none font-bold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
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
