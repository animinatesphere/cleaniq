import React from 'react';
import { 
  TrendingUp, Users, Calendar, 
  DollarSign, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { title: 'Total Revenue', value: '£12,450', change: '+12.5%', isUp: true, icon: <DollarSign className="text-emerald-500" /> },
    { title: 'Active Bookings', value: '48', change: '+5.2%', isUp: true, icon: <Calendar className="text-blue-500" /> },
    { title: 'New Applicants', value: '12', change: '-2.4%', isUp: false, icon: <Users className="text-orange-500" /> },
    { title: 'Avg Rating', value: '4.9/5', change: '+0.1%', isUp: true, icon: <TrendingUp className="text-purple-500" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-6 rounded-[32px]">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl">
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
            <h3 className="text-3xl font-black text-primary-dark mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 glass p-8 rounded-[40px]">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-bold text-primary-dark">Recent Bookings</h3>
             <button className="text-sm font-bold text-secondary hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-4">Customer</th>
                  <th className="pb-4">Service</th>
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { name: 'Sarah Wilson', service: 'Deep Clean', date: 'May 12', status: 'Confirmed', amount: '£120', color: 'bg-blue-100 text-blue-600' },
                  { name: 'Michael Chen', service: 'Regular Home', date: 'May 13', status: 'Pending', amount: '£65', color: 'bg-orange-100 text-orange-600' },
                  { name: 'Emma Thompson', service: 'Move-out', date: 'May 14', status: 'Completed', amount: '£180', color: 'bg-emerald-100 text-emerald-600' },
                  { name: 'John Doe', service: 'Office', date: 'May 15', status: 'Confirmed', amount: '£250', color: 'bg-blue-100 text-blue-600' },
                ].map((item, i) => (
                  <tr key={i} className="group">
                    <td className="py-5 font-bold text-primary-dark group-hover:text-secondary transition-colors">{item.name}</td>
                    <td className="py-5 text-sm text-slate-600">{item.service}</td>
                    <td className="py-5 text-sm text-slate-600">{item.date}</td>
                    <td className="py-5">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${item.color}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-5 text-right font-black text-primary-dark">{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Region Performance */}
        <div className="glass p-8 rounded-[40px]">
           <h3 className="text-xl font-bold text-primary-dark mb-8">Region Split</h3>
           <div className="space-y-6">
              {[
                { name: 'United Kingdom', bookings: 32, revenue: '£8,450', percent: 65, color: 'bg-primary' },
                { name: 'Nigeria', bookings: 16, revenue: '₦4,000,000', percent: 35, color: 'bg-secondary' },
              ].map((region, i) => (
                <div key={i} className="space-y-2">
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="font-bold text-primary-dark">{region.name}</p>
                         <p className="text-xs text-slate-500">{region.bookings} Bookings</p>
                      </div>
                      <p className="font-black text-primary-dark">{region.revenue}</p>
                   </div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${region.color}`} style={{ width: `${region.percent}%` }} />
                   </div>
                </div>
              ))}
           </div>

           <div className="mt-12 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Market Insight</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Nigeria market is showing 24% growth month-on-month. Consider expanding service area in Lagos.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
