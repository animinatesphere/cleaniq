import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { SERVICE_PAGES, servicePagePath } from "../utils/servicePages";
import { AREAS } from "../utils/areas";
import { whatsappLink } from "../utils/contact";
import { GOOGLE_RATING, GOOGLE_REVIEW_COUNT } from "../utils/googleReviews";
import GoogleReviewsSection from "../component/GoogleReviewsSection";
import {
  MapPin,
  CheckCircle2,
  Calendar,
  Star,
  ArrowRight,
  Home as HomeIcon,
  ShieldCheck,
  Sparkles,
  Leaf,
  MessageCircle,
} from "lucide-react";

import deepcleanImg from "../assets/deepclean.jpg";
import residentialImg from "../assets/residential.jpg";
import officeImg from "../assets/office.jpg";
import bento1Img from "../assets/bento1.jpg";
import grid1Img from "../assets/grid1.jpg";

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
    title: "Cleaning Services Chorlton | Domestic & Commercial | Cleaniq Services",
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
  },
  "manchester-city": {
    name: "Manchester City Centre",
    title: "Cleaning Services Manchester City Centre | Cleaniq Services",
    meta: "Trusted cleaners for Manchester city centre apartments, offices and Airbnbs. Deep cleaning, end of tenancy and commercial cleaning. Book online today.",
    tagline: "Premium Cleaning for Manchester City Centre Living",
    description: "Cleaniq Services is the go-to cleaning provider for Manchester's bustling city centre — from high-rise apartments in Deansgate and Ancoats to busy commercial units near Piccadilly. Our vetted, insured cleaners deliver consistent, 5-star results for residents, landlords and businesses alike.",
    services: [
      "End of Tenancy Cleaning in Manchester City Centre",
      "One-Off Deep Cleaning",
      "Airbnb & Short-Let Turnovers",
      "Commercial & Office Cleaning"
    ],
    faqs: [
      {
        q: "Do you offer end of tenancy cleaning in Manchester City Centre?",
        a: "Yes, Cleaniq Services provides professional end of tenancy cleaning across Manchester City Centre from our Swan Street office, helping tenants secure their full deposits. We follow a landlord-approved checklist and offer a 48-hour re-clean guarantee.",
      },
      {
        q: "How quickly can you book a cleaner in Manchester City Centre?",
        a: "We offer same-day and next-day bookings across Manchester City Centre, including Deansgate, Ancoats, Northern Quarter, and Piccadilly. Book online in under 60 seconds or call +44 7752 476368.",
      },
      {
        q: "What cleaning services do you provide in Manchester City Centre?",
        a: "We offer end of tenancy cleaning, deep cleaning, Airbnb and short-let turnovers, office and commercial cleaning, and general domestic cleaning across all Manchester City Centre postcodes including M1, M2, M3, M4, and M15.",
      },
      {
        q: "Are your Manchester City Centre cleaners vetted and insured?",
        a: "Yes. Every Cleaniq Services cleaner serving Manchester City Centre is background-checked, fully insured, and trained to our quality standard. We never send unvetted staff into your home or business.",
      },
      {
        q: "Do you clean Airbnb and short-let apartments in Manchester City Centre?",
        a: "Yes. We specialise in fast Airbnb turnovers for short-let properties across Manchester City Centre. Our team handles linen changes, restocking, and guest-ready quality checks — matching your check-out and check-in schedule.",
      },
    ],
  },
  "bolton": {
    name: "Bolton",
    title: "Professional Cleaning Services in Bolton | Cleaniq Services",
    meta: "Reliable home and office cleaning across Bolton. Deep cleaning, end of tenancy and regular cleans from fully vetted local cleaners. Get a free quote.",
    tagline: "Bolton's Trusted Cleaning Specialists",
    description: "Cleaniq Services brings dependable, high-standard cleaning to homes and businesses across Bolton. Whether it's a one-off deep clean before moving day or an ongoing regular clean, our local team treats every job with the same care and attention to detail.",
    services: [
      "End of Tenancy Cleaning in Bolton",
      "One-Off Deep Cleaning",
      "Regular Domestic Cleaning",
      "Commercial & Office Cleaning"
    ]
  },
  "bury": {
    name: "Bury",
    title: "Cleaning Services in Bury | Cleaniq Services",
    meta: "Professional, insured cleaners serving Bury and the surrounding areas. End of tenancy, deep cleaning and regular cleans. Book your clean today.",
    tagline: "Quality Cleaning You Can Rely On in Bury",
    description: "From family homes to local businesses, Cleaniq Services delivers thorough, reliable cleaning across Bury. Our fully vetted cleaners use eco-friendly products and a consistent checklist-based process, so every visit meets the same high standard.",
    services: [
      "End of Tenancy Cleaning in Bury",
      "One-Off Deep Cleaning",
      "Regular Domestic Cleaning",
      "Airbnb & Short-Let Turnovers"
    ]
  },
  "oldham": {
    name: "Oldham",
    title: "Professional Cleaners in Oldham | Cleaniq Services",
    meta: "Cleaniq Services offers expert deep cleaning, end of tenancy and regular cleaning across Oldham. Vetted, insured cleaners. Book online in minutes.",
    tagline: "Dependable Cleaning Across Oldham",
    description: "Cleaniq Services provides Oldham residents and businesses with thorough, professional cleaning they can count on. From end of tenancy cleans that satisfy strict landlord checklists to regular housekeeping, our local cleaners get the job done right every time.",
    services: [
      "End of Tenancy Cleaning in Oldham",
      "One-Off Deep Cleaning",
      "Regular Domestic Cleaning",
      "Commercial & Office Cleaning"
    ]
  },
  "rochdale": {
    name: "Rochdale",
    title: "Cleaning Services in Rochdale | Cleaniq Services",
    meta: "Trusted home and commercial cleaning in Rochdale. End of tenancy, deep cleaning and Airbnb turnovers from fully vetted local cleaners.",
    tagline: "Rochdale's Reliable Cleaning Partner",
    description: "Cleaniq Services serves homes, landlords and businesses across Rochdale with meticulous, eco-friendly cleaning. Our vetted team handles everything from deep cleans and end of tenancy turnarounds to fast Airbnb changeovers.",
    services: [
      "End of Tenancy Cleaning in Rochdale",
      "One-Off Deep Cleaning",
      "Airbnb & Short-Let Turnovers",
      "Commercial & Office Cleaning"
    ]
  },
  "stockport": {
    name: "Stockport",
    title: "Professional Cleaning Services in Stockport | Cleaniq Services",
    meta: "Stockport's trusted cleaning team for homes, offices and Airbnbs. Deep cleaning, end of tenancy and regular cleans. Book your local cleaner today.",
    tagline: "Stockport's Go-To Professional Cleaners",
    description: "Cleaniq Services delivers consistent, high-quality cleaning to homes and businesses throughout Stockport. From period properties near the town centre to modern offices, our vetted cleaners bring the same reliable standard to every job.",
    services: [
      "End of Tenancy Cleaning in Stockport",
      "One-Off Deep Cleaning",
      "Airbnb & Short-Let Turnovers",
      "Commercial & Office Cleaning"
    ]
  },
  "tameside": {
    name: "Tameside",
    title: "Cleaning Services in Tameside | Cleaniq Services",
    meta: "Reliable cleaning across Tameside including Ashton-under-Lyne, Hyde and Stalybridge. End of tenancy, deep cleaning and regular cleans available.",
    tagline: "Trusted Cleaning Across Tameside",
    description: "Cleaniq Services covers the whole of Tameside, including Ashton-under-Lyne, Hyde and Stalybridge, with thorough, professional cleaning for homes and businesses. Our local, vetted cleaners follow a consistent checklist so you always know what to expect.",
    services: [
      "End of Tenancy Cleaning in Tameside",
      "One-Off Deep Cleaning",
      "Regular Domestic Cleaning",
      "Commercial & Office Cleaning"
    ]
  },
  "trafford": {
    name: "Trafford",
    title: "Professional Cleaners in Trafford | Cleaniq Services",
    meta: "Cleaniq Services provides expert cleaning across Trafford, including Altrincham and Stretford. Deep cleaning, end of tenancy and Airbnb turnovers.",
    tagline: "Premium Cleaning Across Trafford",
    description: "From family homes in Altrincham to busy commercial spaces near Trafford Park, Cleaniq Services delivers dependable, high-standard cleaning across the borough. Our vetted, insured cleaners are trusted by residents, landlords and businesses alike.",
    services: [
      "End of Tenancy Cleaning in Trafford",
      "One-Off Deep Cleaning",
      "Airbnb & Short-Let Turnovers",
      "Commercial & Office Cleaning"
    ]
  },
  "wigan": {
    name: "Wigan",
    title: "Cleaning Services in Wigan | Cleaniq Services",
    meta: "Trusted cleaners serving Wigan and the surrounding boroughs. End of tenancy, deep cleaning and regular domestic cleaning. Get a free quote today.",
    tagline: "Wigan's Reliable Cleaning Specialists",
    description: "Cleaniq Services brings dependable, professional cleaning to homes and businesses across Wigan. Whether you need a thorough one-off deep clean or ongoing regular visits, our local, fully vetted cleaners deliver consistent 5-star results.",
    services: [
      "End of Tenancy Cleaning in Wigan",
      "One-Off Deep Cleaning",
      "Regular Domestic Cleaning",
      "Commercial & Office Cleaning"
    ]
  }
};

