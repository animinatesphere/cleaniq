import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './component/Navbar';
import TopNav from './component/TopNav';
import Footer from './component/Footer';
import ScrollToTop from './component/ScrollToTop';
import Preloader from './component/Preloader';
import Home from './pages/Home';
import About from './pages/About';
import Booking from './pages/Booking';
import Recruitment from './pages/Recruitment';
import Services from './pages/Services';

// Admin Importsddhdhdhdhhdh
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import Bookings from './admin/Bookings';
import Applicants from './admin/Applicants';
import Customers from './admin/Customers';
import Settings from './admin/Settings';
import ServicesManagement from './admin/Services';

function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {!isAdminPath && <Preloader />}
      <ScrollToTop />
      {!isAdminPath && <TopNav />}
      {!isAdminPath && <Navbar />}
      
      <main className="grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/recruitment" element={<Recruitment />} />
          <Route path="/services" element={<Services />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="applicants" element={<Applicants />} />
            <Route path="customers" element={<Customers />} />
            <Route path="services" element={<ServicesManagement />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </main>

      {!isAdminPath && <Footer />}
    </div>
  );
}

export default App;
