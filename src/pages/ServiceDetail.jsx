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
    "Manchester City",
    "Salford",
    "Bolton",
    "Bury",
    "Oldham",
    "Rochdale",
    "   Stockport",
    "Tameside",
    "Trafford",
    "Wigan",
  ],

  seoFooter: `Cleaniq Services provides professional end of tenancy cleaning, move-out cleaning, vacate cleaning, checkout cleaning, and end of lease cleaning across Manchester. Whether you need a tenancy end clean in Manchester City Centre, Didsbury, Chorlton, Salford, Withington, Fallowfield, or Stockport — our vetted and insured tenancy cleaners are ready to help you secure your full deposit refund. Book your Manchester end of tenancy cleaning service online in 60 seconds or call +44 7752 476368.`,
};

const DEEP_EXTENDED = {
  intro: `Whether your home needs a post-party refresh, a seasonal spring clean, or a thorough reset after months of regular use — Cleaniq's deep cleaning service in Manchester goes further than any standard domestic clean. We reach the places your regular cleaner doesn't.`,

  whyChoosePoints: [
    {
      icon: <Sparkles size={22} />,
      title: "Beyond Surface-Level Cleaning",
      body: "We clean inside appliances, behind furniture, inside cupboards, and along skirting boards — every hidden area included as standard.",
    },
    {
      icon: <ShieldCheck size={22} />,
      title: "Satisfaction Guaranteed",
      body: "Not happy with any area? We return within 48 hours and re-clean it free of charge — no questions asked.",
    },
    {
      icon: <Clock size={22} />,
      title: "Flexible One-Off Bookings",
      body: "No contracts. No subscriptions. Book a one-off deep clean for any occasion — move-in, post-renovation, or just a fresh start.",
    },
    {
      icon: <BadgeCheck size={22} />,
      title: "Vetted & Insured Cleaners",
      body: "Every Cleaniq cleaner is background-checked, fully insured, and trained in our detailed deep cleaning protocol.",
    },
  ],

  checklist: {
    heading: "Full Deep Cleaning Checklist — Manchester",
    intro:
      "Our deep clean covers every room from top to bottom. Here is exactly what is included in every booking:",
    rooms: [
      {
        room: "Kitchen",
        tasks: [
          "Full oven interior degreasing and rack scrubbing",
          "Hob, extractor fan filter, and microwave deep clean",
          "Inside and outside all cupboards and drawers",
          "Fridge interior sanitization and shelf cleaning",
          "Sink, taps, and draining board descaling",
          "Splashback tiles and grout scrubbing",
          "Worktops, skirting boards, and light switch wipe-down",
        ],
      },
      {
        room: "Living Room & Bedrooms",
        tasks: [
          "Full dusting of all surfaces, shelves, and furniture tops",
          "Vacuuming carpets and upholstery with HEPA equipment",
          "Hard floor deep mop including edges and corners",
          "Interior window and sill cleaning",
          "Wardrobe and storage unit interior wipe-down",
          "Cobweb removal from ceilings and corners",
          "Light fittings, switches, and socket plate cleaning",
        ],
      },
      {
        room: "Bathrooms",
        tasks: [
          "Full toilet bowl, cistern, seat, and base sanitization",
          "Shower enclosure, screen, head, and tray descaling",
          "Bath, taps, and overflow deep clean and polish",
          "Tile and grout mould removal treatment",
          "Extractor fan and ventilation grille cleaning",
          "Mirror and vanity streak-free clean",
          "Floor scrubbing and sealant line cleaning",
        ],
      },
      {
        room: "Hallways & General Areas",
        tasks: [
          "Banister, handrail, and spindle wipe-down",
          "Front door, frame, and letterbox cleaning",
          "Radiator panel and top-surface dusting",
          "Spot-cleaning of marked walls and scuff removal",
          "Storage cupboard and loft hatch wipe-down",
        ],
      },
    ],
  },

  whyMatters: {
    heading: "Why a Professional Deep Clean Makes a Difference",
    body: [
      "Regular cleaning maintains a home — but it rarely reaches the accumulated grime in hidden areas: inside oven cavities, behind appliances, along grout lines, and underneath furniture. Over time, these areas harbour bacteria, allergens, and odours that a standard weekly clean simply cannot address.",
      "A professional deep clean from Cleaniq resets your property to a hygienic baseline. Our Manchester cleaners follow a structured, room-by-room protocol using eco-friendly, non-toxic products that are powerful enough to cut through grease and limescale — without harsh chemicals that affect your family or pets.",
      "Whether you're preparing for guests, recovering from a renovation, moving into a new property, or simply want a fresh start — a one-off deep clean is the most effective way to restore your home to its best condition.",
    ],
  },

  faqs: [
    {
      q: "How long does a deep clean take?",
      a: "A one-bedroom flat typically takes 3–5 hours. A three-bedroom house usually requires 6–8 hours. Larger properties or heavily soiled homes may take longer — we factor this into your quote.",
    },
    {
      q: "What is the difference between a deep clean and a regular clean?",
      a: "A regular clean covers surface areas — vacuuming, mopping, wiping down surfaces. A deep clean goes further: inside appliances, behind furniture, inside cupboards, grout lines, and all high-contact areas that accumulate grime over time.",
    },
    {
      q: "Do I need to be home during the deep clean?",
      a: "No. Many clients provide a key or access code. Our fully vetted and insured cleaners will complete the job and secure the property when finished.",
    },
    {
      q: "Do you bring your own cleaning products and equipment?",
      a: "Yes. Our team arrives fully equipped with professional-grade, eco-friendly cleaning products and HEPA-filter vacuum equipment — no need to supply anything.",
    },
    {
      q: "What Manchester areas do you cover for deep cleaning?",
      a: "We cover all of Greater Manchester including City Centre, Didsbury, Chorlton, Salford, Stretford, Fallowfield, Withington, Stockport, Trafford, Wythenshawe, and surrounding areas.",
    },
    {
      q: "Is carpet cleaning included in a deep clean?",
      a: "Our deep clean includes thorough HEPA vacuuming of all carpets. Professional steam carpet cleaning is available as a paid add-on and can be booked alongside your deep clean.",
    },
  ],

  testimonials: [
    {
      name: "Rachel T.",
      location: "Chorlton, Manchester",
      text: "Absolutely incredible. The kitchen alone took two hours but it looks brand new. I had no idea how much grime had built up. Worth every penny.",
      rating: 5,
    },
    {
      name: "Daniel K.",
      location: "Fallowfield, Manchester",
      text: "Moved into a new flat that hadn't been properly cleaned in years. Cleaniq transformed it in a single visit. Can't recommend them enough.",
      rating: 5,
    },
    {
      name: "Anna M.",
      location: "Didsbury, Manchester",
      text: "Used Cleaniq before hosting a family gathering. The team was professional, thorough, and the house has never looked better.",
      rating: 5,
    },
  ],

  manchesterAreas: [
    "City Centre",
    "Didsbury",
    "Chorlton",
    "Salford",
    "Stretford",
    "Fallowfield",
    "Withington",
    "Stockport",
    "Trafford",
    "Wythenshawe",
    "Longsight",
    "Hulme",
  ],

  seoFooter: `Cleaniq Services provides professional deep cleaning, one-off cleaning, and thorough refresh cleans across Manchester. Whether you need a deep clean in Manchester City Centre, Didsbury, Chorlton, Salford, Fallowfield, Withington, or Stockport — our vetted and insured cleaners deliver a guaranteed result. Book your Manchester deep cleaning service online in 60 seconds or call +44 7752 476368.`,
};

