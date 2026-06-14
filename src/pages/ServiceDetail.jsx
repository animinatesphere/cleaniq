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
  BadgeCheck,
  Clock,
  Sparkles,
  ChevronDown,
  Phone,
  MapPin,
} from "lucide-react";

/* ─── DATA ─────────────────────────────────────────────────────── */
const EOT_EXTENDED = {
  intro: `Whether you call it end of tenancy cleaning, move-out cleaning, vacate cleaning, or a checkout clean — Cleaniq Services delivers the same result: a spotless property that satisfies even the strictest landlord or letting agent in Manchester.`,

  whyChoosePoints: [
    {
      icon: <BadgeCheck size={22} />,
      title: "Landlord & Agent Approved",
      body: "Our checklist meets the exact inventory standards used by Manchester letting agencies — your property passes checkout first time.",
    },
    {
      icon: <ShieldCheck size={22} />,
      title: "48-Hour Re-Clean Guarantee",
      body: "If your landlord or agent raises any issue after our clean, we return and re-clean that area at no extra charge.",
    },
    {
      icon: <Clock size={22} />,
      title: "Same-Day & Weekend Booking",
      body: "Last-minute keys-back day? We offer same-day and weekend availability across all Manchester postcodes.",
    },
    {
      icon: <Sparkles size={22} />,
      title: "Eco-Friendly Products",
      body: "Non-toxic, eco-safe solutions — tough on grease and grime, gentle on your family and the environment.",
    },
  ],

  checklist: {
    heading: "Full End of Tenancy Cleaning Checklist",
    intro:
      "Our move-out clean covers every room and surface specified in standard tenancy agreements. Here is exactly what is included:",
    rooms: [
      {
        room: "Kitchen",
        tasks: [
          "Deep clean inside & outside all cupboards and drawers",
          "Full oven, hob, extractor fan, and microwave degreasing",
          "Fridge and freezer defrost & interior sanitization",
          "Dishwasher drum, filter, and door seal cleaning",
          "Sink, taps, and draining board descaling and polishing",
          "Splashback, wall tiles, and grout scrubbing",
          "Wipe-down of all worktops, skirting boards, and light switches",
        ],
      },
      {
        room: "Living Room & Bedrooms",
        tasks: [
          "Dusting of all surfaces, shelves, rails, and picture frames",
          "Interior window cleaning including sills and frames",
          "Vacuuming carpets with HEPA-filter equipment",
          "Hard floor mopping and edge skirting board cleaning",
          "Wardrobe & storage unit interior wipe-down",
          "Removal of cobwebs from ceilings and corners",
          "Light fittings, switches, and socket plate cleaning",
        ],
      },
      {
        room: "Bathrooms & En-Suites",
        tasks: [
          "Full toilet bowl, seat, cistern, and base sanitization",
          "Shower enclosure, tray, screen, and head descaling",
          "Bath, taps, and overflow cleaning and polishing",
          "Sink, vanity unit, and mirror streak-free cleaning",
          "Tile and grout mould removal treatment",
          "Extractor fan and ventilation grille cleaning",
          "Floor scrubbing and sealant line cleaning",
        ],
      },
      {
        room: "Hallways, Stairs & General Areas",
        tasks: [
          "Banister, spindle, and handrail wiping",
          "Front door, letterbox, and door frame cleaning",
          "Radiator panel and top-surface dusting",
          "Loft hatch or storage cupboard wipe-down",
          "Spot-cleaning of marked walls and scuff removal",
        ],
      },
    ],
  },

  whyMatters: {
    heading: "Why a Professional End of Tenancy Clean Matters",
    body: [
      "The most common reason tenants lose part or all of their deposit is cleanliness. Landlords and letting agents in Manchester are legally entitled to deduct from your security deposit if the property is not returned in the condition matching its original state.",
      "Unlike a standard domestic clean, a professional move-out clean follows a structured, room-by-room protocol aligned with lettings industry standards. Our tenancy cleaners in Manchester are trained specifically for this type of work — handling everything from limescale-encrusted bathrooms to grease-coated oven interiors.",
      "Booking a professional end of rental clean also saves you significant time during an already stressful moving period. Instead of spending your final days scrubbing appliances, you can focus on your move while our team handles the property to the standard your landlord expects.",
    ],
  },

  faqs: [
    {
      q: "How long does an end of tenancy clean take?",
      a: "A one-bedroom flat typically takes 3–4 hours, a two-bedroom property 4–6 hours, and larger homes 6–8+ hours. Our quotes include all the time needed to complete the job to the required standard.",
    },
    {
      q: "Does end of tenancy cleaning include carpet cleaning?",
      a: "Our standard clean includes thorough HEPA vacuum cleaning of all carpets. Professional carpet steam cleaning is available as an add-on and is often recommended if the tenancy agreement specifies professionally cleaned carpets.",
    },
    {
      q: "Do I need to be present during the move-out clean?",
      a: "No. Many clients hand over keys directly so our team can work while the tenant has already moved on. We complete the checkout clean and return the keys — simple and stress-free.",
    },
    {
      q: "What if my landlord or agent is not satisfied after the clean?",
      a: "Every job is covered by our 48-hour satisfaction guarantee. If your letting agent or landlord flags any area, we return and re-clean at no additional charge.",
    },
    {
      q: "What areas in Manchester do you cover?",
      a: "We cover all Manchester postcodes including City Centre, Didsbury, Chorlton, Salford, Stretford, Hulme, Fallowfield, Withington, Stockport, Trafford, Wythenshawe, and Longsight.",
    },
    {
      q: "Is end of tenancy cleaning different from a regular deep clean?",
      a: "Yes. An end of lease deep clean follows a specific tenancy checkout checklist aligned with letting agent standards — covering inside appliances, behind furniture, inside cupboards, and full limescale removal.",
    },
  ],

  testimonials: [
    {
      name: "Priya M.",
      location: "Didsbury, Manchester",
      text: "Used Cleaniq for my end of tenancy clean after four years in the flat. Got my full deposit back within 24 hours of checkout. The oven and bathroom looked brand new.",
      rating: 5,
    },
    {
      name: "James O.",
      location: "Salford, Manchester",
      text: "The letting agent commented it was one of the cleanest handbacks they had seen. 100% recommend Cleaniq for your move-out clean in Manchester.",
      rating: 5,
    },
    {
      name: "Sophie H.",
      location: "Chorlton, Manchester",
      text: "Booked same-day. They arrived on time, were thorough, and my landlord was thrilled. Full deposit returned, no deductions.",
      rating: 5,
    },
  ],

  manchesterAreas: [
    "City Centre", "Didsbury", "Chorlton", "Salford",
    "Stretford", "Hulme", "Fallowfield", "Withington",
    "Stockport", "Trafford", "Wythenshawe", "Longsight",
  ],

  seoFooter: `Cleaniq Services provides professional end of tenancy cleaning, move-out cleaning, vacate cleaning, checkout cleaning, and end of lease cleaning across Manchester. Whether you need a tenancy end clean in Manchester City Centre, Didsbury, Chorlton, Salford, Withington, Fallowfield, or Stockport — our vetted and insured tenancy cleaners are ready to help you secure your full deposit refund. Book your Manchester end of tenancy cleaning service online in 60 seconds or call +44 7752 476368.`,
};

