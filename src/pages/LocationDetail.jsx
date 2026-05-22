import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  CheckCircle2,
  Calendar,
  Star,
  ArrowRight,
  Home as HomeIcon,
  ShieldCheck
} from "lucide-react";

const LOCATIONS_MAP = {
  "didsbury": {
    name: "Didsbury",
    title: "Professional Cleaning Services in Didsbury | Cleaniq Services",
    meta: "Top-rated cleaning services in Didsbury, Manchester. Eco-friendly deep cleaning, end of tenancy, and office cleaning. Book vetted cleaners online today.",
    tagline: "Didsbury's Most Trusted Eco-Friendly Cleaners",
    description: "Welcome to Cleaniq Services Didsbury. We provide premium, reliable domestic and commercial cleaning tailored to residents and businesses in the Didsbury area. Whether you need a comprehensive end of tenancy clean or a routine deep clean, our local team is here to help.",
    services: [
      "End of Tenancy Cleaning in Didsbury",
      "One-Off Deep Cleaning",
      "Airbnb & Short-Let Turnovers",
      "Post-Construction Cleaning"
    ]
  },
  "chorlton": {
    name: "Chorlton",
    title: "Cleaning Services Chorlton | Domestic & Commercial | Cleaniq",
    meta: "Reliable eco-friendly cleaners in Chorlton. Expert end of tenancy, Airbnb, and deep cleaning services. Get a free quote from Cleaniq Services.",
    tagline: "Premium House & Office Cleaning in Chorlton",
    description: "Cleaniq Services offers top-tier cleaning solutions for homes and offices across Chorlton. Our locally vetted and insured professionals deliver meticulous, eco-friendly cleaning, ensuring your space is pristine and healthy.",
    services: [
      "End of Tenancy Cleaning in Chorlton",
      "One-Off Deep Cleaning",
      "Airbnb & Short-Let Turnovers",
      "Commercial & Office Cleaning"
    ]
  },
  "salford": {
    name: "Salford",
    title: "Expert Cleaning Services Salford | Cleaniq Services",
    meta: "Professional cleaners serving Salford and Greater Manchester. Guaranteed end of tenancy cleans, office cleaning, and deep cleaning. Book in 60 seconds.",
    tagline: "Dedicated Professional Cleaning in Salford",
    description: "From luxury apartments at Salford Quays to bustling office spaces in the city centre, Cleaniq Services provides dependable, high-quality cleaning across Salford. Enjoy our 5-star guaranteed results.",
    services: [
      "End of Tenancy Cleaning in Salford",
      "One-Off Deep Cleaning",
      "Airbnb & Short-Let Turnovers",
      "Commercial & Office Cleaning"
    ]
  }
};

const LocationDetail = () => {
  const { area } = useParams();
  const locationData = LOCATIONS_MAP[area.toLowerCase()];

  if (!locationData) {
    return (
      <div className="pt-40 pb-20 text-center space-y-4">
        <h1 className="text-2xl font-black text-primary-dark">
          Location Not Found
        </h1>
        <p className="text-slate-500">We currently do not have a dedicated page for this area, but we likely still serve it!</p>
        <Link to="/booking" className="text-primary font-bold">
          Check Availability & Book
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-36 pb-24 bg-slate-50 min-h-screen">
      <Helmet>
        <title>{locationData.title}</title>
        <meta name="description" content={locationData.meta} />
        <link
          rel="canonical"
          href={`https://www.cleaniqservices.com/locations/${area}`}
        />
        <meta property="og:title" content={locationData.title} />
        <meta property="og:description" content={locationData.meta} />
      </Helmet>
      
      <div className="max-w-5xl mx-auto px-6 space-y-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
          <Link
            to="/"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <HomeIcon size={12} /> Home
          </Link>
          <span>/</span>
          <span className="text-primary-dark">Locations</span>
          <span>/</span>
          <span className="text-slate-500 truncate max-w-[200px]">
            {locationData.name}
          </span>
        </div>

        {/* Hero Banner Header */}
        <div className="bg-white border border-slate-200 rounded-[48px] p-8 md:p-16 shadow-xl shadow-slate-100/50 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-[100px] pointer-events-none" />
          
          <div className="space-y-6 relative z-10 md:w-2/3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
              <MapPin size={14} /> Local Manchester Cleaners
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold text-primary-dark tracking-tight leading-tight">
              Professional Cleaning Services in <span className="text-primary">{locationData.name}</span>
            </h1>

            <p className="text-sm md:text-base font-extrabold text-slate-500 uppercase tracking-wider">
              {locationData.tagline}
            </p>
          </div>
          
          <div className="md:w-1/3 w-full bg-slate-50 p-6 rounded-3xl border border-slate-100 relative z-10 text-center">
            <h3 className="text-sm font-black text-primary-dark uppercase tracking-widest mb-4">Why Choose Us?</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3"><ShieldCheck size={16} className="text-emerald-500"/><span className="text-xs font-bold text-slate-600">Fully Vetted & Insured</span></div>
              <div className="flex items-center gap-3"><Star size={16} className="text-emerald-500"/><span className="text-xs font-bold text-slate-600">5-Star Guaranteed</span></div>
              <div className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-500"/><span className="text-xs font-bold text-slate-600">Eco-Friendly Products</span></div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-[36px] p-8 md:p-10 shadow-sm space-y-6">
              <h2 className="text-2xl font-black text-primary-dark">
                About Our {locationData.name} Services
              </h2>
              <p className="text-slate-600 font-medium leading-relaxed">
                {locationData.description}
              </p>
              
              <div className="h-px bg-slate-100 w-full my-8" />
              
              <h3 className="text-lg font-bold text-primary-dark mb-4">
                Services Available in {locationData.name}:
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {locationData.services.map((svc, i) => (
                  <div key={i} className="flex gap-3 items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <CheckCircle2 size={18} className="text-primary shrink-0" />
                    <span className="text-primary-dark font-bold text-sm">
                      {svc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Booking Sidebar */}
          <div className="space-y-6">
            <div className="bg-primary text-white rounded-[36px] p-8 shadow-xl shadow-primary/20 text-center space-y-6 relative overflow-hidden">
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-white/10 rounded-full" />
              <div className="space-y-2 relative z-10">
                <h3 className="text-xl font-black">Ready for a clean home?</h3>
                <p className="text-xs text-white/80 font-bold uppercase tracking-wider">
                  Book your local {locationData.name} cleaner
                </p>
              </div>
              <Link
                to="/booking"
                className="btn-secondary w-full py-4 text-primary text-sm flex items-center justify-center gap-2 relative z-10"
              >
                Book Clean Now <ArrowRight size={16} />
              </Link>
            </div>
            
            <div className="bg-white p-6 rounded-[36px] border border-slate-200 shadow-sm text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Need Help?</p>
              <a href="tel:+447752476368" className="text-lg font-black text-primary-dark hover:text-primary transition-colors block">
                +44 7752 476368
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDetail;