const AIRBNB_EXTENDED = {
  intro: `Running a successful Airbnb or short-let property in Manchester depends on one thing above all else — consistent, guest-ready cleanliness. Cleaniq's specialist Airbnb cleaning team delivers fast, reliable turnovers that protect your ratings and keep your calendar full.`,

  whyChoosePoints: [
    {
      icon: <Star size={22} />,
      title: "5-Star Guest-Ready Results",
      body: "We clean to the standard guests expect from a hotel — every surface, every fixture, every time.",
    },
    {
      icon: <Clock size={22} />,
      title: "Same-Day Turnaround",
      body: "We work around your check-out and check-in times so your property is always ready for the next guest without delay.",
    },
    {
      icon: <BadgeCheck size={22} />,
      title: "Damage & Inventory Reports",
      body: "Our team photographs and logs any damage or inventory issues found during each turnover — keeping you informed and protected.",
    },
    {
      icon: <Sparkles size={22} />,
      title: "Consumable Restocking",
      body: "We restock toiletries, toilet rolls, and welcome essentials so your guests always arrive to a fully prepared property.",
    },
  ],

  checklist: {
    heading: "Airbnb Turnover Cleaning Checklist — Manchester",
    intro:
      "Every Cleaniq Airbnb turnover covers the full property to hotel standard. Here is exactly what is completed on every visit:",
    rooms: [
      {
        room: "Kitchen",
        tasks: [
          "Full wipe-down of all surfaces and appliance exteriors",
          "Hob, microwave, and kettle cleaning",
          "Dishwasher emptying and reset",
          "Fridge check and wipe-down of interior shelves",
          "Sink, taps, and draining board polish",
          "Rubbish removal and bin liner replacement",
          "Crockery, cutlery, and glassware check and reposition",
        ],
      },
      {
        room: "Bedrooms",
        tasks: [
          "Full linen change and hotel-style bed making",
          "Dusting of all furniture surfaces and headboards",
          "Vacuuming of carpets and under beds",
          "Wardrobe interior check and tidy",
          "Mirror and window sill wipe-down",
          "Pillow and cushion arrangement",
          "Welcome item placement if provided",
        ],
      },
      {
        room: "Bathrooms",
        tasks: [
          "Full toilet sanitization — bowl, seat, and cistern",
          "Shower and bath deep scrub and descaling",
          "Mirror and vanity streak-free clean",
          "Fresh towel folding and placement",
          "Toiletry restocking as required",
          "Floor mopping and grout spot-clean",
          "Extractor fan grille wipe-down",
        ],
      },
      {
        room: "Living Areas & Hallways",
        tasks: [
          "Sofa cushion plumping and arrangement",
          "Dusting of all surfaces, shelves, and TV units",
          "Vacuuming and mopping of all floors",
          "Window sill and interior glass wipe-down",
          "Hallway and entrance area sweep and mop",
          "Damage and inventory check with photo log",
        ],
      },
    ],
  },

  whyMatters: {
    heading: "Why Professional Airbnb Cleaning Protects Your Listing",
    body: [
      "On platforms like Airbnb and Vrbo, cleanliness is the single most-reviewed category by guests. A single low cleanliness score can suppress your listing in search results, reduce booking rates, and damage a reputation built over months or years.",
      "Professional short-let cleaning is not simply about tidiness — it is about consistency. Every guest expects the same standard, every time. Cleaniq's Airbnb cleaning team in Manchester follows a fixed turnover protocol so your property meets the same high standard whether it is your first guest or your five-hundredth.",
      "Beyond cleanliness, our turnover team also checks for unreported damage, missing inventory, and maintenance issues — giving you the information you need to protect your property and resolve any disputes with your hosting platform.",
    ],
  },

  faqs: [
    {
      q: "How quickly can you turn over an Airbnb property?",
      a: "Most one and two-bedroom properties can be turned over within 2–3 hours between check-out and check-in. Larger properties are quoted individually. We work to your specific check-in time.",
    },
    {
      q: "Do you provide linen and towels?",
      a: "We can launder linen and towels on-site if your property has a washing machine and dryer. We can also coordinate with a linen service if you require off-site laundering.",
    },
    {
      q: "Can you manage multiple properties?",
      a: "Yes. We work with Manchester Airbnb hosts managing single properties and large portfolios alike. We can coordinate across multiple properties and integrate with your Airbnb calendar.",
    },
    {
      q: "What happens if a guest causes damage?",
      a: "Our team photographs and logs any damage discovered during the turnover and notifies you immediately — giving you documentation to support a claim with Airbnb or your insurer.",
    },
    {
      q: "Do you cover all Manchester Airbnb areas?",
      a: "Yes. We cover all Greater Manchester postcodes including City Centre, Salford, Didsbury, Chorlton, Fallowfield, Stretford, and surrounding areas.",
    },
  ],

  testimonials: [
    {
      name: "Marcus L.",
      location: "Manchester City Centre",
      text: "I manage four Airbnb apartments and Cleaniq handles all of them. Reliable, consistent, and my guests always comment on the cleanliness. Five stars every time.",
      rating: 5,
    },
    {
      name: "Fatima O.",
      location: "Salford, Manchester",
      text: "As a Superhost, cleanliness is everything. Cleaniq has never let me down — same-day turnaround, always guest-ready.",
      rating: 5,
    },
    {
      name: "Tom W.",
      location: "Chorlton, Manchester",
      text: "Professional, thorough, and they even flag maintenance issues I wasn't aware of. Exactly what you need as a short-let host.",
      rating: 5,
    },
  ],

  manchesterAreas: [
    "City Centre",
    "Salford",
    "Didsbury",
    "Chorlton",
    "Fallowfield",
    "Stretford",
    "Hulme",
    "Withington",
    "Stockport",
    "Trafford",
    "Wythenshawe",
    "Longsight",
  ],

  seoFooter: `Cleaniq Services provides professional Airbnb cleaning, short-let property cleaning, and holiday let turnovers across Manchester. Whether you need a same-day Airbnb clean in Manchester City Centre, Salford, Didsbury, Chorlton, or Stockport — our experienced turnover team delivers a guest-ready finish every time. Book your Manchester Airbnb cleaning service online or call +44 7752 476368.`,
};