const SERVICES_MAP = {
  "end-of-tenancy-cleaning-manchester": {
    title: "End of Tenancy Cleaning Manchester | Cleaniq Services",
    meta: "Professional end of tenancy cleaning in Manchester. Fully guaranteed, eco-friendly, and landlord-approved. Book vetted cleaners online in 60 seconds. Call +44 7752 476368.",
    heading: "End of Tenancy Cleaning in Manchester",
    tagline: "Landlord-Approved. Deposit-Protecting. Fully Guaranteed.",
    description:
      "Moving homes can be extremely stressful. Our specialised End of Tenancy cleaning team ensures your property is left in absolutely spotless condition, securing 100% of your deposit refund. We follow a comprehensive, landlord-approved cleaning checklist.",
    points: [
      "Vetted & insured professional local cleaners",
      "Complete cooker, oven, and fridge cleaning included",
      "Fully guaranteed for 48 hours — free recleans if needed",
      "Flexible weekend and same-day booking options",
    ],
    extended: true,
  },
  "deep-cleaning-manchester": {
    title: "Deep Cleaning Services Manchester | Cleaniq Services",
    meta: "One-off deep cleaning for homes and offices in Manchester. Thorough, eco-friendly, and affordable. Book expert deep cleaners online today with Cleaniq.",
    heading: "Deep Cleaning Services in Manchester",
    tagline: "Thorough, Eco-Friendly, Meticulous Refresh Cleans.",
    description:
      "Give your home or office a fresh start. Our expert deep cleaning service goes beyond regular housekeeping to reach hidden dirt, dust, and stubborn spots behind furniture, inside appliances, and deep within grout lines.",
    points: [
      "Complete sanitization of all high-contact surfaces",
      "Eco-friendly, chemical-free premium cleaning solutions",
      "Ideal for seasonal spring cleaning or pre-event preparation",
      "Specialized room-by-room thorough checklist",
    ],
  },
  "airbnb-cleaning-manchester": {
    title: "Airbnb Cleaning Manchester | Short-Let Property Cleaners",
    meta: "Reliable Airbnb and short-let cleaning in Manchester. Fast turnarounds, guest-ready results. Book professional Airbnb cleaners with Cleaniq Services.",
    heading: "Airbnb & Short-Let Cleaning in Manchester",
    tagline: "Fast Turnarounds, Guest-Ready Results, 5-Star Reviews.",
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
    title: "Office Cleaning Manchester | Commercial Cleaners | Cleaniq",
    meta: "Professional office and commercial cleaning services in Manchester. Flexible schedules, eco-friendly products. Get a free quote from Cleaniq Services today.",
    heading: "Office & Commercial Cleaning in Manchester",
    tagline: "Flexible Schedules, Spotless Workplaces, Consistent Quality.",
    description:
      "Boost employee productivity and make a lasting impression. We deliver dependable, flexible, and premium commercial cleaning services customized for corporate offices, retail spaces, and studios.",
    points: [
      "Flexible out-of-hours cleaning schedules (early morning or evening)",
      "Eco-friendly and non-toxic cleaning products for staff wellness",
      "Reliable commercial-grade floor, window, and desk sanitization",
      "Dedicated supervisor and consistent quality control audits",
    ],
  },
  "post-construction-cleaning-manchester": {
    title: "Post-Construction Cleaning Manchester | Cleaniq Services",
    meta: "Expert post-construction and builders cleaning in Manchester. Dust removal, debris clearance, and final handover cleans. Book Cleaniq Services today.",
    heading: "Post-Construction Cleaning in Manchester",
    tagline: "Industrial Dust Removal, Paint Spot Cleaning, Final Handover.",
    description:
      "Renovations and construction work leave behind fine drywall dust, residue, paint spots, and debris. Our industrial builders clean prepares your property for instant occupancy and final keys handover.",
    points: [
      "Complete HEPA filter vacuuming of fine plaster & cement dust",
      "Sanitization of windows, frames, hinges, and sockets",
      "Scraping and removal of paint droplets, glue, and sealants",
      "Ready-to-live handover certification cleans",
    ],
  },
};

