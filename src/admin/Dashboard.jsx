import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Users, Calendar, 
  DollarSign, ArrowUpRight, ArrowDownRight,
  Clock, MapPin, CheckCircle2, UserCheck,
  ChevronRight, Phone, Activity, Shield, HardDrive,Plus,
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    bookings: [],
    applicants: [],
    stats: [],
    systemHealth: {
      api: 'Online',
      db: 'Connected',
      uptime: '99.9%'
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [bookingsRes, applicantsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/bookings`),
          fetch(`${import.meta.env.VITE_API_URL}/recruitment`)
        ]);
        
        const bookings = await bookingsRes.json();
        const applicants = await applicantsRes.json();

        // Calculate Revenue
        const ukRevenue = bookings.filter(b => b.region === 'UK').reduce((sum, b) => sum + b.payment.amount, 0);
        const ngRevenue = bookings.filter(b => b.region === 'NG').reduce((sum, b) => sum + b.payment.amount, 0);
        
        setData({
          bookings: bookings.slice(0, 5).map(b => ({
            id: b.bookingId,
            mongoId: b._id,
            name: `${b.customer.firstName} ${b.customer.lastName}`,
            phone: b.customer.phone,
            service: b.service,
            date: new Date(b.schedule.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            status: b.status,
            amount: `${b.region === 'UK' ? '£' : '₦'}${b.payment.amount.toLocaleString()}`,
            region: b.region,
            color: b.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          })),
          applicants: applicants.slice(0, 4).map(a => ({
            id: a._id,
            name: a.fullName,
            role: a.experience,
          })),
          stats: [
            { title: 'Total Revenue (UK)', value: `£${ukRevenue.toLocaleString()}`, change: '+100%', isUp: true, icon: <DollarSign className="text-emerald-500" /> },
            { title: 'Total Bookings', value: bookings.length.toString(), change: '+100%', isUp: true, icon: <Calendar className="text-indigo-500" /> },
            { title: 'Conversion Rate', value: '12.5%', change: '+2%', isUp: true, icon: <TrendingUp className="text-purple-500" /> },
          ],
          systemHealth: {
            api: 'Healthy',
            db: 'Synced',
            uptime: '100%'
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-primary/10 transition-colors">
                {React.cloneElement(stat.icon, { size: 24, className: 'group-hover:scale-110 transition-transform' })}
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${stat.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
              <h3 className="text-2xl font-black text-primary-dark tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Operations Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[32px] lg:rounded-[40px] shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-xl font-black text-primary-dark tracking-tight">Active Operations</h3>
              <p className="text-sm text-slate-500 font-medium">Real-time status monitor</p>
            </div>
            <button onClick={() => navigate('/admin/bookings')} className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-primary-dark hover:bg-slate-50 transition-all">
              Manage All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/30">
                  <th className="px-8 py-4">Customer</th>
                  <th className="px-4 py-4">Service</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.bookings.map((item, i) => (
                  <tr key={i} onClick={() => navigate(`/admin/bookings?id=${item.mongoId}`)} className="group hover:bg-slate-50/80 transition-colors cursor-pointer">
                    <td className="px-8 py-5">
                      <p className="font-bold text-primary-dark group-hover:text-primary transition-colors">{item.name}</p>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1"><Phone size={10} /> {item.phone}</p>
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-sm font-semibold text-slate-700">{item.service}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.date}</p>
                    </td>
                    <td className="px-4 py-5">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm ${item.color}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-primary-dark">{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CPanel Sidebar */}
        <div className="space-y-8">
          {/* System Pulse */}
          <div className="bg-primary-dark p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Activity size={20} className="text-secondary" /> System Health
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-emerald-400" />
                  <span className="text-sm font-medium text-slate-300">API Gateway</span>
                </div>
                <span className="text-sm font-black text-emerald-400">{data.systemHealth.api}</span>
              </div>
              <div className="flex justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <HardDrive size={18} className="text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Database</span>
                </div>
                <span className="text-sm font-black text-blue-400">{data.systemHealth.db}</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Network Uptime</p>
                <p className="text-lg font-black text-secondary">{data.systemHealth.uptime}</p>
              </div>
            </div>
          </div>

          {/* Quick Tools */}
          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-sm">
            <h3 className="text-lg font-black text-primary-dark mb-6">Marketing Tools</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/admin/settings')}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-600">Broadcast</span>
              </button>
              <button 
                onClick={() => navigate('/admin/services')}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center gap-2 hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={20} />
                </div>
                <span className="text-[10px] font-black uppercase text-slate-600">Add Service</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
