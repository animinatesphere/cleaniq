import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, Users, 
  Settings, LogOut, ChevronRight, Sparkles 
} from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Bookings', path: '/admin/bookings', icon: <Calendar size={20} /> },
    { name: 'Applicants', path: '/admin/applicants', icon: <Users size={20} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white p-6 flex flex-col fixed h-full">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <Sparkles className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none uppercase tracking-widest">CLEANIQ</h1>
            <span className="text-[10px] text-secondary font-bold uppercase">Admin Console</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                location.pathname === item.path 
                ? 'bg-white/10 text-secondary' 
                : 'hover:bg-white/5 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-semibold text-sm">{item.name}</span>
              </div>
              {location.pathname === item.path && <ChevronRight size={14} />}
            </Link>
          ))}
        </nav>

        <button className="flex items-center gap-3 p-4 text-slate-400 hover:text-white transition-all mt-auto border-t border-white/10 pt-6">
          <LogOut size={20} />
          <span className="font-semibold text-sm">Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-10">
        <header className="flex justify-between items-center mb-10">
           <div>
              <h2 className="text-3xl font-black text-primary-dark">
                {menuItems.find(m => m.path === location.pathname)?.name || 'Admin'}
              </h2>
              <p className="text-slate-500 text-sm">Welcome back, Admin</p>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-right">
                 <p className="text-sm font-bold text-primary-dark">Admin User</p>
                 <p className="text-xs text-slate-400">Super Admin</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20" />
           </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