// Neighbourhoods each area's cleaners cover (shown as "Cleaners in …").
const NEIGHBOURHOODS = {
  "manchester-city": ["Deansgate", "Ancoats", "Northern Quarter", "Piccadilly", "Spinningfields", "Castlefield"],
  salford: ["Salford Quays", "MediaCityUK", "Eccles", "Swinton", "Pendleton", "Walkden"],
  trafford: ["Altrincham", "Sale", "Stretford", "Urmston", "Timperley", "Old Trafford"],
  stockport: ["Bramhall", "Cheadle", "Hazel Grove", "Marple", "Heaton Moor", "Edgeley"],
  didsbury: ["West Didsbury", "East Didsbury", "Withington", "Burnage", "Fallowfield", "Northenden"],
  chorlton: ["Chorlton-cum-Hardy", "Whalley Range", "Firswood", "Old Trafford", "Stretford", "Withington"],
  bolton: ["Horwich", "Farnworth", "Westhoughton", "Kearsley", "Little Lever", "Bromley Cross"],
  bury: ["Ramsbottom", "Radcliffe", "Prestwich", "Whitefield", "Tottington", "Summerseat"],
  oldham: ["Chadderton", "Royton", "Shaw", "Failsworth", "Saddleworth", "Lees"],
  rochdale: ["Heywood", "Middleton", "Littleborough", "Milnrow", "Castleton", "Norden"],
  tameside: ["Ashton-under-Lyne", "Hyde", "Stalybridge", "Denton", "Dukinfield", "Droylsden"],
  wigan: ["Leigh", "Ashton-in-Makerfield", "Hindley", "Standish", "Orrell", "Atherton"],
};

