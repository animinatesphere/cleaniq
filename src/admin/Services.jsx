import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Plus, Trash2, 
  RefreshCcw, DollarSign, MapPin, 
  AlertCircle, CheckCircle2, Clock,
  Info
} from 'lucide-react';

const ServicesManagement = () => {
  const [services, setServices] = useState([]);
  const [activeRegion, setActiveRegion] = useState('UK');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

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

  useEffect(() => {
    fetchServices();
  }, [activeRegion]);

  const handleRateChange = (id, newRate) => {
    setServices(prev => prev.map(s => 
      s._id === id ? { ...s, rate: parseFloat(newRate) || 0 } : s
    ));
  };

  const saveService = async (service) => {
    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service)
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: `${service.name} updated successfully!` });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update service' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-primary-dark tracking-tight">Services & Pricing</h2>
          <p className="text-slate-500 font-medium mt-1">Manage rates and service types for all regions</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button 
            onClick={() => setActiveRegion('UK')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeRegion === 'UK' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
          >
            United Kingdom (£)
          </button>
          <button 
            onClick={() => setActiveRegion('NG')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeRegion === 'NG' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
          >
            Nigeria (₦)
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-bold">{message.text}</p>
        </div>
      )}

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCcw size={40} className="animate-spin mb-4" />
            <p className="font-bold uppercase tracking-widest text-xs">Loading rates...</p>
          </div>
        ) : (
          services.map((service) => (
            <div key={service._id} className="bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black text-primary-dark tracking-tight group-hover:text-primary transition-colors">{service.name}</h3>
                    <span className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg ${service.type === 'hourly' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      <Clock size={12} /> {service.type} rate
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                    <DollarSign size={24} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Base Rate ({activeRegion === 'UK' ? '£' : '₦'})</label>
                    <span className="text-[10px] font-bold text-slate-400 italic">Last changed: {new Date(service.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">
                        {activeRegion === 'UK' ? '£' : '₦'}
                      </div>
                      <input 
                        type="number"
                        value={service.rate}
                        onChange={(e) => handleRateChange(service._id, e.target.value)}
                        className="w-full pl-10 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-primary-dark focus:bg-white focus:border-primary/50 outline-none transition-all"
                      />
                    </div>
                    <button 
                      onClick={() => saveService(service)}
                      disabled={saving}
                      className="p-4 bg-primary text-white rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      <Save size={24} />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                  <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {activeRegion === 'UK' 
                      ? `This rate applies per hour of service. The total price will be multiplied by the duration selected by the customer.` 
                      : `This is a flat rate for the entire service based on the property size selected.`}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && services.length === 0 && (
        <div className="py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-300">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No services found for this region.</p>
          <button 
            onClick={() => {/* Add Service logic */}}
            className="mt-4 inline-flex items-center gap-2 text-primary font-black hover:underline"
          >
            <Plus size={18} /> Add Your First Service
          </button>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;