/* ─── COMPONENTS ────────────────────────────────────────────────── */

const Stars = ({ count = 5 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
    ))}
  </div>
);

const SectionLabel = ({ children }) => (
  <p className="text-xs font-bold tracking-widest uppercase text-teal-600 mb-3">
    {children}
  </p>
);

const Divider = () => <div className="border-t border-slate-200 my-8 md:my-10" />;

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
        aria-expanded={open}
      >
        <span className="font-semibold text-slate-800 text-sm sm:text-base leading-snug group-hover:text-teal-700 transition-colors">
          {q}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-teal-600" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-5">
          <p className="text-slate-600 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
};

/* Mobile sticky CTA */
const MobileCTABar = ({ isEOT }) => (
  <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-4 py-3 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
    {isEOT && (
      <a
        href="tel:+447752476368"
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-[#00B5A4] text-[#00B5A4] font-bold text-sm"
      >
        <Phone size={15} /> Call
      </a>
    )}
    <Link
      to="/booking"
      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-[#00B5A4] text-white font-bold text-sm"
    >
      Book Now <ArrowRight size={15} />
    </Link>
  </div>
);

/* ─── MAIN PAGE ─────────────────────────────────────────────────── */
const ServiceDetail = () => {
  const { serviceSlug } = useParams();
  const service = SERVICES_MAP[serviceSlug];
  const isEOT = serviceSlug === "end-of-tenancy-cleaning-manchester";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [serviceSlug]);

  if (!service) {
    return (
      <div className="pt-40 pb-20 text-center space-y-4 px-6">
        <h1 className="text-2xl font-bold text-slate-900">Service Not Found</h1>
        <Link to="/" className="text-teal-600 font-semibold hover:underline">← Back to Home</Link>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white min-h-screen pb-28 md:pb-0" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <Helmet>
          <title>{service.title}</title>
          <meta name="description" content={service.meta} />
          <link rel="canonical" href={`https://www.cleaniqservices.com/pages/${serviceSlug}`} />
          <meta property="og:title" content={service.title} />
          <meta property="og:description" content={service.meta} />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              name: service.heading,
              description: service.description,
              areaServed: isEOT
                ? EOT_EXTENDED.manchesterAreas.map((a) => ({ "@type": "City", name: a }))
                : { "@type": "City", name: "Manchester" },
              provider: {
                "@type": "LocalBusiness",
                "@id": "https://www.cleaniqservices.com#localbusiness",
                name: "Cleaniq Services",
                telephone: "+447752476368",
                address: { "@type": "PostalAddress", addressLocality: "Manchester", addressCountry: "GB" },
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.9",
                reviewCount: "2000",
                bestRating: "5",
              },
            })}
          </script>
        </Helmet>

        {/* ══ HERO ═══════════════════════════════════════════════════ */}
        <div className="bg-primary text-white pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-10 xl:px-16">
          {/* Breadcrumb */}
          <nav className="flex items-center flex-wrap gap-x-2 gap-y-1  mt-2 text-xs text-slate-400 mb-8 tracking-wide">
            <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
              <HomeIcon size={12} /> Home
            </Link>
            <span>/</span>
            <Link to="/services" className="hover:text-white transition-colors">Services</Link>
            <span>/</span>
            <span className="text-slate-300">{serviceSlug.replace(/-/g, " ")}</span>
          </nav>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 items-end">
            <div className="md:col-span-2 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold tracking-widest uppercase">
                <MapPin size={11} /> Manchester · Certified Specialist
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
                {service.heading}
              </h1>
              <p className="text-slate-300 text-base sm:text-lg font-normal leading-relaxed max-w-2xl">
                {service.tagline}
              </p>
              {/* Trust row */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm text-slate-300">4.9 · <span className="text-white font-semibold">2,000+ cleans</span></span>
                </div>
                <span className="text-slate-600">|</span>
                <span className="text-sm text-slate-300">
                  <span className="text-white font-semibold">48-hr</span> re-clean guarantee
                </span>
              </div>
            </div>

            {/* Desktop CTA card — inside hero */}
            <div className="hidden md:block">
              <div className="bg-white rounded-xl p-6 shadow-2xl shadow-black/30">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Book your clean</p>
                <p className="text-2xl font-bold text-slate-900 mb-1">From £20 <span className="text-base font-normal text-slate-500">/ hr</span></p>
                <p className="text-xs text-slate-400 mb-5">No hidden fees · Insured cleaners</p>
                <Link
                  to="/booking"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg bg-[#00B5A4] text-white font-bold text-sm hover:bg-teal-600 transition-colors"
                >
                  Book in 60 Seconds <ArrowRight size={16} />
                </Link>
                {isEOT && (
                  <a
                    href="tel:+447752476368"
                    className="flex items-center justify-center gap-2 w-full py-3 mt-3 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm hover:border-teal-400 hover:text-teal-700 transition-colors"
                  >
                    <Phone size={14} /> +44 7752 476368
                  </a>
                )}
                <p className="text-center text-[11px] text-slate-400 mt-3">
                  48-hr satisfaction guarantee included
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ══ STAT BAR ═══════════════════════════════════════════════ */}
        <div className="bg-[#0A1520] text-white">
          <div className="px-4 sm:px-6 lg:px-10 xl:px-16 py-4 flex flex-wrap gap-6 sm:gap-10 items-center">
            {[
              { value: "2,000+", label: "Cleans completed" },
              { value: "4.9★", label: "Average rating" },
              { value: "48hr", label: "Re-clean guarantee" },
              { value: "100%", label: "Deposit protection goal" },
            ].map(({ value, label }) => (
              <div key={label} className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-bold text-teal-400">{value}</span>
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ PAGE BODY ══════════════════════════════════════════════ */}
        <div className="px-4 sm:px-6 lg:px-10 xl:px-16 py-10 sm:py-14">
          <div className="grid md:grid-cols-3 gap-10 md:gap-14 items-start">

            {/* ── LEFT: MAIN CONTENT ── */}
            <div className="md:col-span-2 space-y-0">

              {/* About the service */}
              <section>
                <SectionLabel>About this service</SectionLabel>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                  What's Included
                </h2>
                <p className="text-slate-600 leading-relaxed mb-5">{service.description}</p>
                {isEOT && (
                  <p className="text-slate-600 leading-relaxed mb-6">{EOT_EXTENDED.intro}</p>
                )}
                <div className="grid sm:grid-cols-2 gap-3">
                  {service.points.map((pt, i) => (
                    <div key={i} className="flex gap-3 items-start p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={11} className="stroke-[3]" />
                      </div>
                      <span className="text-slate-700 text-sm font-medium leading-snug">{pt}</span>
                    </div>
                  ))}
                </div>
              </section>

              {isEOT && (
                <>
                  <Divider />

                  {/* Why Choose Us */}
                  <section>
                    <SectionLabel>Why Cleaniq</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
                      Why Choose Cleaniq for Your End of Tenancy Clean?
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-5">
                      {EOT_EXTENDED.whyChoosePoints.map((pt, i) => (
                        <div key={i} className="flex gap-4 items-start">
                          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                            {pt.icon}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm mb-1">{pt.title}</p>
                            <p className="text-slate-500 text-sm leading-relaxed">{pt.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <Divider />

                  {/* Checklist */}
                  <section>
                    <SectionLabel>Room-by-room checklist</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                      {EOT_EXTENDED.checklist.heading}
                    </h2>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                      {EOT_EXTENDED.checklist.intro}
                    </p>
                    <div className="space-y-8">
                      {EOT_EXTENDED.checklist.rooms.map((room, i) => (
                        <div key={i}>
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-xs font-bold tracking-widest uppercase text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded">
                              {room.room}
                            </span>
                            <div className="flex-1 border-t border-slate-200" />
                          </div>
                          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
                            {room.tasks.map((task, j) => (
                              <div key={j} className="flex gap-2.5 items-start">
                                <Check size={13} className="text-teal-500 shrink-0 mt-0.5 stroke-[2.5]" />
                                <span className="text-slate-600 text-sm leading-snug">{task}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <Divider />

                  {/* Manchester Areas */}
                  <section>
                    <SectionLabel>Coverage</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                      Manchester Areas We Cover
                    </h2>
                    <p className="text-slate-500 text-sm mb-5 leading-relaxed">
                      Our end of tenancy cleaning team covers every Manchester postcode — from the city centre to the suburbs.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {EOT_EXTENDED.manchesterAreas.map((area) => (
                        <span
                          key={area}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full hover:border-teal-300 hover:text-teal-700 transition-colors"
                        >
                          <MapPin size={10} className="text-teal-500" />
                          {area}
                        </span>
                      ))}
                    </div>
                  </section>

                  <Divider />

                  {/* Why It Matters */}
                  <section>
                    <SectionLabel>The case for professionals</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-5">
                      {EOT_EXTENDED.whyMatters.heading}
                    </h2>
                    <div className="space-y-4">
                      {EOT_EXTENDED.whyMatters.body.map((para, i) => (
                        <p key={i} className="text-slate-600 leading-relaxed text-sm sm:text-base">
                          {para}
                        </p>
                      ))}
                    </div>
                  </section>

                  <Divider />

                  {/* Testimonials */}
                  <section>
                    <SectionLabel>Customer reviews</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
                      What Our Manchester Customers Say
                    </h2>
                    <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
                      {EOT_EXTENDED.testimonials.map((t, i) => (
                        <div
                          key={i}
                          className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                        >
                          <Stars count={t.rating} />
                          <p className="text-slate-700 text-sm leading-relaxed">
                            "{t.text}"
                          </p>
                          <div className="pt-1 border-t border-slate-200">
                            <p className="font-bold text-slate-900 text-xs">{t.name}</p>
                            <p className="text-slate-400 text-xs">{t.location}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <Divider />

                  {/* FAQs */}
                  <section>
                    <SectionLabel>Frequently asked questions</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                      End of Tenancy Cleaning Manchester — FAQs
                    </h2>
                    <div className="mt-4">
                      {EOT_EXTENDED.faqs.map((faq, i) => (
                        <FAQItem key={i} q={faq.q} a={faq.a} />
                      ))}
                    </div>
                  </section>

                  <Divider />

                  {/* SEO text */}
                  <section>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {EOT_EXTENDED.seoFooter}
                    </p>
                  </section>
                </>
              )}
            </div>

            {/* ── RIGHT: STICKY SIDEBAR (desktop only) ── */}
            <div className="hidden md:block">
              <div className="sticky top-28 space-y-5">

                {/* Booking card */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-[#0F1C2E] px-6 pt-6 pb-5">
                    <p className="text-teal-400 text-xs font-bold tracking-widest uppercase mb-1">Book your clean</p>
                    <p className="text-white text-3xl font-bold">From £20<span className="text-lg font-normal text-slate-400"> / hr</span></p>
                    <p className="text-slate-400 text-xs mt-1">No hidden fees · Fully insured</p>
                  </div>
                  <div className="p-6 bg-white space-y-3">
                    <div className="space-y-2.5">
                      {[
                        { icon: <ShieldCheck size={15} />, text: "Vetted & insured cleaners" },
                        { icon: <Calendar size={15} />, text: "Flexible scheduling" },
                        { icon: <Star size={15} />, text: "4.9★ from 2,000+ cleans" },
                      ].map(({ icon, text }) => (
                        <div key={text} className="flex items-center gap-2.5 text-sm text-slate-600">
                          <span className="text-teal-500">{icon}</span>
                          {text}
                        </div>
                      ))}
                    </div>
                    <div className="pt-2">
                      <Link
                        to="/booking"
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg bg-[#00B5A4] text-white font-bold text-sm hover:bg-teal-600 transition-colors"
                      >
                        Book in 60 Seconds <ArrowRight size={15} />
                      </Link>
                      {isEOT && (
                        <a
                          href="tel:+447752476368"
                          className="flex items-center justify-center gap-2 w-full py-3 mt-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm hover:border-teal-400 hover:text-teal-700 transition-colors"
                        >
                          <Phone size={14} /> +44 7752 476368
                        </a>
                      )}
                    </div>
                    {isEOT && (
                      <p className="text-center text-[11px] text-slate-400 pt-1">
                        48-hour re-clean guarantee on every job
                      </p>
                    )}
                  </div>
                </div>

                {/* Trust badges */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Our guarantees</p>
                  {[
                    "48-hour free re-clean if unsatisfied",
                    "Fully vetted & DBS-checked cleaners",
                    "Public liability insurance included",
                    "Eco-friendly, non-toxic products",
                  ].map((item) => (
                    <div key={item} className="flex gap-2.5 items-start">
                      <Check size={13} className="text-teal-500 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span className="text-slate-600 text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Manchester coverage compact */}
                {isEOT && (
                  <div className="border border-slate-200 rounded-xl p-5 bg-white">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Areas covered</p>
                    <div className="flex flex-wrap gap-1.5">
                      {EOT_EXTENDED.manchesterAreas.map((area) => (
                        <span key={area} className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <MobileCTABar isEOT={isEOT} />
    </>
  );
};

export default ServiceDetail;