const OFFICE_EXTENDED = {
  intro: `A clean workplace is not just about appearances — it directly affects staff wellbeing, productivity, and the impression you make on every client who walks through your door. Cleaniq delivers reliable, professional office cleaning across Manchester on a schedule that works around your business.`,

  whyChoosePoints: [
    {
      icon: <BadgeCheck size={22} />,
      title: "Consistent Quality Control",
      body: "Every clean is supervised and audited against a fixed checklist — so your workplace meets the same standard on every visit.",
    },
    {
      icon: <Clock size={22} />,
      title: "Out-of-Hours Scheduling",
      body: "We work early mornings, evenings, and weekends — so your team arrives to a clean office without any disruption to your working day.",
    },
    {
      icon: <ShieldCheck size={22} />,
      title: "Fully Insured & Vetted",
      body: "All Cleaniq commercial cleaners carry full public liability insurance and are background-checked for your peace of mind.",
    },
    {
      icon: <Sparkles size={22} />,
      title: "Eco-Friendly Products",
      body: "We use non-toxic, allergen-free commercial cleaning products — safer for your staff, compliant with health and safety standards.",
    },
  ],

  checklist: {
    heading: "Office Cleaning Checklist — Manchester",
    intro:
      "Our commercial cleaning service covers every area of your workspace. Here is what is included in every scheduled visit:",
    rooms: [
      {
        room: "Workstations & Open Plan",
        tasks: [
          "Desk surface sanitization and wipe-down",
          "Monitor, keyboard, and phone disinfection",
          "Chair back and armrest wiping",
          "Emptying and relining of all desk bins",
          "Dusting of shelves, partitions, and storage units",
          "Vacuuming of carpeted areas and floor edges",
          "Hard floor sweeping and mopping",
        ],
      },
      {
        room: "Kitchen & Break Room",
        tasks: [
          "Worktop, sink, and tap sanitization",
          "Microwave and kettle exterior wipe-down",
          "Fridge exterior and handle cleaning",
          "Cupboard fronts and handle wipe-down",
          "Rubbish removal and bin liner replacement",
          "Dishwasher reset and cycle start if needed",
          "Floor mopping and skirting board wipe",
        ],
      },
      {
        room: "Toilets & Washrooms",
        tasks: [
          "Full toilet bowl, seat, and cistern sanitization",
          "Sink, tap, and mirror cleaning and polishing",
          "Soap dispenser and paper towel restocking",
          "Floor scrubbing and grout spot-clean",
          "Bin emptying and fresh liner replacement",
          "Extractor fan and ventilation grille cleaning",
        ],
      },
      {
        room: "Reception & Common Areas",
        tasks: [
          "Reception desk and visitor seating wipe-down",
          "Glass entrance door and partition cleaning",
          "Hallway and stairwell vacuuming and mopping",
          "Light switch and handrail sanitization",
          "Meeting room table and chair wipe-down",
          "Window sill dusting and interior glass clean",
        ],
      },
    ],
  },

  whyMatters: {
    heading: "Why Professional Office Cleaning Matters for Your Business",
    body: [
      "The cleanliness of your workplace sends a message — to your staff, your clients, and anyone who visits your premises. A consistently clean office communicates professionalism, attention to detail, and respect for the people who work there.",
      "Beyond perception, workplace hygiene has a measurable impact on staff health and productivity. Studies consistently show that cleaner work environments reduce sick days and improve focus. Regular professional cleaning — particularly of high-contact surfaces like door handles, keyboards, and shared kitchen areas — significantly reduces the spread of illness.",
      "Cleaniq's commercial cleaning team in Manchester works to a fixed, audited checklist — not a loose routine. Every visit meets the same standard, and our supervisors perform quality checks to ensure your expectations are consistently met.",
    ],
  },

  faqs: [
    {
      q: "How often should an office be professionally cleaned?",
      a: "Most offices benefit from daily or three-times-weekly cleaning. High-traffic spaces like reception areas and washrooms may require daily attention. We offer flexible schedules tailored to your footfall and budget.",
    },
    {
      q: "Do you clean outside business hours?",
      a: "Yes. We offer early morning cleans (from 6am), evening cleans, and weekend visits — whatever suits your team's schedule.",
    },
    {
      q: "Are your cleaners insured?",
      a: "All Cleaniq commercial cleaners carry full public liability insurance and are background-checked. Certificates are available on request.",
    },
    {
      q: "Can you provide a tailored cleaning specification?",
      a: "Absolutely. We carry out a free site assessment and build a cleaning specification around your specific requirements — from daily washroom maintenance to weekly deep cleans.",
    },
    {
      q: "What Manchester areas do you cover for office cleaning?",
      a: "We cover all Greater Manchester business districts including City Centre, Salford Quays, Didsbury, Stockport, Trafford Park, Wythenshawe, and surrounding areas.",
    },
  ],

  testimonials: [
    {
      name: "Claire B.",
      location: "Salford Quays, Manchester",
      text: "We have used Cleaniq for our office for over a year. Consistent, reliable, and the team are always professional. Our clients regularly comment on how clean the space is.",
      rating: 5,
    },
    {
      name: "Ahmed R.",
      location: "Manchester City Centre",
      text: "Switched to Cleaniq after our previous contractor kept missing areas. Night-and-day difference. Proper quality control makes all the difference.",
      rating: 5,
    },
    {
      name: "Sarah J.",
      location: "Stockport, Manchester",
      text: "Flexible, professional, and genuinely thorough. Our team arrives to a clean office every single morning. Exactly what we needed.",
      rating: 5,
    },
  ],

  manchesterAreas: [
    "City Centre",
    "Salford Quays",
    "Didsbury",
    "Stockport",
    "Trafford Park",
    "Wythenshawe",
    "Chorlton",
    "Stretford",
    "Hulme",
    "Fallowfield",
    "Longsight",
    "Ancoats",
  ],

  seoFooter: `Cleaniq Services provides professional office cleaning, commercial cleaning, and workplace janitorial services across Manchester. Whether you need daily office cleaning in Manchester City Centre, Salford Quays, Stockport, Trafford Park, or Didsbury — our vetted and insured commercial cleaning team delivers consistent, audited results. Book a free site assessment or call +44 7752 476368.`,
};