// FAQs every area page gets; an area's own FAQs come first.
const areaFaqs = (name, nearby) => [
  {
    q: `Do you have cleaners near me in ${name}?`,
    a: `Yes. Our local cleaners cover ${name}${nearby.length ? `, including ${nearby.slice(0, 4).join(", ")}` : ""}. Book online and we'll match you with a vetted cleaner near you.`,
  },
  {
    q: `What cleaning services do your cleaners offer in ${name}?`,
    a: `${SERVICE_PAGES.map((p) => p.name).join(", ")}. Each service page shows what's included and the latest prices.`,
  },
  {
    q: `Are your cleaners in ${name} vetted?`,
    a: "Yes. Every cleaner has a face-to-face interview, background checks and a practical skills assessment before their first job.",
  },
  {
    q: "Do I need to provide cleaning supplies?",
    a: "You can use your own products, or our cleaners bring eco-friendly cleaning products and equipment for £10 per visit.",
  },
  {
    q: "What if I'm not happy with the clean?",
    a: "Tell us within 48 hours and we'll send a cleaner back to re-clean it for free.",
  },
];

const BOOKING_STEPS = [
  { icon: Calendar, title: "Book online", desc: "Choose your cleaning service, the hours and a time that suits you." },
  { icon: MessageCircle, title: "We confirm", desc: "We confirm your booking by email. Questions? Message us on WhatsApp." },
  { icon: Sparkles, title: "Your cleaner arrives", desc: "A vetted local cleaner arrives on time and gets to work." },
];

