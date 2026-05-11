import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, Users, 
  Settings, LogOut, ChevronRight, ShieldCheck,
  Menu, X, Search, Bell, User
} from 'lucide-react';

const AdminLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Bookings', path: '/admin/bookings', icon: <Calendar size={20} /> },
    { name: 'Applicants', path: '/admin/applicants', icon: <Users size={20} /> },
    { name: 'Customers', path: '/admin/customers', icon: <User size={20} /> },
    { name: 'Services', path: '/admin/services', icon: <ShieldCheck size={20} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  const activeItem = menuItems.find(m => m.path === location.pathname) || menuItems[0];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-primary-dark/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-primary-dark text-white p-6 flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shadow-lg shadow-secondary/20">
              <ShieldCheck className="text-primary-dark" size={24} />
            </div>
            <div>
              <h1 className="font-black text-lg leading-none uppercase tracking-tighter">CLEANIQ</h1>
              <span className="text-[10px] text-secondary font-bold uppercase tracking-widest">Admin Panel</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/50 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                location.pathname === item.path 
                ? 'bg-secondary text-primary-dark shadow-lg shadow-secondary/10' 
                : 'hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={location.pathname === item.path ? 'text-primary-dark' : 'group-hover:scale-110 transition-transform'}>
                  {item.icon}
                </span>
                <span className="font-bold text-sm">{item.name}</span>
              </div>
              {location.pathname === item.path && <ChevronRight size={16} className="animate-pulse" />}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-6 space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-xs text-slate-400 mb-1 font-medium">Server Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Live & Secure</span>
            </div>
          </div>
          <button className="flex items-center gap-3 w-full p-4 text-slate-400 hover:text-red-400 transition-colors group">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 lg:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-0">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200 group focus-within:border-primary/50 transition-all">
              <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search bookings, customers..." 
                className="bg-transparent border-none outline-none text-sm font-medium w-64 text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <button className="relative p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-primary/30 transition-all group">
              <Bell size={20} className="group-hover:rotate-12 transition-transform" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            
            <div className="h-10 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-3 pl-2 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-primary-dark leading-tight group-hover:text-primary transition-colors">Admin User</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Operations Manager</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-primary/10 border-2 border-white shadow-sm flex items-center justify-center text-primary group-hover:border-primary/20 transition-all">
                <User size={22} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
          <div className="mb-10">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              <span>Admin</span>
              <ChevronRight size={12} />
              <span className="text-primary">{activeItem.name}</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-primary-dark tracking-tighter">
              {activeItem.name}
            </h2>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