const POST_CONSTRUCTION_EXTENDED = {
  intro: `Building work, renovation, and refurbishment leave behind fine dust, debris, paint residue, and construction grime that standard cleaning cannot tackle. Cleaniq's post-construction cleaning team in Manchester provides a thorough, professional builders clean that prepares your property for immediate occupation or handover.`,

  whyChoosePoints: [
    {
      icon: <BadgeCheck size={22} />,
      title: "Handover-Ready Finish",
      body: "We clean to the standard required for a professional property handover — suitable for architects, developers, and private clients alike.",
    },
    {
      icon: <ShieldCheck size={22} />,
      title: "Industrial Equipment",
      body: "We use HEPA-filter industrial vacuums and specialist products to remove fine plaster dust, cement residue, and construction debris safely.",
    },
    {
      icon: <Clock size={22} />,
      title: "Flexible Scheduling",
      body: "We work around your build schedule and completion dates — including weekend and same-day bookings for urgent handovers.",
    },
    {
      icon: <Sparkles size={22} />,
      title: "All Property Types",
      body: "From single-room refurbishments to full commercial fit-outs — we have the team and equipment to handle any scale of post-build clean.",
    },
  ],

  checklist: {
    heading: "Post-Construction Cleaning Checklist — Manchester",
    intro:
      "Our builders clean covers every surface and area affected by construction work. Here is exactly what is completed on every job:",
    rooms: [
      {
        room: "All Rooms — General",
        tasks: [
          "HEPA industrial vacuum of all floors, walls, and surfaces",
          "Removal of plaster dust from all horizontal and vertical surfaces",
          "Spot-cleaning of paint splashes and sealant residue",
          "Removal of stickers, labels, and protective film from fixtures",
          "Cleaning of all light fittings, switches, and socket plates",
          "Wipe-down of all skirting boards and architrave",
          "Final floor sweep and mop of all hard surfaces",
        ],
      },
      {
        room: "Windows & Glazing",
        tasks: [
          "Interior glass cleaning — streak-free finish",
          "Frame, sill, and hinge wipe-down",
          "Removal of construction stickers and protective coating",
          "Sealant and silicone residue removal",
          "Blind or shutter wipe-down where fitted",
        ],
      },
      {
        room: "Kitchen & Bathrooms",
        tasks: [
          "Full sanitization of all new fixtures and fittings",
          "Removal of grout haze from tiles and tiling areas",
          "Sink, basin, and tap polishing",
          "Shower enclosure and bath protective film removal",
          "Cupboard interior wipe-down — dust and debris removal",
          "Worktop and splashback streak-free clean",
        ],
      },
      {
        room: "External & Access Areas",
        tasks: [
          "Front door, threshold, and entrance cleaning",
          "Communal hallway and stairwell dust removal",
          "Lift interior wipe-down if applicable",
          "Site debris removal from immediate access areas",
        ],
      },
    ],
  },

  whyMatters: {
    heading: "Why a Professional Post-Construction Clean is Essential",
    body: [
      "Construction dust is not ordinary household dust. Fine plaster, cement, and drywall particles are abrasive — damaging to surfaces, harmful when inhaled, and impossible to remove effectively without industrial-grade equipment. Attempting to clean a post-build property with a domestic vacuum simply redistributes the dust rather than removing it.",
      "A professional builders clean from Cleaniq uses HEPA-filter industrial vacuums that capture particles down to 0.3 microns — ensuring that fine construction dust is fully removed rather than recirculated into the air. This protects both the occupants and the surfaces of your newly completed property.",
      "For developers and contractors, a professional post-construction clean is also a contractual and reputational requirement. Properties handed over with visible dust, paint residue, or construction debris create a poor first impression and can result in snagging disputes. A professional handover clean from Cleaniq ensures your project is completed to the standard your clients expect.",
    ],
  },

  faqs: [
    {
      q: "What is included in a post-construction clean?",
      a: "Our builders clean includes full dust removal from all surfaces using industrial HEPA vacuums, paint splash removal, protective film and sticker removal from fixtures and glazing, grout haze removal, and a full floor clean — leaving the property ready for occupation or handover.",
    },
    {
      q: "How long does a post-construction clean take?",
      a: "A typical one-bedroom flat takes 4–6 hours. Larger residential properties or commercial fit-outs are quoted individually following a site assessment. We work to your handover deadline.",
    },
    {
      q: "Do you work on commercial construction sites?",
      a: "Yes. We handle post-build cleans for residential refurbishments, new-build developments, commercial office fit-outs, retail spaces, and industrial units across Greater Manchester.",
    },
    {
      q: "Can you remove paint from floors and surfaces?",
      a: "Yes. We use specialist products to remove paint splashes, sealant residue, and adhesive from hard floors, tiles, glass, and fixtures without causing surface damage.",
    },
    {
      q: "What Manchester areas do you cover for post-construction cleaning?",
      a: "We cover all of Greater Manchester including City Centre, Salford, Didsbury, Stockport, Trafford, Wythenshawe, Ancoats, and surrounding postcodes.",
    },
  ],

  testimonials: [
    {
      name: "Paul D.",
      location: "Ancoats, Manchester",
      text: "Used Cleaniq after a full apartment renovation. The dust was everywhere. They came in with industrial equipment and the place was immaculate within a day. Outstanding.",
      rating: 5,
    },
    {
      name: "Lisa K.",
      location: "Salford, Manchester",
      text: "We are a small development company and Cleaniq handle all our post-build cleans. Professional, reliable, and the handover standard is always excellent.",
      rating: 5,
    },
    {
      name: "James T.",
      location: "Stockport, Manchester",
      text: "After our kitchen extension, the dust was unbelievable. Cleaniq removed every trace of it — including from inside the new cupboards. Brilliant service.",
      rating: 5,
    },
  ],

  manchesterAreas: [
    "City Centre",
    "Ancoats",
    "Salford",
    "Didsbury",
    "Stockport",
    "Trafford",
    "Wythenshawe",
    "Chorlton",
    "Stretford",
    "Hulme",
    "Fallowfield",
    "Longsight",
  ],

  seoFooter: `Cleaniq Services provides professional post-construction cleaning, builders cleans, and renovation cleaning across Manchester. Whether you need a post-build clean in Manchester City Centre, Salford, Ancoats, Stockport, or Didsbury — our industrial-equipped team delivers a handover-ready finish. Book your Manchester post-construction cleaning service online or call +44 7752 476368.`,
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
    extended: "EOT",
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
    extended: "DEEP",
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
    extended: "AIRBNB",
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
    extended: "OFFICE",
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
    extended: "POST",
  },
};

