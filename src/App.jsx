import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./component/Navbar";
import TopNav from "./component/TopNav";
import Footer from "./component/Footer";
import ScrollToTop from "./component/ScrollToTop";
import WhatsAppButton from "./component/WhatsAppButton";
import Preloader from "./component/Preloader";
import Home from "./pages/Home";
import About from "./pages/About";
import Booking from "./pages/Booking";
import Recruitment from "./pages/Recruitment";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import ServiceDetail from "./pages/ServiceDetail";
import LocationDetail from "./pages/LocationDetail";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import CityLanding from "./pages/CityLanding";

// Customer Account
import CustomerLogin from "./pages/account/Login";
import CustomerSignup from "./pages/account/Signup";
import CustomerDashboard from "./pages/account/Dashboard";
import { CustomerAuthProvider } from "./context/CustomerAuthContext";

// Admin Imports
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/Dashboard";
import Bookings from "./admin/Bookings";
import AdminBookingPay from "./admin/AdminBookingPay";
import Applicants from "./admin/Applicants";
import Customers from "./admin/Customers";
import Settings from "./admin/Settings";
import ServicesManagement from "./admin/Services";
import Workers from "./admin/Workers";
import Chat from "./admin/Chat";
import AdminBlog from "./admin/Blog";
import StaffPay from "./admin/StaffPay";
import AdminWithdrawals from "./admin/AdminWithdrawals";
import AdminPayments from "./admin/AdminPayments";
import QuoteBuilder from "./admin/QuoteBuilder";
import QuoteHistory from "./admin/QuoteHistory";
import OrgChart from "./admin/OrgChart";
import Leads from "./admin/Leads";
import Checklist from "./admin/Checklist";
import Recurring from "./admin/Recurring";
import Bin from "./admin/Bin";
import EmailHistory from "./admin/EmailHistory";
import InvoiceBuilder from "./admin/InvoiceBuilder";
import Analytics from "./admin/Analytics";
import Expenses from "./admin/Expenses";
import Rota from "./admin/Rota";
import Calendar from "./admin/Calendar";
import NewBookingPage from "./admin/NewBookingPage";
import Automations from "./admin/Automations";
import Pipeline from "./admin/Pipeline";
import Tasks from "./admin/Tasks";
import Complaints from "./admin/Complaints";
import Contracts from "./admin/Contracts";
import WorkerPerformance from "./admin/WorkerPerformance";
import Referrals from "./admin/Referrals";
import Campaigns from "./admin/Campaigns";
import CustomerProfile from "./admin/CustomerProfile";
import CommercialHub from "./admin/CommercialHub";
import PriceList from "./admin/PriceList";

function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  const isAccountPath = location.pathname.startsWith("/account");

  return (
    <CustomerAuthProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {!isAdminPath && <Preloader />}
        <ScrollToTop />
        {!isAdminPath && !isAccountPath && <TopNav />}
        {!isAdminPath && !isAccountPath && <Navbar />}
        {isAccountPath && <Navbar />}

        <main className="grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/recruitment" element={<Recruitment />} />
            <Route path="/services" element={<Services />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/cleaning/:city" element={<CityLanding />} />
            <Route path="/pages/contact" element={<Contact />} />
            <Route path="/pages/:serviceSlug" element={<ServiceDetail />} />
            <Route path="/locations/:area" element={<LocationDetail />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            {/* Customer Account Routes */}
            <Route path="/account/login" element={<CustomerLogin />} />
            <Route path="/account/signup" element={<CustomerSignup />} />
            <Route path="/account/dashboard" element={<CustomerDashboard />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="bookings/new" element={<NewBookingPage />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="bookings/pay/:id" element={<AdminBookingPay />} />
              <Route path="applicants" element={<Applicants />} />
              <Route path="customers" element={<Customers />} />
              <Route path="workers" element={<Workers />} />
              <Route path="services" element={<ServicesManagement />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="quotes" element={<QuoteBuilder />} />
              <Route path="quotes/history" element={<QuoteHistory />} />
              <Route path="org-chart" element={<OrgChart />} />
              <Route path="leads" element={<Leads />} />
              <Route path="checklist" element={<Checklist />} />
              <Route path="recurring" element={<Recurring />} />
              <Route path="bin" element={<Bin />} />
              <Route path="email-history" element={<EmailHistory />} />
              <Route path="invoice-builder" element={<InvoiceBuilder />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="rota" element={<Rota />} />
              <Route path="settings" element={<Settings />} />
              <Route path="chat" element={<Chat />} />
              <Route path="staff-pay" element={<StaffPay />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="automations" element={<Automations />} />
              <Route path="pipeline" element={<Pipeline />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="complaints" element={<Complaints />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="worker-performance" element={<WorkerPerformance />} />
              <Route path="referrals" element={<Referrals />} />
              <Route path="commercial" element={<CommercialHub />} />
              <Route path="pricelist" element={<PriceList />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="customers/:id" element={<CustomerProfile />} />
            </Route>
          </Routes>
        </main>

        {!isAdminPath && !isAccountPath && <Footer />}
        {!isAdminPath && <WhatsAppButton />}
      </div>
    </CustomerAuthProvider>
  );
}

export default App;
