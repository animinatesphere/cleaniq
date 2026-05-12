import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, User, Mail, Phone, MapPin, 
  Calendar, ChevronRight, Star, CreditCard, 
  ShoppingBag, RefreshCcw, Download, X
} from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/customers`);
      const data = await response.json();
      setCustomers(data.map((c, i) => ({
        id: `CUS-${1000 + i}`,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        phone: c.phone,
        bookings: c.totalBookings,
        spend: `${c.region === 'UK' ? '£' : '₦'}${c.totalSpent?.toLocaleString() || 0}`,
        rawSpend: c.totalSpent || 0,
        joined: new Date(c.lastBooking).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        region: c.region,
      })));
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const downloadCSV = () => {
    if (customers.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Region', 'Total Bookings', 'Total Spent', 'Last Booking'];
    const rows = customers.map(c => [c.id, c.name, c.email, c.phone, c.region, c.bookings, c.rawSpend, c.joined]);
    const csv = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `cleaniq_customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Customers', value: customers.length, sub: 'All time' },
          { label: 'UK Clients', value: customers.filter(c => c.region === 'UK').length, sub: 'United Kingdom' },
          { label: 'Nigeria Clients', value: customers.filter(c => c.region === 'NG').length, sub: 'Nigeria' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
            <h3 className="text-3xl font-black text-primary-dark mt-1">{s.value}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center bg-slate-50/30">
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 w-full md:w-96">
            <Search size={18} className="text-slate-400" />
            <input type="text" placeholder="Search by name, email or phone..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm font-medium w-full" />
          </div>
          <div className="flex gap-3 ml-auto">
            <button onClick={fetchCustomers} className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all">
              <RefreshCcw size={18} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={downloadCSV} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white text-sm font-black hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                <th className="px-8 py-5">Customer</th>
                <th className="px-4 py-5">Contact</th>
                <th className="px-4 py-5">Bookings</th>
                <th className="px-4 py-5">Total Spent</th>
                <th className="px-4 py-5">Region</th>
                <th className="px-4 py-5">Last Booking</th>
                <th className="px-8 py-5 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="py-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                  <RefreshCcw size={28} className="animate-spin mx-auto mb-4" /> Loading...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="py-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                  No customers found yet.
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                        {c.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-primary-dark">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <p className="text-sm font-medium text-slate-600">{c.email}</p>
                    <p className="text-xs font-black text-primary mt-0.5">{c.phone}</p>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={14} className="text-blue-500" />
                      <span className="font-black text-primary-dark">{c.bookings}</span>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex items-center gap-2">
                      <CreditCard size={14} className="text-emerald-500" />
                      <span className="font-black text-primary-dark">{c.spend}</span>
                    </div>
                  </td>
                  <td className="px-4 py-6">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${c.region === 'UK' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                      {c.region}
                    </span>
                  </td>
                  <td className="px-4 py-6">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                      <Calendar size={13} className="text-slate-400" /> {c.joined}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => setSelected(c)} className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-primary-dark hover:bg-primary hover:text-white hover:border-primary transition-all">
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-[48px] shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-primary-dark">Customer Details</h3>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-slate-100 transition-all"><X size={20} /></button>
            </div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-black text-3xl">{selected.name?.charAt(0)}</div>
              <div>
                <h4 className="text-2xl font-black text-primary-dark">{selected.name}</h4>
                <p className="text-slate-400 font-bold text-sm">{selected.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Mail size={14} />, label: 'Email', val: selected.email },
                { icon: <Phone size={14} />, label: 'Phone', val: selected.phone },
                { icon: <MapPin size={14} />, label: 'Region', val: selected.region },
                { icon: <ShoppingBag size={14} />, label: 'Bookings', val: selected.bookings },
                { icon: <CreditCard size={14} />, label: 'Total Spent', val: selected.spend },
                { icon: <Calendar size={14} />, label: 'Last Booking', val: selected.joined },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">{item.icon}<span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span></div>
                  <p className="text-sm font-bold text-primary-dark">{item.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
