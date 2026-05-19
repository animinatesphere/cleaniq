import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  Calendar,
  Star,
  Check,
  ArrowRight,
  Home as HomeIcon,
} from "lucide-react";

const SERVICES_MAP = {
  "end-of-tenancy-cleaning-manchester": {
    title: "End of Tenancy Cleaning Manchester | CLEANIQ Services",
    meta: "Professional end of tenancy cleaning in Manchester. Fully guaranteed, eco-friendly, and landlord-approved. Book vetted cleaners online in 60 seconds. Call +44 7752 476368.",
    heading: "Professional End of Tenancy Cleaning in Manchester",
    tagline: "Landlord-Approved & Fully Guaranteed Move-Out Cleaning",
    description:
      "Moving homes can be extremely stressful. Our specialized End of Tenancy cleaning team ensures your property is left in absolutely spotless condition, securing 100% of your deposit refund! We follow a comprehensive, landlord-approved cleaning checklist.",
    points: [
      "Vetted & insured professional local cleaners",
      "Complete cooker, oven, and fridge cleaning included",
      "Fully guaranteed for 48 hours (free recleans if needed)",
      "Flexible weekend and same-day booking options",
    ],
  },
  "deep-cleaning-manchester": {
    title: "Deep Cleaning Services Manchester | CLEANIQ Services",
    meta: "One-off deep cleaning for homes and offices in Manchester. Thorough, eco-friendly, and affordable. Book expert deep cleaners online today with CLEANIQ.",
    heading: "Premium One-Off Deep Cleaning Services in Manchester",
    tagline: "Thorough, Eco-Friendly, and Meticulous Refresh Cleans",
    description:
      "Give your home or office space a fresh start. Our expert deep cleaning service goes beyond regular housekeeping to reach hidden dirt, dust, and stubborn spots behind furniture, inside appliances, and deep within grout lines.",
    points: [
      "Complete sanitization of all high-contact surfaces",
      "Eco-friendly, chemical-free premium cleaning solutions",
      "Ideal for seasonal spring cleaning or pre-event preparation",
      "Specialized room-by-room thorough checklist",
    ],
  },
  "airbnb-cleaning-manchester": {
    title: "Airbnb Cleaning Manchester | Short-Let Property Cleaners",
    meta: "Reliable Airbnb and short-let cleaning in Manchester. Fast turnarounds, guest-ready results. Book professional Airbnb cleaners with CLEANIQ Services.",
    heading: "Five-Star Airbnb & Short-Let Property Cleaning Manchester",
    tagline: "Fast Turnarounds, Guest-Ready Results & Pristine Linen Care",
    description:
      "Maximize your short-let bookings and maintain outstanding 5-star host reviews. Our rapid-response Airbnb cleaners handle fast-turnaround property turnovers, restocking toiletries, laundry, and guest-ready quality checks.",
    points: [
      "Guaranteed same-day turnaround matching guest check-out times",
      "Restocking of essentials & welcome pack styling",
      "Linen and towel laundry replacement coordination",
      "Photo updates & site damage notification logs",
    ],
  },
  "office-cleaning-manchester": {
    title: "Office Cleaning Manchester | Commercial Cleaners | CLEANIQ",
    meta: "Professional office and commercial cleaning services in Manchester. Flexible schedules, eco-friendly products. Get a free quote from CLEANIQ Services today.",
    heading: "Professional Office & Commercial Cleaning in Manchester",
    tagline: "Flexible Corporate Schedules & Spotless Productive Workplaces",
    description:
      "Boost employee productivity and make a lasting impression on your clients. We deliver dependable, flexible, and premium commercial janitorial cleaning services customized for corporate offices, retail spaces, and studios.",
    points: [
      "Flexible out-of-hours cleaning schedules (early morning or evening)",
      "Eco-friendly and non-toxic cleaning products for staff wellness",
      "Reliable commercial-grade floor, window, and desk sanitization",
      "Dedicated supervisor and consistent quality control audits",
    ],
  },
  "post-construction-cleaning-manchester": {
    title: "Post-Construction Cleaning Manchester | CLEANIQ Services",
    meta: "Expert post-construction and builders cleaning in Manchester. Dust removal, debris clearance, and final handover cleans. Book CLEANIQ Services today.",
    heading: "Expert Post-Construction & Builders Cleaning Manchester",
    tagline:
      "Industrial Dust Removal, Paint Spot Cleaning & Final Handover Cleans",
    description:
      "Renovations and construction work leave behind massive amounts of fine drywall dust, residue, paint spots, and debris. Our industrial builders clean prepares your property for instant, immaculate occupancy and final keys handover.",
    points: [
      "Complete HEPA filter vacuuming of fine plaster & cement dust",
      "Sanitization of windows, frames, hinges, and sockets",
      "Scraping and removal of paint droplets, glue, and sealants",
      "Ready-to-live handover certification cleans",
    ],
  },
};

