import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './component/Navbar';
import Home from './pages/Home';
import Booking from './pages/Booking';
import Recruitment from './pages/Recruitment';
import Services from './pages/Services';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';

// Placeholder components for admin pages
const AdminBookings = () => <div className="p-10">Admin Bookings List (Coming Soon)</div>;
const AdminApplicants = () => <div className="p-10">Cleaner Applicants (Coming Soon)</div>;
const AdminSettings = () => <div className="p-10">Admin Settings (Coming Soon)</div>;

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/recruitment" element={<Recruitment />} />
          <Route path="/services" element={<Services />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="applicants" element={<AdminApplicants />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </main>
      
      {/* Footer Placeholder */}
      <footer className="bg-primary-dark text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                 <span className="text-primary font-bold">C</span>
              </div>
              <span className="font-bold text-xl uppercase tracking-widest">CLEANIQ</span>
           </div>
           <div className="flex gap-8 text-sm text-slate-300">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
           </div>
           <p className="text-slate-400 text-sm">© 2026 CLEANIQ SERVICES. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