const LocationDetail = () => {
  const { area } = useParams();
  const slug = area.toLowerCase();
  const locationData = LOCATIONS_MAP[slug];

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

  const { name } = locationData;
  const nearby = NEIGHBOURHOODS[slug] || [];
  const faqs = [...(locationData.faqs || []), ...areaFaqs(name, nearby)];
  const otherAreas = AREAS.filter((a) => a.slug !== slug);
  const whatsapp = whatsappLink(`Hi Cleaniq! I'm looking for a cleaner in ${name}.`);
  const whyUs = [
    { icon: ShieldCheck, title: "Vetted local cleaners", desc: `Interviewed, background-checked cleaners who work across ${name} and nearby.` },
    { icon: Sparkles, title: "48-hour re-clean guarantee", desc: "Not happy with any part of the clean? We'll come back and re-clean it for free." },
    { icon: Leaf, title: "Eco-friendly products", desc: "Use your own, or our cleaners bring eco-friendly products and equipment for £10." },
    { icon: Star, title: `${GOOGLE_RATING}★ on Google`, desc: `Rated ${GOOGLE_RATING} from ${GOOGLE_REVIEW_COUNT} Google reviews by our customers.` },
  ];

  return (
    <div className="pt-36 bg-slate-50 min-h-screen">
      <Helmet>
        <title>{`Cleaners in ${name} | Cleaning Services | Cleaniq`}</title>
        <meta name="description" content={locationData.meta} />
        <link
          rel="canonical"
          href={`https://www.cleaniqservices.com/locations/${area}`}
        />
        <meta property="og:title" content={`Cleaners in ${name} | Cleaning Services | Cleaniq`} />
        <meta property="og:description" content={locationData.meta} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "LocalBusiness",
              "name": "Cleaniq Services",
              "url": "https://www.cleaniqservices.com",
              "telephone": "+447752476368",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "20 Swan St",
                "addressLocality": "Manchester",
                "postalCode": "M4 5JW",
                "addressCountry": "GB"
              },
              "areaServed": [name, ...nearby],
              "priceRange": "££"
            },
            {
              "@type": "FAQPage",
              "mainEntity": faqs.map(f => ({
                "@type": "Question",
                "name": f.q,
                "acceptedAnswer": { "@type": "Answer", "text": f.a }
              }))
            }
          ]
        })}</script>
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
            {name}
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
              Professional Cleaners in <span className="text-primary">{name}</span>
            </h1>

            <p className="text-sm md:text-base font-extrabold text-slate-500 uppercase tracking-wider">
              {locationData.tagline}
            </p>

            <p className="text-slate-600 font-medium leading-relaxed">
              Looking for cleaners near you in {name}? Book a vetted local cleaner for regular house cleaning, a deep
              clean, end of tenancy, oven or carpet cleaning.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/booking" className="btn-primary py-4 px-7 text-sm flex items-center justify-center gap-2">
                Book a cleaner <ArrowRight size={16} />
              </Link>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="py-4 px-7 rounded-2xl border-2 border-primary/20 text-primary text-sm font-bold hover:border-primary transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle size={16} /> WhatsApp us
              </a>
            </div>
          </div>

          <div className="md:w-1/3 w-full bg-slate-50 p-6 rounded-3xl border border-slate-100 relative z-10 text-center">
            <h3 className="text-sm font-black text-primary-dark uppercase tracking-widest mb-4">Why Choose Us?</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3"><ShieldCheck size={16} className="text-emerald-500"/><span className="text-xs font-bold text-slate-600">Vetted Local Cleaners</span></div>
              <div className="flex items-center gap-3"><Star size={16} className="text-emerald-500"/><span className="text-xs font-bold text-slate-600">{GOOGLE_RATING}★ on Google ({GOOGLE_REVIEW_COUNT} reviews)</span></div>
              <div className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-500"/><span className="text-xs font-bold text-slate-600">Eco-Friendly Products</span></div>
              <div className="flex items-center gap-3"><Sparkles size={16} className="text-emerald-500"/><span className="text-xs font-bold text-slate-600">48-Hour Re-Clean Guarantee</span></div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-6">
            {/* Visual Image Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="col-span-2 h-64 md:h-80 rounded-[32px] overflow-hidden group">
                <img src={deepcleanImg} alt={`Deep cleaning by Cleaniq cleaners in ${name}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="h-48 md:h-64 rounded-[24px] overflow-hidden group">
                <img src={residentialImg} alt={`House cleaning in ${name}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="h-48 md:h-64 rounded-[24px] overflow-hidden group">
                <img src={officeImg} alt={`Office cleaning in ${name}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[36px] p-8 md:p-10 shadow-sm space-y-6">
              <h2 className="text-2xl font-black text-primary-dark">
                About Our {name} Cleaning Services
              </h2>
              <p className="text-slate-600 font-medium leading-relaxed">
                {locationData.description}
              </p>
              <p className="text-slate-600 font-medium leading-relaxed">
                Our cleaners in {name} can come weekly or fortnightly for regular house cleaning, or once for a deep
                clean, an end of tenancy clean before you hand back the keys, or an oven or carpet clean. Tell us how
                many hours you need, choose whether our cleaner brings supplies, and pick a time that suits you.
              </p>

              <div className="grid grid-cols-2 gap-4 my-8">
                <div className="h-40 rounded-2xl overflow-hidden group">
                  <img src={bento1Img} alt={`Cleaniq cleaners at work in ${name}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="h-40 rounded-2xl overflow-hidden group">
                  <img src={grid1Img} alt="Spotless results after a professional clean" loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full my-8" />

              <h3 className="text-lg font-bold text-primary-dark mb-4">
                Services Available in {name}:
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
          <div className="space-y-6 md:sticky md:top-32">
            <div className="bg-primary text-white rounded-[36px] p-8 shadow-xl shadow-primary/20 text-center space-y-6 relative overflow-hidden">
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-white/10 rounded-full" />
              <div className="space-y-2 relative z-10">
                <h3 className="text-xl font-black">Ready for a clean home?</h3>
                <p className="text-xs text-white/80 font-bold uppercase tracking-wider">
                  Book your local {name} cleaner
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

        {/* Services with photos */}
        <section>
          <h2 className="text-2xl md:text-4xl font-black text-primary-dark tracking-tight mb-3">
            Cleaning services in {name}
          </h2>
          <p className="text-slate-500 font-medium mb-8">
            Every cleaning service our cleaners offer near you. Tap one for prices and what's included.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICE_PAGES.map((p) => (
              <Link
                key={p.slug}
                to={servicePagePath(p.slug)}
                className="group block rounded-[28px] overflow-hidden bg-white border border-slate-100 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="aspect-[3/2] overflow-hidden">
                  <img
                    src={p.image(600)}
                    alt={p.imageAlt}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-5 flex items-center justify-between gap-3">
                  <span className="text-primary-dark font-black text-sm">
                    {p.name} in {name}
                  </span>
                  <ArrowRight size={16} className="text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Why choose our cleaners */}
        <section className="bg-white border border-slate-100 rounded-[40px] p-8 md:p-12 shadow-sm">
          <h2 className="text-2xl md:text-4xl font-black text-primary-dark tracking-tight mb-8">
            Why choose our cleaners in {name}?
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {whyUs.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100">
                <span className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon size={22} />
                </span>
                <div>
                  <h3 className="font-black text-primary-dark mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Neighbourhoods */}
        {nearby.length > 0 && (
          <section>
            <h2 className="text-2xl md:text-4xl font-black text-primary-dark tracking-tight mb-3">
              Cleaners near you in {name}
            </h2>
            <p className="text-slate-500 font-medium mb-8">
              Our {name} cleaners also cover these nearby neighbourhoods.
            </p>
            <div className="flex flex-wrap gap-3">
              {nearby.map((n) => (
                <span
                  key={n}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-sm font-bold text-primary-dark"
                >
                  <MapPin size={14} className="text-primary" /> Cleaners in {n}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* How to book */}
        <section className="bg-primary text-white rounded-[40px] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 rounded-full" />
          <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-8 relative">
            How to book a cleaner in {name}
          </h2>
          <div className="grid md:grid-cols-3 gap-5 relative">
            {BOOKING_STEPS.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="p-6 rounded-3xl bg-white/[0.07] border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 rounded-xl bg-white/10 text-secondary flex items-center justify-center">
                    <Icon size={18} />
                  </span>
                  <span className="text-xs font-black text-white/50 uppercase tracking-widest">Step {i + 1}</span>
                </div>
                <h3 className="text-lg font-black mb-2">{title}</h3>
                <p className="text-sm text-white/70 font-medium leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <GoogleReviewsSection />

      <div className="max-w-5xl mx-auto px-6 pb-24 space-y-12">
        {/* FAQ Section */}
        <div className="bg-white border border-slate-100 rounded-[40px] p-8 md:p-12 shadow-sm">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4">
              FAQs
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-primary-dark tracking-tight">
              Frequently Asked Questions — Cleaners in {name}
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group border border-slate-100 rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer font-bold text-slate-800 text-sm hover:bg-slate-50 transition-colors list-none">
                  <span>{faq.q}</span>
                  <span className="text-primary font-black text-lg group-open:rotate-45 transition-transform shrink-0 ml-4">+</span>
                </summary>
                <div className="px-5 pb-5 text-slate-500 text-sm font-medium leading-relaxed border-t border-slate-100 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Other areas */}
        <section>
          <h2 className="text-2xl md:text-3xl font-black text-primary-dark tracking-tight mb-6">
            Cleaners in nearby areas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {otherAreas.map((a) => (
              <Link
                key={a.slug}
                to={`/locations/${a.slug}`}
                className="flex items-center gap-2 p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all text-sm font-bold text-primary-dark"
              >
                <MapPin size={14} className="text-primary shrink-0" /> Cleaners in {a.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LocationDetail;