const ServiceDetail = () => {
  const { serviceSlug } = useParams();
  const service = SERVICES_MAP[serviceSlug];

  // If slug is not found, fallback gracefully
  if (!service) {
    return (
      <div className="pt-40 pb-20 text-center space-y-4">
        <h1 className="text-2xl font-black text-primary-dark">
          Service Page Not Found
        </h1>
        <Link to="/" className="text-primary font-bold">
          Go Back Home
        </Link>
      </div>
    );
  }

  useEffect(() => {
    // keep for potential analytics hooks; primary SEO handled via Helmet below
  }, [serviceSlug]);

  return (
    <div className="pt-36 pb-24 bg-slate-50 min-h-screen">
      <Helmet>
        <title>{service.title}</title>
        <meta name="description" content={service.meta} />
        <link
          rel="canonical"
          href={`https://www.cleaniqservices.com/pages/${serviceSlug}`}
        />
        <meta property="og:title" content={service.title} />
        <meta property="og:description" content={service.meta} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.heading,
            description: service.description,
            provider: {
              "@type": "LocalBusiness",
              "@id": "https://www.cleaniqservices.com#localbusiness",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              reviewCount: "2000",
              bestRating: "5",
            },
            review: [
              {
                "@type": "Review",
                author: { "@type": "Person", name: "Samantha R" },
                datePublished: "2026-04-12",
                reviewBody:
                  "Fantastic service — reliable, meticulous and professional. Would highly recommend!",
                reviewRating: {
                  "@type": "Rating",
                  ratingValue: "5",
                  bestRating: "5",
                },
              },
              {
                "@type": "Review",
                author: { "@type": "Person", name: "Mark T" },
                datePublished: "2026-03-01",
                reviewBody:
                  "Great team and easy booking. House looked brand new.",
                reviewRating: {
                  "@type": "Rating",
                  ratingValue: "5",
                  bestRating: "5",
                },
              },
            ],
          })}
        </script>
      </Helmet>
      <div className="max-w-4xl mx-auto px-6 space-y-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
          <Link
            to="/"
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <HomeIcon size={12} /> Home
          </Link>
          <span>/</span>
          <span className="text-primary-dark">Services</span>
          <span>/</span>
          <span className="text-slate-500 truncate max-w-[200px]">
            {serviceSlug.replace(/-/g, " ")}
          </span>
        </div>

        {/* Hero Banner Header */}
        <div className="bg-white border border-slate-200 rounded-[48px] p-8 md:p-12 shadow-xl shadow-slate-100/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-[100px] pointer-events-none" />
          <div className="space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
              <Star size={14} /> Certified Specialist Clean
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold text-primary-dark tracking-tight leading-tight">
              {service.heading}
            </h1>

            <p className="text-sm md:text-base font-extrabold text-primary uppercase tracking-wider">
              {service.tagline}
            </p>
          </div>
        </div>

        {/* Info Grid Content */}
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {/* Main Copy Column */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-[36px] p-8 shadow-sm space-y-6">
              <h2 className="text-2xl font-black text-primary-dark">
                Service Description
              </h2>
              <p className="text-slate-600 font-medium leading-relaxed">
                {service.description}
              </p>

              <div className="h-px bg-slate-100 w-full" />

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-primary-dark">
                  What is Included:
                </h3>
                <div className="grid gap-3">
                  {service.points.map((pt, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check size={14} className="stroke-[3]" />
                      </div>
                      <span className="text-slate-600 font-semibold text-sm">
                        {pt}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Booking / CTA Sidebar */}
          <div className="space-y-6">
            <div className="bg-primary text-white rounded-[36px] p-8 shadow-xl shadow-primary/20 text-center space-y-6 relative overflow-hidden">
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-white/10 rounded-full" />

              <div className="space-y-2 relative z-10">
                <h3 className="text-xl font-black">Book in 60 Secs</h3>
                <p className="text-xs text-white/80 font-bold uppercase tracking-wider">
                  Starting at just £20/hr
                </p>
              </div>

              <div className="space-y-4 relative z-10 pt-4">
                <div className="flex items-center gap-3 text-left">
                  <ShieldCheck size={20} className="text-secondary shrink-0" />
                  <span className="text-xs font-bold leading-normal">
                    Vetted, Backed & Insured Cleaners
                  </span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <Calendar size={20} className="text-secondary shrink-0" />
                  <span className="text-xs font-bold leading-normal">
                    Flexible Custom Schedules
                  </span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <Star size={20} className="text-secondary shrink-0" />
                  <span className="text-xs font-bold leading-normal">
                    5-Star Guaranteed Results
                  </span>
                </div>
              </div>

              <Link
                to="/booking"
                className="btn-secondary w-full py-4 text-primary text-sm flex items-center justify-center gap-2 relative z-10"
              >
                Book Clean Now <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