// fetch service

// const ServiceDetail = () => {
//   const { serviceSlug } = useParams();
//   const [servicePrice, setServicePrice] = React.useState(null);

//   useEffect(() => {
//     const fetchPrice = async () => {
//       try {
//         const res = await fetch(
//           `${import.meta.env.VITE_API_URL}/services?region=UK`,
//         );
//         const data = await res.json();

//         // Match by slug — normalize name to slug for comparison
//         const match = data.find((s) => {
//           const nameSlug = s.name
//             .toLowerCase()
//             .replace(/[^a-z0-9]+/g, "-")
//             .replace(/(^-|-$)/g, "");
//           return (
//             serviceSlug.includes(nameSlug) ||
//             nameSlug.includes(serviceSlug.split("-")[0])
//           );
//         });

//         if (match) {
//           setServicePrice(
//             `From £${match.rate}${match.type === "hourly" ? "/hr" : ""}`,
//           );
//         }
//       } catch (err) {
//         console.error("Failed to fetch price", err);
//       }
//     };

//     fetchPrice();
//   }, [serviceSlug]);
// };

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

const Divider = () => (
  <div className="border-t border-slate-200 my-8 md:my-10" />
);

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
const EXTENDED_MAP = {
  EOT: EOT_EXTENDED,
  DEEP: DEEP_EXTENDED,
  AIRBNB: AIRBNB_EXTENDED,
  OFFICE: OFFICE_EXTENDED,
  POST: POST_CONSTRUCTION_EXTENDED,
};
/* ─── MAIN PAGE ─────────────────────────────────────────────────── */
const ServiceDetail = () => {
  const { serviceSlug } = useParams();
  const service = SERVICES_MAP[serviceSlug];
  const isEOT = serviceSlug === "end-of-tenancy-cleaning-manchester";
  const ext = service?.extended ? EXTENDED_MAP[service.extended] : null;
  const [servicePrice, setServicePrice] = React.useState(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/services?region=UK`,
        );
        const data = await res.json();

        // Match by slug — normalize name to slug for comparison
        const match = data.find((s) => {
          const nameSlug = s.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          return (
            serviceSlug.includes(nameSlug) ||
            nameSlug.includes(serviceSlug.split("-")[0])
          );
        });

        if (match) {
          setServicePrice(
            `From £${match.rate}${match.type === "hourly" ? "/hr" : ""}`,
          );
        }
      } catch (err) {
        console.error("Failed to fetch price", err);
      }
    };

    fetchPrice();
  }, [serviceSlug]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [serviceSlug]);

  if (!service) {
    return (
      <div className="pt-40 pb-20 text-center space-y-4 px-6">
        <h1 className="text-2xl font-bold text-slate-900">Service Not Found</h1>
        <Link to="/" className="text-teal-600 font-semibold hover:underline">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      <div
        className="bg-white min-h-screen pb-28 md:pb-0"
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
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
              areaServed: isEOT
                ? EOT_EXTENDED.manchesterAreas.map((a) => ({
                    "@type": "City",
                    name: a,
                  }))
                : { "@type": "City", name: "Manchester" },
              provider: {
                "@type": "LocalBusiness",
                "@id": "https://www.cleaniqservices.com#localbusiness",
                name: "Cleaniq Services",
                telephone: "+447752476368",
                address: {
                  "@type": "PostalAddress",
                  addressLocality: "Manchester",
                  addressCountry: "GB",
                },
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
            <Link
              to="/"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <HomeIcon size={12} /> Home
            </Link>
            <span>/</span>
            <Link to="/services" className="hover:text-white transition-colors">
              Services
            </Link>
            <span>/</span>
            <span className="text-slate-300">
              {serviceSlug.replace(/-/g, " ")}
            </span>
          </nav>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 items-end">
            <div className="md:col-span-2 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold tracking-widest uppercase">
                <MapPin size={11} /> Manchester Cleaning Service
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
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={14}
                        className="fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-slate-300">
                    4.9 ·{" "}
                    <span className="text-white font-semibold">
                      2,000+ cleans
                    </span>
                  </span>
                </div>
                <span className="text-slate-600">|</span>
                <span className="text-sm text-slate-300">
                  <span className="text-white font-semibold">48-hr</span>{" "}
                  re-clean guarantee
                </span>
              </div>
            </div>

            {/* Desktop CTA card — inside hero */}
            <div className="hidden md:block">
              <div className="bg-white rounded-xl p-6 shadow-2xl shadow-black/30">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Book your clean
                </p>
                <p className="text-2xl font-bold text-slate-900 mb-1">
                  {servicePrice ?? "From £20 /hr"}
                </p>
                <p className="text-xs text-slate-400 mb-5">
                  No hidden fees · Insured cleaners
                </p>
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
                <span className="text-lg sm:text-xl font-bold text-teal-400">
                  {value}
                </span>
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
                <p className="text-slate-600 leading-relaxed mb-5">
                  {service.description}
                </p>
                {ext && (
                  <p className="text-slate-600 leading-relaxed mb-6">
                    {ext.intro}
                  </p>
                )}
                <div className="grid sm:grid-cols-2 gap-3">
                  {service.points.map((pt, i) => (
                    <div
                      key={i}
                      className="flex gap-3 items-start p-3.5 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={11} className="stroke-[3]" />
                      </div>
                      <span className="text-slate-700 text-sm font-medium leading-snug">
                        {pt}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Why Choose section */}
              {ext && (
                <>
                  <Divider />
                  <section>
                    <SectionLabel>Why Cleaniq</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
                      Why Choose Cleaniq for {service.heading}?
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-5">
                      {ext.whyChoosePoints.map((pt, i) => (
                        <div key={i} className="flex gap-4 items-start">
                          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                            {pt.icon}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm mb-1">
                              {pt.title}
                            </p>
                            <p className="text-slate-500 text-sm leading-relaxed">
                              {pt.body}
                            </p>
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
                      {ext.checklist.heading}
                    </h2>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                      {ext.checklist.intro}
                    </p>
                    <div className="space-y-8">
                      {ext.checklist.rooms.map((room, i) => (
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
                                <Check
                                  size={13}
                                  className="text-teal-500 shrink-0 mt-0.5 stroke-[2.5]"
                                />
                                <span className="text-slate-600 text-sm leading-snug">
                                  {task}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <Divider />

                  {/* Areas */}
                  <section>
                    <SectionLabel>Coverage</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                      Manchester Areas We Cover
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {ext.manchesterAreas.map((area) => (
                        <span
                          key={area}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full"
                        >
                          <MapPin size={10} className="text-teal-500" /> {area}
                        </span>
                      ))}
                    </div>
                  </section>

                  <Divider />

                  {/* Why It Matters */}
                  <section>
                    <SectionLabel>The case for professionals</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-5">
                      {ext.whyMatters.heading}
                    </h2>
                    <div className="space-y-4">
                      {ext.whyMatters.body.map((para, i) => (
                        <p
                          key={i}
                          className="text-slate-600 leading-relaxed text-sm sm:text-base"
                        >
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
                      {ext.testimonials.map((t, i) => (
                        <div
                          key={i}
                          className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                        >
                          <Stars count={t.rating} />
                          <p className="text-slate-700 text-sm leading-relaxed">
                            "{t.text}"
                          </p>
                          <div className="pt-1 border-t border-slate-200">
                            <p className="font-bold text-slate-900 text-xs">
                              {t.name}
                            </p>
                            <p className="text-slate-400 text-xs">
                              {t.location}
                            </p>
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
                      {service.heading} — FAQs
                    </h2>
                    <div className="mt-4">
                      {ext.faqs.map((faq, i) => (
                        <FAQItem key={i} q={faq.q} a={faq.a} />
                      ))}
                    </div>
                  </section>

                  <Divider />

                  <section>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {ext.seoFooter}
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
                    <p className="text-teal-400 text-xs font-bold tracking-widest uppercase mb-1">
                      Book your clean
                    </p>
                    <p className="text-2xl font-bold text-slate-900 mb-1">
                      From £20 /hr
                    </p>
                    {/* <p className="text-2xl font-bold text-slate-900 mb-1">
                      {servicePrice ?? "From £20 /hr"}
                    </p> */}
                    <p className="text-slate-400 text-xs mt-1">
                      No hidden fees · Fully insured
                    </p>
                  </div>
                  <div className="p-6 bg-white space-y-3">
                    <div className="space-y-2.5">
                      {[
                        {
                          icon: <ShieldCheck size={15} />,
                          text: "Vetted & insured cleaners",
                        },
                        {
                          icon: <Calendar size={15} />,
                          text: "Flexible scheduling",
                        },
                        {
                          icon: <Star size={15} />,
                          text: "4.9★ from 2,000+ cleans",
                        },
                      ].map(({ icon, text }) => (
                        <div
                          key={text}
                          className="flex items-center gap-2.5 text-sm text-slate-600"
                        >
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
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Our guarantees
                  </p>
                  {[
                    "48-hour free re-clean if unsatisfied",
                    "Fully vetted & DBS-checked cleaners",
                    "Public liability insurance included",
                    "Eco-friendly, non-toxic products",
                  ].map((item) => (
                    <div key={item} className="flex gap-2.5 items-start">
                      <Check
                        size={13}
                        className="text-teal-500 shrink-0 mt-0.5 stroke-[2.5]"
                      />
                      <span className="text-slate-600 text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Manchester coverage compact */}
                {isEOT && (
                  <div className="border border-slate-200 rounded-xl p-5 bg-white">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Areas covered
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {/* Was: {isEOT && (...areas panel)} */}
                      {ext && (
                        <div className="border border-slate-200 rounded-xl p-5 bg-white">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                            Areas covered
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {ext.manchesterAreas.map((area) => (
                              <span
                                key={area}
                                className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
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
