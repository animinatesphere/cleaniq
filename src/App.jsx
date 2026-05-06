import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './component/Navbar';
import Footer from './component/Footer';
import ScrollToTop from './component/ScrollToTop';
import Preloader from './component/Preloader';
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Preloader />
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow">
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
      <Footer />
    </div>
  );
}

export default App;

