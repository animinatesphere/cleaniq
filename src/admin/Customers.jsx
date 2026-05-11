import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, User, 
  Mail, MapPin, Calendar, 
  ChevronRight, MoreVertical,
  Star, CreditCard, ShoppingBag,
  RefreshCcw
} from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/customers`);
        const data = await response.json();
        setCustomers(data.map((c, i) => ({
          id: `CUS-${1000 + i}`,
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          phone: c.phone,
          bookings: c.totalBookings,
          spend: `${c.region === 'UK' ? '£' : '₦'}${c.totalSpent.toLocaleString()}`,
          joined: new Date(c.lastBooking).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
          region: c.region,
          rating: 5.0 // Static for now
        })));
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200 group focus-within:border-primary/50 transition-all w-full md:w-96">
          <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search customers..." 
            className="bg-transparent border-none outline-none text-sm font-medium w-full text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Filter size={18} /> Segment
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                <th className="px-8 py-5">Customer Profile</th>
                <th className="px-4 py-5">Activity</th>
                <th className="px-4 py-5">Value</th>
                <th className="px-4 py-5">Joined</th>
                <th className="px-4 py-5">Rating</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                    <RefreshCcw size={32} className="animate-spin mx-auto mb-4" />
                    Loading Clients...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                    No customers found yet.
                  </td>
                </tr>
              ) : (
                customers.map((cus) => (
                  <tr key={cus.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-primary-dark group-hover:text-primary transition-colors">{cus.name}</p>
                          <div className="flex items-center gap-3">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{cus.id}</p>
                            <span className="text-slate-200">•</span>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                              <MapPin size={10} /> {cus.region === 'UK' ? 'UK' : 'NG'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                          <ShoppingBag size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-primary-dark">{cus.bookings}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Bookings</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                          <CreditCard size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-primary-dark">{cus.spend}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Spend</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                        <Calendar size={14} className="text-slate-400" />
                        {cus.joined}
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          <Star size={14} className="text-amber-400 fill-amber-400" />
                          <span className="text-sm font-black text-primary-dark">{cus.rating}</span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">avg.</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-primary/10 hover:text-primary transition-all">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Customers;
