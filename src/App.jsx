import React, { useEffect, lazy, Suspense } from "react";
import { captureCreatorRef } from "./utils/creatorRef";
import { Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "./component/Navbar";
import TopNav from "./component/TopNav";
import Footer from "./component/Footer";
import ScrollToTop from "./component/ScrollToTop";
import WhatsAppButton from "./component/WhatsAppButton";
import CookieBanner from "./component/CookieBanner";
import Home from "./pages/Home";
// Public pages load when visited, so the homepage doesn't download booking/payment (Stripe),
// quote, blog and other page code. The homepage itself stays in the main bundle so it shows at once.
const About = lazy(() => import("./pages/About"));
const Booking = lazy(() => import("./pages/Booking"));
const Recruitment = lazy(() => import("./pages/Recruitment"));
const Services = lazy(() => import("./pages/Services"));
const Contact = lazy(() => import("./pages/Contact"));
const GetQuote = lazy(() => import("./pages/GetQuote"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const LocationDetail = lazy(() => import("./pages/LocationDetail"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const CityLanding = lazy(() => import("./pages/CityLanding"));

// Customer Account
const CustomerLogin = lazy(() => import("./pages/account/Login"));
const CustomerSignup = lazy(() => import("./pages/account/Signup"));
const CustomerDashboard = lazy(() => import("./pages/account/Dashboard"));
const CreatorDashboard = lazy(() => import("./pages/account/CreatorDashboard"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const WorkerApp = lazy(() => import("./pages/WorkerApp"));
import { CustomerAuthProvider } from "./context/CustomerAuthContext";

// Admin, account and other rarely-visited pages are downloaded only when opened, so the public
// website stays small and fast on phones.
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
// Website content editor: its own sign-in, separate from the main admin (/content-admin).
const ContentAdmin = lazy(() => import("./content-admin/ContentAdmin"));
const ContentLogin = lazy(() => import("./content-admin/ContentLogin"));
// Social media dashboard: its own sign-in, separate from the main admin (/social).
const SocialApp = lazy(() => import("./social/SocialApp"));
const SocialLogin = lazy(() => import("./social/SocialLogin"));
const ContentEditors = lazy(() => import("./admin/ContentEditors"));
const Dashboard = lazy(() => import("./admin/Dashboard"));
const Bookings = lazy(() => import("./admin/Bookings"));
const AdminBookingPay = lazy(() => import("./admin/AdminBookingPay"));
const Applicants = lazy(() => import("./admin/Applicants"));
const Customers = lazy(() => import("./admin/Customers"));
const Settings = lazy(() => import("./admin/Settings"));
const ServicesManagement = lazy(() => import("./admin/Services"));
const Workers = lazy(() => import("./admin/Workers"));
const Chat = lazy(() => import("./admin/Chat"));
const AdminBlog = lazy(() => import("./admin/Blog"));
const StaffPay = lazy(() => import("./admin/StaffPay"));
const Subscriptions = lazy(() => import("./admin/Subscriptions"));
const Commission = lazy(() => import("./admin/Commission"));
const AdminWithdrawals = lazy(() => import("./admin/AdminWithdrawals"));
const AdminPayments = lazy(() => import("./admin/AdminPayments"));
const QuoteBuilder = lazy(() => import("./admin/QuoteBuilder"));
const QuoteHistory = lazy(() => import("./admin/QuoteHistory"));
const OrgChart = lazy(() => import("./admin/OrgChart"));
const Leads = lazy(() => import("./admin/Leads"));
const Checklist = lazy(() => import("./admin/Checklist"));
const Recurring = lazy(() => import("./admin/Recurring"));
const Bin = lazy(() => import("./admin/Bin"));
const EmailHistory = lazy(() => import("./admin/EmailHistory"));
const InvoiceBuilder = lazy(() => import("./admin/InvoiceBuilder"));
const Analytics = lazy(() => import("./admin/Analytics"));
const GenerateLinksPage = lazy(() => import("./admin/GenerateLinksPage"));
const Expenses = lazy(() => import("./admin/Expenses"));
const Rota = lazy(() => import("./admin/Rota"));
const Calendar = lazy(() => import("./admin/Calendar"));
const NewBookingPage = lazy(() => import("./admin/NewBookingPage"));
const Automations = lazy(() => import("./admin/Automations"));
const SmsAutomation = lazy(() => import("./admin/SmsAutomation"));
const Pipeline = lazy(() => import("./admin/Pipeline"));
const Tasks = lazy(() => import("./admin/Tasks"));
const Complaints = lazy(() => import("./admin/Complaints"));
const Contracts = lazy(() => import("./admin/Contracts"));
const WorkerPerformance = lazy(() => import("./admin/WorkerPerformance"));
const Referrals = lazy(() => import("./admin/Referrals"));
const Campaigns = lazy(() => import("./admin/Campaigns"));
const CustomerProfile = lazy(() => import("./admin/CustomerProfile"));
const CommercialHub = lazy(() => import("./admin/CommercialHub"));
const PropertyReport = lazy(() => import("./admin/CommercialHub").then((m) => ({ default: m.PropertyReport })));
const DomesticHub = lazy(() => import("./admin/DomesticHub"));
const PriceList = lazy(() => import("./admin/PriceList"));
const JobDetail = lazy(() => import("./admin/JobDetail"));
const Jobs = lazy(() => import("./admin/Jobs"));
const CompanyJobs = lazy(() => import("./admin/CompanyJobs"));
const AssignJobs = lazy(() => import("./admin/AssignJobs"));
const Coupons = lazy(() => import("./admin/Coupons"));
const JobVisibility = lazy(() => import("./admin/JobVisibility"));
const GuideDistribution = lazy(() => import("./admin/GuideDistribution"));
const ColdEmail = lazy(() => import("./admin/ColdEmail/index.jsx"));
const CampaignDetail = lazy(() => import("./admin/ColdEmail/CampaignDetail.jsx"));
const TodoPage = lazy(() => import("./admin/TodoPage"));
const DevPanel = lazy(() => import("./admin/DevPanel"));
const AiReceptionistLayout = lazy(() => import("./admin/AiReceptionist"));
const AiOverview = lazy(() => import("./admin/AiReceptionist/Overview"));
const AiKnowledge = lazy(() => import("./admin/AiReceptionist/Knowledge"));
const AiSettingsPage = lazy(() => import("./admin/AiReceptionist/AiSettings"));
const AiConversations = lazy(() => import("./admin/AiReceptionist/Conversations"));
const AiCalls = lazy(() => import("./admin/AiReceptionist/Calls"));

// Service pages moved from /pages/<service> to /service/<service> (Vercel also 301-redirects).
function OldServicePath() {
  const { serviceSlug } = useParams();
  return <Navigate to={`/service/${serviceSlug}`} replace />;
}

function App() {
  const location = useLocation();
  const isAdminPath   = location.pathname.startsWith("/admin");
  const isAccountPath = location.pathname.startsWith("/account");
  const isDevPanel    = location.pathname.startsWith("/devpanel") || location.pathname.startsWith("/content-admin") || /^\/social(\/|$)/.test(location.pathname);
  // Logged-in, payment and admin pages are browser-only and kept out of search results
  // (vercel.json also sends an X-Robots-Tag header for them).
  const isPrivatePage = /^\/(admin|account|devpanel|payment|content-admin|social)(\/|$)/.test(location.pathname);

  // Creator / influencer links (?ref=CODE) are remembered for checkout and quotes.
  useEffect(() => { captureCreatorRef(location.search); }, [location.search]);

  return (
    <CustomerAuthProvider>
      {isPrivatePage && (
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
      )}
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <ScrollToTop />
        {!isAdminPath && !isAccountPath && !isDevPanel && <TopNav />}
        {!isAdminPath && !isAccountPath && !isDevPanel && <Navbar />}
        {isAccountPath && <Navbar />}

        <main className="grow">
          <Suspense fallback={<div className="min-h-[60vh]" />}>
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
            <Route path="/get-a-quote" element={<GetQuote />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/commercial-cleaning" element={<Contact commercialOnly />} />
            {/* Old address (Vercel also 301-redirects it); keeps ?type=commercial etc. */}
            <Route path="/pages/contact" element={<Navigate to={{ pathname: "/contact", search: location.search }} replace />} />
            <Route path="/service/:serviceSlug" element={<ServiceDetail />} />
            {/* Old address: /pages/<service> → /service/<service> */}
            <Route path="/pages/:serviceSlug" element={<OldServicePath />} />
            {/* Old address for the city centre page (renamed so it isn't confused with the football club) */}
            <Route path="/locations/manchester-city" element={<Navigate to="/locations/manchester-city-centre" replace />} />
            <Route path="/locations/:area" element={<LocationDetail />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/worker-app" element={<WorkerApp />} />

            {/* Customer Account Routes */}
            <Route path="/account/login" element={<CustomerLogin />} />
            <Route path="/account/signup" element={<CustomerSignup />} />
            <Route path="/account/dashboard" element={<CustomerDashboard />} />
            <Route path="/account/creator" element={<CreatorDashboard />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />

            {/* Dev Panel — standalone, no admin layout, own login */}
            <Route path="/devpanel" element={<DevPanel />} />

            {/* Admin Routes */}
            <Route path="/content-admin" element={<ContentAdmin />} />
            <Route path="/content-admin/login" element={<ContentLogin />} />
            <Route path="/social" element={<SocialApp />} />
            <Route path="/social/login" element={<SocialLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="content-editors" element={<ContentEditors />} />
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
              <Route path="generate-links" element={<GenerateLinksPage />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="rota" element={<Rota />} />
              <Route path="settings" element={<Settings />} />
              <Route path="chat" element={<Chat />} />
              <Route path="staff-pay" element={<StaffPay />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="commission" element={<Commission />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="automations" element={<Automations />} />
              <Route path="sms-automation" element={<SmsAutomation />} />
              <Route path="pipeline" element={<Pipeline />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="complaints" element={<Complaints />} />
              <Route path="contracts" element={<Contracts />} />
              <Route
                path="worker-performance"
                element={<WorkerPerformance />}
              />
              <Route path="referrals" element={<Referrals />} />
              <Route path="commercial" element={<CommercialHub />} />
              <Route path="property-report" element={<PropertyReport />} />
              <Route path="domestic" element={<DomesticHub />} />
              <Route path="pricelist" element={<PriceList />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="customers/:id" element={<CustomerProfile />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="jobs/:id" element={<JobDetail />} />
              <Route path="company-jobs" element={<CompanyJobs />} />
              <Route path="assign-jobs" element={<AssignJobs />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="job-visibility" element={<JobVisibility />} />
              <Route path="guide-distribution" element={<GuideDistribution />} />
              <Route path="cold-email" element={<ColdEmail />} />
              <Route path="cold-email/:campaignId" element={<CampaignDetail />} />
              <Route path="todo" element={<TodoPage />} />
              <Route path="ai" element={<AiReceptionistLayout />}>
                <Route index element={<AiOverview />} />
                <Route path="knowledge" element={<AiKnowledge />} />
                <Route path="settings" element={<AiSettingsPage />} />
                <Route path="conversations" element={<AiConversations />} />
                <Route path="calls" element={<AiCalls />} />
              </Route>
            </Route>
          </Routes>
          </Suspense>
        </main>

        {!isAdminPath && !isAccountPath && !isDevPanel && <Footer />}
        {!isAdminPath && !isDevPanel && <WhatsAppButton />}
        {!isAdminPath && !isDevPanel && <CookieBanner />}
      </div>
    </CustomerAuthProvider>
  );
}

export default App;
