import React from 'react';
import { 
  TrendingUp, Users, Calendar, 
  DollarSign, ArrowUpRight, ArrowDownRight,
  Clock, MapPin, CheckCircle2, UserCheck
} from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { title: 'Total Revenue', value: '£12,450', change: '+12.5%', isUp: true, icon: <DollarSign className="text-emerald-500" /> },
    { title: 'Active Bookings', value: '48', change: '+5.2%', isUp: true, icon: <Calendar className="text-blue-500" /> },
    { title: 'New Applicants', value: '12', change: '-2.4%', isUp: false, icon: <Users className="text-orange-500" /> },
    { title: 'Avg Rating', value: '4.9/5', change: '+0.1%', isUp: true, icon: <TrendingUp className="text-purple-500" /> },
  ];

  const recentBookings = [
    { id: 'BK-7821', name: 'Sarah Wilson', service: 'Deep Clean', date: 'May 12', status: 'Confirmed', amount: '£120', region: 'UK', color: 'bg-emerald-100 text-emerald-700' },
    { id: 'BK-7822', name: 'Chidi Okafor', service: 'Regular Home', date: 'May 13', status: 'Pending', amount: '₦45,000', region: 'NG', color: 'bg-amber-100 text-amber-700' },
    { id: 'BK-7823', name: 'Emma Thompson', service: 'Move-out', date: 'May 14', status: 'Completed', amount: '£180', region: 'UK', color: 'bg-slate-100 text-slate-700' },
    { id: 'BK-7824', name: 'Afolabi Musa', service: 'Office', date: 'May 15', status: 'In Progress', amount: '₦120,000', region: 'NG', color: 'bg-blue-100 text-blue-700' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
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
              <h3 className="text-3xl font-black text-primary-dark tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Bookings Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="text-xl font-black text-primary-dark tracking-tight">Active Operations</h3>
              <p className="text-sm text-slate-500 font-medium">Real-time booking monitor</p>
            </div>
            <button className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-primary-dark hover:bg-slate-50 hover:border-primary/30 transition-all shadow-sm">
              View All Bookings
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/30">
                  <th className="px-8 py-4">ID / Customer</th>
                  <th className="px-4 py-4">Service</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentBookings.map((item, i) => (
                  <tr key={i} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${item.region === 'UK' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {item.region}
                        </div>
                        <div>
                          <p className="font-bold text-primary-dark group-hover:text-primary transition-colors">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-wider">{item.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <p className="text-sm font-semibold text-slate-700">{item.service}</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        <Clock size={10} /> {item.date}
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-sm ${item.color}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="font-black text-primary-dark tracking-tight">{item.amount}</p>
                      <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                        <CheckCircle2 size={10} /> Paid
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* Market Performance */}
          <div className="bg-primary-dark p-8 rounded-[40px] text-white relative overflow-hidden group shadow-2xl shadow-primary/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
            <h3 className="text-xl font-bold mb-8 relative z-10">Market Split</h3>
            <div className="space-y-6 relative z-10">
              {[
                { name: 'United Kingdom', revenue: '£8,450', percent: 65, color: 'bg-secondary' },
                { name: 'Nigeria', revenue: '₦4,000,000', percent: 35, color: 'bg-white/20' },
              ].map((region, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <p className="text-sm font-medium text-slate-300">{region.name}</p>
                    <p className="font-black text-lg">{region.revenue}</p>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${region.color} rounded-full transition-all duration-1000 delay-300`} style={{ width: `${region.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Applicants */}
          <div className="bg-white border border-slate-200 p-8 rounded-[40px] shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-primary-dark">New Applicants</h3>
              <span className="bg-primary/10 text-primary text-[10px] font-black px-2.5 py-1 rounded-full uppercase">3 New</span>
            </div>
            <div className="space-y-5">
              {[
                { name: 'David Adewale', role: 'Full-time Cleaner', location: 'Lagos, NG' },
                { name: 'Lucy Harrison', role: 'Part-time Cleaner', location: 'Manchester, UK' },
                { name: 'Olamide Bello', role: 'Specialist Cleaner', location: 'Abuja, NG' },
              ].map((app, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <UserCheck size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-primary-dark leading-tight">{app.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.role}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <MapPin size={10} /> {app.location.split(',')[1]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-500 hover:bg-primary hover:text-white hover:border-primary transition-all uppercase tracking-widest">
              Review Applications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
