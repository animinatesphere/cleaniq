import React, { useState } from 'react';
import { 
  Globe, Shield, Bell, 
  CreditCard, Layout, Sliders,
  Save, RefreshCw, Plus, Trash2,
  ToggleLeft, ToggleRight
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('pricing');

  const tabs = [
    { id: 'pricing', name: 'Pricing & Regions', icon: <Globe size={18} /> },
    { id: 'services', name: 'Service Management', icon: <Sliders size={18} /> },
    { id: 'payments', name: 'Payment Gateways', icon: <CreditCard size={18} /> },
    { id: 'security', name: 'Security & Access', icon: <Shield size={18} /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
        {/* Main Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'pricing' && (
            <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xl font-black text-primary-dark tracking-tight">Regional Pricing</h3>
                <p className="text-sm text-slate-500 font-medium">Manage base rates and currency multipliers</p>
              </div>
              <div className="p-8 space-y-8">
                {/* UK Region */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">United Kingdom (GBP)</h4>
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg">ACTIVE</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Base Hourly Rate</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-black text-primary-dark text-lg">£</span>
                        <input type="text" defaultValue="15.00" className="w-full bg-transparent border-none outline-none font-black text-primary-dark text-lg" />
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Minimum Booking</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="text" defaultValue="2" className="w-full bg-transparent border-none outline-none font-black text-primary-dark text-lg text-right" />
                        <span className="font-black text-primary-dark text-lg">Hours</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Nigeria Region */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Nigeria (NGN)</h4>
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg">ACTIVE</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Base Rate (Standard Clean)</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-black text-primary-dark text-lg">₦</span>
                        <input type="text" defaultValue="12,500" className="w-full bg-transparent border-none outline-none font-black text-primary-dark text-lg" />
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Transport Surcharge</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-black text-primary-dark text-lg">₦</span>
                        <input type="text" defaultValue="2,500" className="w-full bg-transparent border-none outline-none font-black text-primary-dark text-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-primary-dark tracking-tight">Services & Categories</h3>
                  <p className="text-sm text-slate-500 font-medium">Configure available service types</p>
                </div>
                <button className="p-3 rounded-2xl bg-primary text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                  <Plus size={20} />
                </button>
              </div>
              <div className="p-8 space-y-4">
                {[
                  { name: 'Standard Home Clean', status: true, price: '£15/hr' },
                  { name: 'Deep Cleaning', status: true, price: '£25/hr' },
                  { name: 'End of Tenancy', status: true, price: '£120/flat' },
                  { name: 'After Party Clean', status: false, price: '£80/flat' },
                  { name: 'Office Janitorial', status: true, price: 'Custom' },
                ].map((service, i) => (
                  <div key={i} className="p-6 rounded-3xl border border-slate-100 bg-white flex items-center justify-between hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-colors ${service.status ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                        <Layout size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-primary-dark">{service.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{service.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button className={`p-2 rounded-xl transition-all ${service.status ? 'text-primary' : 'text-slate-300 hover:text-slate-400'}`}>
                        {service.status ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                      <button className="p-2 rounded-xl text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-xl font-black text-primary-dark tracking-tight">Security & Access</h3>
                <p className="text-sm text-slate-500 font-medium">Manage your admin credentials</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-900">Account Protection</h4>
                      <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">
                        Changing your password will instantly log you out of all other devices. Make sure to use a strong, unique password.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Username</label>
                    <input 
                      type="text" 
                      value={localStorage.getItem('adminUser') || 'cleaniqadmin'} 
                      disabled
                      className="w-full p-5 rounded-[24px] bg-slate-50 border-2 border-transparent font-bold text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">New Password</label>
                    <input 
                      id="new-password-input"
                      type="password" 
                      placeholder="••••••••"
                      className="w-full p-5 rounded-[24px] border-2 border-slate-100 focus:border-primary focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <button 
                  onClick={async () => {
                    const newPassword = document.getElementById('new-password-input').value;
                    if (!newPassword) return alert('Please enter a new password');
                    
                    try {
                      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/change-password`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          username: localStorage.getItem('adminUser') || 'cleaniqadmin', 
                          newPassword 
                        })
                      });
                      if (response.ok) {
                        alert('Password updated successfully! Please login again.');
                        localStorage.removeItem('adminToken');
                        window.location.reload();
                      } else {
                        alert('Failed to update password');
                      }
                    } catch (err) {
                      alert('Connection error');
                    }
                  }}
                  className="btn-primary w-full py-5 text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20"
                >
                  Update Admin Password
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button className="px-8 py-4 rounded-2xl border border-slate-200 text-sm font-black text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest">
              Discard Changes
            </button>
            <button className="px-8 py-4 rounded-2xl bg-primary text-white text-sm font-black hover:bg-primary-dark transition-all shadow-lg shadow-primary-dark/20 flex items-center gap-2 uppercase tracking-widest">
              <Save size={18} /> Save Settings
            </button>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="p-8 rounded-[40px] bg-secondary text-primary-dark shadow-xl shadow-secondary/10">
            <h4 className="text-xl font-black mb-4 tracking-tight">System Info</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="opacity-60">Version</span>
                <span>2.4.0-stable</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="opacity-60">Last Updated</span>
                <span>May 10, 2026</span>
              </div>
              <div className="h-px bg-primary-dark/10" />
              <button className="w-full py-4 rounded-2xl bg-primary-dark text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary-dark/20">
                <RefreshCw size={16} /> Check for Updates
              </button>
            </div>
          </div>

          <div className="p-8 rounded-[40px] bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                <Bell size={20} />
              </div>
              <h4 className="text-lg font-black text-primary-dark">Help & Support</h4>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
              Need help configuring your regional settings or payment gateways? Our support team is available 24/7.
            </p>
            <button className="w-full py-4 rounded-2xl border border-slate-200 text-xs font-black text-primary-dark uppercase tracking-widest hover:bg-slate-50 transition-all">
              Contact Developer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
