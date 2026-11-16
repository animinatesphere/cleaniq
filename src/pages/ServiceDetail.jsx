import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { useGoogleReviews } from "../utils/googleReviews";
import { whatsappLink } from "../utils/contact";
import { SERVICE_PAGES, servicePagePath } from "../utils/servicePages";
import { AREAS } from "../utils/areas";
import BeforeAfter from "../component/BeforeAfter";
import { beforeAfterFor } from "../utils/beforeAfter";
// Real job photos for the deep cleaning room cards
import roomBedroom from "../assets/our-work/airbnb-1.jpg";
import roomBathroom from "../assets/our-work/end-of-tenancy-2.jpg";
import roomKitchen from "../assets/our-work/regular-1.jpg";
import roomLiving from "../assets/our-work/regular-2.jpg";
import roomStairs from "../assets/cleaning.jpg";
import eotBedroom from "../assets/our-work/airbnb-2.jpg";
import eotBathroom from "../assets/our-work/end-of-tenancy-2.jpg";
import eotKitchen from "../assets/our-work/end-of-tenancy-4.jpg";
import eotLiving from "../assets/our-work/end-of-tenancy-3.jpg";

// End of tenancy page: inventory-standard checklist (owner-supplied text, word for word).
const EOT_ROOMS = [
  { room: "Bedroom", image: eotBedroom, alt: "Bedroom with a freshly made bed after an end of tenancy clean by Cleaniq Services", tasks: ["Vacuum and Mop hard floors.", "Vacuum Carpeted floors.", "Dusting and wiping of accessible bedroom surfaces.", "Cleaning of skirting boards, doors, door frames and handles.", "Internal cleaning of wardrobes, cupboards and drawers where empty.", "Removal of cobwebs and dust from reachable corners and ceiling edges.", "Cleaning of mirrors, glass panels and internal window sills.", "Internal window cleaning where safely reachable.", "Dusting of light fittings, lampshades and fixtures where safely accessible.", "Vacuuming of floors, corners, edges and under movable furniture where possible.", "Mopping of hard floors where suitable.", "Bed frames and headboards wiped where accessible.", "Carpets vacuumed as standard.", "Professional carpet steam cleaning available as an optional add-on.", "Final visual check of the bedroom area before completion."] },
  { room: "Bathroom", image: eotBathroom, alt: "Clean bathroom with bath, basin and tiled floor after an end of tenancy clean by Cleaniq Services", tasks: ["Clean Bathtub and WC", "Clean Shower and Shower Screen", "Clean and polish Bathroom Tiles. Clean and Polish the sink.", "Cleaning and descaling of sinks, taps and surrounding surfaces where possible.", "Cleaning and descaling of toilets, toilet seats, bases and surrounding areas.", "Cleaning of baths, shower trays, shower screens and shower fittings.", "Removal of soap marks, water marks and general bathroom residue where possible.", "Cleaning of bathroom tiles, splashbacks and reachable wall surfaces.", "Cleaning of mirrors, glass panels and internal window sills.", "Internal window cleaning where safely reachable.", "Cleaning of bathroom cupboards, cabinets and drawers where empty.", "Dusting and wiping of doors, door frames, handles and skirting boards.", "Cleaning of light switches, plug sockets, extractor fan covers and reachable fittings.", "Removal of cobwebs and dust."] },
  { room: "Kitchen", image: eotKitchen, alt: "Empty, clean kitchen with spotless worktops and oven after an end of tenancy clean by Cleaniq Services", tasks: ["Cleaning of kitchen worktops, counters and accessible preparation surfaces.", "Cleaning of kitchen cupboards, drawers and shelves internally where empty.", "Cleaning of cupboard fronts, handles and external cabinet surfaces.", "Cleaning of sinks, taps, draining boards and surrounding areas.", "Cleaning and degreasing of kitchen tiles, splashbacks and reachable wall surfaces.", "Oven cleaning included as standard with our end of tenancy cleaning service.", "Cleaning of hob, extractor hood and external appliance surfaces.", "Internal cleaning of fridge and freezer where empty, defrosted and switched off.", "Cleaning of microwave, washing machine and dishwasher exteriors where applicable.", "Cleaning of doors, door frames, handles, skirting boards and reachable ledges.", "Cleaning of light switches, plug sockets and reachable kitchen fittings.", "Internal window cleaning."] },
  { room: "Living Room", image: eotLiving, alt: "Empty living room with sofa and coffee table after an end of tenancy clean by Cleaniq Services", tasks: ["Vacuum all carpeted floors. Vacuum and mop hard floors.", "Remove the cobwebs. Wipe and dust wooden surfaces and fixtures.", "Clean the skirting boards. Clean light sockets, switches, and plugs.", "Dusting and wiping of accessible living room surfaces.", "Cleaning of skirting boards, doors, door frames and handles.", "Cleaning of light switches, plug sockets and reachable ledges.", "Removal of cobwebs and dust from reachable corners and ceiling edges.", "Cleaning of mirrors, glass panels and internal window sills.", "Internal window cleaning where safely reachable.", "Dusting of light fittings, lampshades and fixtures where safely accessible.", "Cleaning of fireplace surrounds, mantelpieces and reachable shelving where applicable.", "Wiping of radiators, accessible pipework and visible marks where possible.", "Cleaning around furniture and under movable items where access allows.", "Vacuuming of floors, corners, edges and accessible areas."] },
  { room: "Hallways/Staircases", image: roomStairs, alt: "Cleaner carrying cleaning supplies up a staircase to clean the hallway and stairs", tasks: ["Dusting and wiping of accessible hallway, staircase and landing surfaces.", "Cleaning of skirting boards, doors, door frames and handles.", "Cleaning of light switches, plug sockets and reachable ledges.", "Removal of cobwebs and dust from reachable corners and ceiling edges.", "Cleaning of bannisters, handrails, spindles and stair edges where accessible.", "Cleaning of mirrors, glass panels and internal window sills.", "Internal window cleaning where safely reachable.", "Dusting of light fittings, lampshades and fixtures where safely accessible.", "Cleaning of radiators, visible pipework and reachable wall marks where possible.", "Cleaning of entrance areas, internal doors and high-touch contact points.", "Vacuuming of hallway floors, stairs, landings, corners and edges.", "Mopping of hard floors where suitable.", "Carpets vacuumed as standard.", "Professional carpet steam cleaning available as an optional add-on."] },
];

// One room of the end of tenancy checklist: first 5 tasks, "View full checklist" shows the rest.
// All tasks are always in the HTML (hidden until opened) so search engines can read them.
function EotRoomCard({ room, bookingLink }) {
  const [open, setOpen] = React.useState(false);
  const first = room.tasks.slice(0, 5);
  const rest = room.tasks.slice(5);
  const item = (task) => (
    <li key={task} className="flex gap-2.5 items-start">
      <Check size={14} className="text-teal-500 shrink-0 mt-0.5 stroke-[2.5]" />
      <span className="text-slate-600 text-sm leading-snug">{task}</span>
    </li>
  );
  return (
    <article className="flex flex-col rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
      <img src={room.image} alt={room.alt} loading="lazy" width="1000" height="750" className="w-full aspect-[16/9] object-cover" />
      <div className="flex flex-col grow p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-teal-600">End of Tenancy Cleaning</p>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">{room.room}</h3>
          </div>
          <Link to={bookingLink} className="shrink-0 px-3.5 py-2 rounded-lg bg-[#00B5A4] text-white text-xs font-bold hover:bg-teal-600 transition-colors">
            Book now
          </Link>
        </div>
        <ul className="space-y-2.5">{first.map(item)}</ul>
        {rest.length > 0 && (
          <>
            <ul className="space-y-2.5 mt-2.5" hidden={!open}>{rest.map(item)}</ul>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              className="mt-4 self-start inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline"
            >
              {open ? "Show less" : "View full checklist"}
              <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          </>
        )}
      </div>
    </article>
  );
}

// End of tenancy page FAQs (owner-supplied; another company name replaced with Cleaniq Services).
const EOT_FAQS = [
  { q: "Does your end of tenancy cleaning guarantee my deposit back?", a: "While we cannot control the landlord's legal decisions, our service is specifically designed to pass the most rigorous inventory checks. We provide a 48-hour satisfaction guarantee and a professional invoice that acts as evidence for the Tenancy Deposit Scheme (TDS). If your inventory clerk identifies any cleaning issues, we return free of charge to rectify them." },
  { q: "Is professional oven cleaning included in the price?", a: "Yes. Unlike many Manchester cleaning companies that charge extra, a full professional oven clean is included as standard in our end of tenancy package. We degrease the interior, clean the racks, and polish the glass to ensure it meets the \"showroom\" standard required by agencies like Jordan Fishwick and Philip James." },
  { q: "Do I need to be at the property during the clean?", a: "No. We are experts in remote logistics. We can coordinate key collection and return from your estate agent's office or a concierge desk in developments like Deansgate Square or MediaCityUK. This allows you to focus on your move while we handle the heavy lifting." },
  { q: "How long does a professional move-out clean take?", a: "The duration depends on the size and condition of the property. A studio in the Northern Quarter might take 3-4 hours, while a 4-bedroom family home in Didsbury or Altrincham could take 6-8 hours. We send teams of 2 or 3 cleaners to ensure the job is completed efficiently in a single day." },
  { q: "Are your cleaners employees or contractors?", a: "Every cleaner at Cleaniq Services is a direct employee. We do not use unvetted gig-economy contractors. Our staff are fully background-checked, insured, and trained in our specific \"Inventory-Standard\" checklist to ensure consistent quality across all Manchester postcodes." },
  { q: "Do you provide your own cleaning supplies and equipment?", a: "Yes. Our mobile teams arrive in fully equipped vehicles carrying industrial-grade supplies. This includes HEPA-filtered vacuums, professional steam cleaners for \"wet zones,\" and a full range of eco-friendly, non-toxic detergents. You do not need to provide a single item." },
  { q: "Do you clean the windows and frames?", a: "We clean all windows internally as part of the standard EOT service, including the frames, ledges, and sills. If you require external window cleaning or reach-and-wash services for high-rise apartments, this can be added as an optional extra." },
  { q: "Do you cover areas outside of the Manchester City Centre?", a: "Yes. We cover a 600-square-mile radius across the North West. Our daily routes include Salford, Stockport, Bolton, Oldham, Wigan, Warrington, and Altrincham. If you have a postcode starting with M, SK, WA, WN, or OL, we have a team ready to assist." },
  { q: "What happens if the landlord isn't happy with the clean?", a: "This is where our 48-hour guarantee comes in. If the landlord or agent provides an inventory report showing a cleaning failure, simply send it to us. We will dispatch a team to the property to perform a free re-clean of the disputed areas immediately." },
  { q: "Is carpet cleaning included in the end of tenancy service?", a: "We hoover all carpets as part of the standard clean. However, for properties with deep stains or pet odors, we recommend adding our Professional Carpet Steam Cleaning (Hot Water Extraction). You receive a discount when you bundle this with your move-out clean." },
  { q: "Can you perform an EOT clean if the power or water is turned off?", a: "No. For our teams to achieve an \"Inventory Standard\" finish, we require access to running water and electricity. Please ensure your utilities remain active until the cleaning service is completed." },
];

// Deep cleaning page FAQs (owner-supplied text). Shown in the FAQ section and the FAQPage schema.
const DEEP_FAQS = [
  { q: "What is the difference between the deep cleaning service and your One-Off Cleaning?", a: "Our Deep Cleaning Services in Manchester will cover the entirety of your home leaving no inch untouched. Our One-Off Cleaning Service is a lighter, more general cleaning that offers some of the benefits of a deep clean, but it is intended to be a much lighter surface clean." },
  { q: "Do you provide all the cleaning supplies as I don't have any of those in my home?", a: "Yes. All necessary cleaning detergents and equipment will be provided by us when you schedule our Deep Cleaning Services in Manchester." },
  { q: "Which areas do you cover?", a: "We can provide our Deep Cleaning Services on all postcodes in Greater Manchester." },
  { q: "Do you clean the oven?", a: "Yes. All kitchen appliances will be deeply cleaned as part of our Deep Cleaning Service. The oven will be fully deep cleaned and degreased completely free of charge." },
  { q: "Do I need to provide parking?", a: "Parking expenses can come on top of the price for your deep cleaning if only metered parking is available. If there is no free parking available, we do request that clients cover potential parking expenses for our cleaning teams or provide a permit." },
  { q: "I have already booked your deep cleaning service, can I reschedule?", a: "Yes. You can reschedule or amend your deep cleaning booking 24 hours prior to the service taking place." },
  { q: "Will you clean the windows as part of the Deep Cleaning?", a: "Yes. All windows, along with the panes, ledges, sills, and frames, will be cleaned internally as part of the service. You can always schedule external window cleaning in addition to your Deep Cleaning Services in Manchester." },
  { q: "There is mould build-up in some parts of the property, will that be removed?", a: "Our cleaners are expertly trained and experienced professionals. They will attempt to fully eliminate areas of heavy limescale and mould build-up. However, our cleaners are instructed to stop before potentially risking damage to the affected surface. If complete elimination would depend on damaging the area, the cleaners will stop." },
  { q: "What areas are not cleaned as part of the deep cleaning?", a: "The only areas that are exceptions to our Deep Cleaning Services in Manchester are painted walls and ceilings." },
];

// Deep cleaning page: what we tackle (owner-supplied text).
const DEEP_TACKLE = [
  { title: "Deep-Seated Limescale & Mineral Removal:", body: "We don't just spray and wipe; we use professional-grade descaling agents to safely dissolve heavy buildup from showerheads, taps, and glass screens, restoring their original brilliance." },
  { title: "Encrusted Kitchen Grease & Carbon:", body: "We tackle the \"burnt-on\" grease on hobs and splashbacks, and deep-clean extractor fan filters to ensure your cooking area is hygienic and touch-dry." },
  { title: "Bacteria & Allergen Elimination:", body: "Our teams focus on high-traffic touchpoints and hidden nooks—like behind radiators and under heavy furniture—to remove the dust and pathogens that regular vacuums miss." },
  { title: "Sanitization of Wet Zones:", body: "We perform an intensive scrub of bathroom tiles and grout lines to eliminate soap scum and prevent the onset of mold in high-moisture environments." },
  { title: "Appliance Exterior Restoration:", body: "We remove fingerprints, watermarks, and ingrained dirt from the exteriors of all major appliances, leaving them with a streak-free, professional finish." },
  { title: "Dust & Cobweb Extraction:", body: "We target high-level areas including curtain rails, light fixtures, and the tops of wardrobes where \"invisible\" dust creates an unhealthy environment." },
];

// Deep cleaning page: what's included, room by room (owner-supplied text, word for word).
const DEEP_ROOMS = [
  { room: "Bedroom", image: roomBedroom, alt: "Bedroom with a freshly made bed after a deep clean by Cleaniq Services", tasks: ["Carpeted floors will be vacuumed. Hard Floors will be mopped.", "Skirting boards, light sockets, light switches, and plugs will be cleaned.", "Upholstery and furniture will be vacuumed - underneath and behind cushions as well."] },
  { room: "Bathroom", image: roomBathroom, alt: "Clean bathroom with a bath, basin and tiled floor after a deep clean by Cleaniq Services", tasks: ["The bathtub will be cleaned.", "The showerhead, the shower screen, and the shower will be cleaned.", "The skirting boards, light sockets, light switches, and plugs will be cleaned."] },
  { room: "Kitchen", image: roomKitchen, alt: "Clean kitchen with sink, hob, oven and washing machine after a deep clean by Cleaniq Services", tasks: ["All kitchen appliances will be cleaned from the inside and the outside.", "Oven, cooker, hob along with the burners, extractor will be cleaned.", "The cobwebs will be removed."] },
  { room: "Living Room/ Dining Room", image: roomLiving, alt: "Living and dining room with sofas and a dining table after a deep clean by Cleaniq Services", tasks: ["The cobwebs will be removed.", "The skirting boards, light sockets, light switches, and plugs will be cleaned.", "All windows will be cleaned from the inside."] },
  { room: "Hallway/Staircases", image: roomStairs, alt: "Cleaner carrying cleaning supplies up a staircase to deep clean the hallway and stairs", tasks: ["Skirting boards, light sockets, light switches, and plugs will be cleaned.", "Hard floors will be vacuumed and mopped.", "Carpeted floors will be vacuumed."] },
];
import OurWork from "../component/OurWork";
import { ourWorkFor } from "../utils/ourWork";
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


  manchesterAreas: [
    "Manchester City",
    "Salford",
    "Bolton",
    "Bury",
    "Oldham",
    "Rochdale",
    "Stockport",
    "Tameside",
    "Trafford",
    "Wigan",
  ],

  seoFooter: `Cleaniq Services provides professional end of tenancy cleaning, move-out cleaning, vacate cleaning, checkout cleaning, and end of lease cleaning across Manchester. Whether you need a tenancy end clean in Manchester City Centre, Didsbury, Chorlton, Salford, Withington, Fallowfield, or Stockport — our vetted and insured tenancy cleaners are ready to help you secure your full deposit refund. Book your Manchester end of tenancy cleaning service online in 60 seconds or call +44 7846 726428.`,
};

const DEEP_EXTENDED = {
  // intro: `Whether your home needs a post-party refresh, a seasonal spring clean, or a thorough reset after months of regular use — Cleaniq Services' deep cleaning service in Manchester goes further than any standard domestic clean. We reach the places your regular cleaner doesn't.`,

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
      body: "Every Cleaniq Services cleaner is background-checked, fully insured, and trained in our detailed deep cleaning protocol.",
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
      "A professional deep clean from Cleaniq Services resets your property to a hygienic baseline. Our Manchester cleaners follow a structured, room-by-room protocol using eco-friendly, non-toxic products that are powerful enough to cut through grease and limescale — without harsh chemicals that affect your family or pets.",
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


  manchesterAreas: [
    "Manchester City",
    "Salford",
    "Bolton",
    "Bury",
    "Oldham",
    "Rochdale",
    "Stockport",
    "Tameside",
    "Trafford",
    "Wigan",
  ],

  seoFooter: `Cleaniq Services provides professional deep cleaning, one-off cleaning, and thorough refresh cleans across Manchester. Whether you need a deep clean in Manchester City Centre, Didsbury, Chorlton, Salford, Fallowfield, Withington, or Stockport — our vetted and insured cleaners deliver a guaranteed result. Book your Manchester deep cleaning service online in 60 seconds or call +44 7846 726428.`,
};

const AIRBNB_EXTENDED = {
  intro: `Running a successful Airbnb or short-let property in Manchester depends on one thing above all else — consistent, guest-ready cleanliness. Cleaniq Services' specialist Airbnb cleaning team delivers fast, reliable turnovers that protect your ratings and keep your calendar full.`,

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
      "Every Cleaniq Services Airbnb turnover covers the full property to hotel standard. Here is exactly what is completed on every visit:",
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
      "Professional short-let cleaning is not simply about tidiness — it is about consistency. Every guest expects the same standard, every time. Cleaniq Services' Airbnb cleaning team in Manchester follows a fixed turnover protocol so your property meets the same high standard whether it is your first guest or your five-hundredth.",
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


  manchesterAreas: [
    "Manchester City",
    "Salford",
    "Bolton",
    "Bury",
    "Oldham",
    "Rochdale",
    "Stockport",
    "Tameside",
    "Trafford",
    "Wigan",
  ],

  seoFooter: `Cleaniq Services provides professional Airbnb cleaning, short-let property cleaning, and holiday let turnovers across Manchester. Whether you need a same-day Airbnb clean in Manchester City Centre, Salford, Didsbury, Chorlton, or Stockport — our experienced turnover team delivers a guest-ready finish every time. Book your Manchester Airbnb cleaning service online or call +44 7846 726428.`,
};

const OFFICE_EXTENDED = {
  intro: `A clean workplace is not just about appearances — it directly affects staff wellbeing, productivity, and the impression you make on every client who walks through your door. Cleaniq Services delivers reliable, professional office cleaning across Manchester on a schedule that works around your business.`,

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
      body: "All Cleaniq Services commercial cleaners carry full public liability insurance and are background-checked for your peace of mind.",
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
      "Cleaniq Services' commercial cleaning team in Manchester works to a fixed, audited checklist — not a loose routine. Every visit meets the same standard, and our supervisors perform quality checks to ensure your expectations are consistently met.",
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
      a: "All Cleaniq Services commercial cleaners carry full public liability insurance and are background-checked. Certificates are available on request.",
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


  manchesterAreas: [
    "Manchester City",
    "Salford",
    "Bolton",
    "Bury",
    "Oldham",
    "Rochdale",
    "Stockport",
    "Tameside",
    "Trafford",
    "Wigan",
  ],

  seoFooter: `Cleaniq Services provides professional office cleaning, commercial cleaning, and workplace janitorial services across Manchester. Whether you need daily office cleaning in Manchester City Centre, Salford Quays, Stockport, Trafford Park, or Didsbury — our vetted and insured commercial cleaning team delivers consistent, audited results. Book a free site assessment or call +44 7846 726428.`,
};

const POST_CONSTRUCTION_EXTENDED = {
  intro: `Building work, renovation, and refurbishment leave behind fine dust, debris, paint residue, and construction grime that standard cleaning cannot tackle. Cleaniq Services' post-construction cleaning team in Manchester provides a thorough, professional builders clean that prepares your property for immediate occupation or handover.`,

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
      "A professional builders clean from Cleaniq Services uses HEPA-filter industrial vacuums that capture particles down to 0.3 microns — ensuring that fine construction dust is fully removed rather than recirculated into the air. This protects both the occupants and the surfaces of your newly completed property.",
      "For developers and contractors, a professional post-construction clean is also a contractual and reputational requirement. Properties handed over with visible dust, paint residue, or construction debris create a poor first impression and can result in snagging disputes. A professional handover clean from Cleaniq Services ensures your project is completed to the standard your clients expect.",
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


  manchesterAreas: [
    "Manchester City",
    "Salford",
    "Bolton",
    "Bury",
    "Oldham",
    "Rochdale",
    "Stockport",
    "Tameside",
    "Trafford",
    "Wigan",
  ],

  seoFooter: `Cleaniq Services provides professional post-construction cleaning, builders cleans, and renovation cleaning across Manchester. Whether you need a post-build clean in Manchester City Centre, Salford, Ancoats, Stockport, or Didsbury — our industrial-equipped team delivers a handover-ready finish. Book your Manchester post-construction cleaning service online or call +44 7846 726428.`,
};

const GENERAL_EXTENDED = {
  intro: `Sometimes you just need a clean, fresh home without the fuss. Cleaniq Services' general cleaning service in Manchester gives you a thorough, professional tidy-up of your entire home — every week, fortnight, or as a one-off when life gets busy. Trusted local cleaners, eco-friendly products, and a finish you'll actually notice.`,

  whyChoosePoints: [
    {
      icon: <BadgeCheck size={22} />,
      title: "Vetted & Trusted Cleaners",
      body: "Every cleaner is background-checked, fully insured, and trained to our quality standard — so you can relax knowing your home is in safe hands.",
    },
    {
      icon: <ShieldCheck size={22} />,
      title: "Eco-Friendly Products",
      body: "We use non-toxic, family-safe, and pet-friendly cleaning solutions that are tough on dirt but gentle on your home and the environment.",
    },
    {
      icon: <Clock size={22} />,
      title: "Flexible Scheduling",
      body: "Book a one-off clean or set up a recurring weekly or fortnightly slot. We work around your schedule — including evenings and weekends.",
    },
    {
      icon: <Sparkles size={22} />,
      title: "Whole-Home Coverage",
      body: "From kitchen surfaces to bathroom tiles and bedroom floors — our general clean covers every room in your home from top to bottom.",
    },
  ],

  checklist: {
    heading: "General Cleaning Checklist — Manchester",
    intro: "Our standard general clean covers all key areas of your home. Here is exactly what is included on every visit:",
    rooms: [
      {
        room: "Kitchen",
        tasks: [
          "Wipe down all worktops, splashbacks, and surfaces",
          "Clean exterior of oven, microwave, and fridge",
          "Degrease hob and extractor filter",
          "Sink and tap scrub and polish",
          "Wipe cabinet fronts and handles",
          "Sweep and mop hard floors",
          "Empty and reline bins",
        ],
      },
      {
        room: "Bathrooms & Toilets",
        tasks: [
          "Scrub and disinfect toilet bowl, seat, and cistern",
          "Clean and descale shower, bath, and taps",
          "Wipe tiles, mirrors, and glass surfaces",
          "Clean sink and vanity unit",
          "Mop floor and wipe skirting boards",
          "Restock toilet paper and fold towels if provided",
        ],
      },
      {
        room: "Living Areas & Bedrooms",
        tasks: [
          "Dust all surfaces, shelves, and furniture",
          "Vacuum upholstered furniture and cushions",
          "Vacuum and mop all floors",
          "Clean mirrors and glass surfaces",
          "Empty bins and replace liners",
          "Tidy and straighten cushions and throws",
          "Wipe light switches, door handles, and skirting boards",
        ],
      },
      {
        room: "Hallways & Stairs",
        tasks: [
          "Vacuum stairs and landing",
          "Dust banisters and handrails",
          "Wipe down door frames and skirting boards",
          "Mop hard hallway floors",
        ],
      },
    ],
  },

  whyMatters: {
    heading: "Why Regular Professional Cleaning Makes a Difference",
    body: [
      "A consistent cleaning routine does more than keep your home looking good — it reduces allergens, bacteria, and dust build-up that can affect your family's health over time. Professional cleaners are trained to reach the spots that get missed in a quick home tidy: behind appliances, inside cupboard hinges, along skirting boards, and in bathroom grout lines.",
      "Many of our customers find that booking a regular fortnightly clean removes the mental load of keeping on top of housework — freeing up time for the things that matter. Whether you work long hours, have young children, or simply want your home maintained to a high standard, a regular Cleaniq Services general clean is the simplest way to stay on top of it.",
      "Our eco-friendly cleaning products mean no harsh chemical smells left in your home and no risk to children or pets. We bring everything we need, show up on time, and leave your home genuinely clean — not just surface-wiped.",
    ],
  },

  faqs: [
    {
      q: "What is included in a general cleaning service?",
      a: "Our general clean covers all main living areas: kitchen surfaces and appliances, bathrooms and toilets, bedroom and living room dusting and vacuuming, hard floor mopping, and bin emptying. You can also request specific extras when booking.",
    },
    {
      q: "How often should I book a general clean?",
      a: "Most customers book fortnightly, which keeps the home in great condition between cleans. Weekly cleans are popular for larger families or busy households. One-off cleans are also available for any occasion.",
    },
    {
      q: "Do I need to be home during the clean?",
      a: "No — many of our regular customers provide a key or entry code and go about their day. All our cleaners are vetted, insured, and trusted to work independently in your home.",
    },
    {
      q: "Do you bring your own cleaning products and equipment?",
      a: "You choose: use your own supplies, or we bring eco-friendly cleaning products and equipment for £10 per visit. Just let us know when booking.",
    },
    {
      q: "What Manchester areas do you cover for general cleaning?",
      a: "We cover all of Greater Manchester including City Centre, Salford, Didsbury, Chorlton, Stockport, Trafford, Wythenshawe, Ancoats, and surrounding postcodes.",
    },
  ],


  image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80",
  imageAlt: "Professional cleaner tidying a bright, clean living room in Manchester",

  manchesterAreas: [
    "Manchester City Centre", "Salford", "Didsbury", "Chorlton", "Stretford",
    "Ancoats", "Hulme", "Fallowfield", "Withington", "Stockport",
    "Trafford", "Wythenshawe",
  ],

  seoFooter: `Cleaniq Services provides reliable general cleaning for homes and apartments across Manchester. Whether you need a regular weekly or fortnightly clean in Manchester City Centre, Didsbury, Chorlton, Salford, or Stockport — our vetted, eco-friendly cleaning team delivers a consistently high standard on every visit. Book your Manchester general cleaning service online or call +44 7846 726428.`,
};

const SERVICES_MAP = {
  "regular-house-cleaning-manchester": {
    title: "Regular House Cleaning Manchester | House Cleaners Near You",
    areaNoun: "House cleaners",
    meta: "Weekly, fortnightly or monthly house cleaning in Manchester. Vetted local house cleaners near you, eco-friendly products and a 48-hour re-clean guarantee. Book online.",
    heading: "Regular House Cleaning in Manchester",
    tagline: "Weekly, Fortnightly or Monthly — Your Home, Always Ready.",
    description:
      "Keep on top of your home without giving up your weekends. Book a regular house clean every week, fortnight or month and a vetted Cleaniq cleaner will keep your kitchen, bathrooms, bedrooms and living areas fresh on every visit.",
    points: [
      "Weekly, fortnightly or monthly visits",
      "Kitchen, bathrooms, bedrooms and living areas every visit",
      "Vetted local cleaners and a 48-hour re-clean guarantee",
      "Use your own supplies, or we bring eco-friendly products for £10",
    ],
    extended: "REGULAR",
  },
  "oven-cleaning-manchester": {
    title: "Oven Cleaning Manchester | Oven Cleaners Near You | Cleaniq",
    areaNoun: "Oven cleaners",
    meta: "Professional oven cleaning in Manchester for single, double and range ovens. Local oven cleaners near you, live prices and a 48-hour re-clean guarantee. Book online.",
    heading: "Oven Cleaning in Manchester",
    tagline: "Single, Double & Range Ovens — Cleaned Inside and Out.",
    description:
      "Burnt-on grease and carbon are hard to shift at home. Our oven cleaners take care of the racks, trays, door glass and interior, so your oven is clean and ready to cook with again.",
    points: [
      "Single, double and range ovens",
      "Racks, trays and door glass included",
      "Fixed prices — see the live price list below",
      "Book on its own, or add it to any home clean",
    ],
    priceKeywords: ["oven"],
    extended: "OVEN",
  },
  "carpet-cleaning-manchester": {
    title: "Carpet Cleaning Manchester | Carpet Cleaners Near You",
    areaNoun: "Carpet cleaners",
    meta: "Professional carpet cleaning in Manchester for rooms, rugs, stairs and upholstery. Local carpet cleaners near you with live prices. Book online with Cleaniq Services.",
    heading: "Carpet Cleaning in Manchester",
    tagline: "Fresher Carpets, Stairs & Upholstery.",
    description:
      "Carpets hold on to dust, spills and everyday dirt that vacuuming alone won't lift. Our carpet cleaners pre-treat marks and high-traffic areas and deep clean the fibres, leaving your carpets fresher and brighter.",
    points: [
      "Rooms, stairs, landings and upholstery",
      "Stains and high-traffic areas pre-treated",
      "Fixed prices — see the live price list below",
      "Ideal alongside an end of tenancy or deep clean",
    ],
    priceKeywords: ["carpet", "stairs", "upholstery"],
    extended: "CARPET",
  },
  "end-of-tenancy-cleaning-manchester": {
    title: "End of Tenancy Cleaning Manchester | Cleaners Near You",
    areaNoun: "End of tenancy cleaners",
    meta: "Professional end of tenancy cleaning in Manchester. Fully guaranteed, eco-friendly, and landlord-approved. Book vetted cleaners online in 60 seconds. Call +44 7846 726428.",
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
    title: "Deep Cleaning Manchester | Deep Cleaners Near You",
    areaNoun: "Deep cleaners",
    meta: "One-off deep cleaning for homes and offices in Manchester. Thorough, eco-friendly, and affordable. Book expert deep cleaners online today with Cleaniq Services.",
    heading: "Deep Cleaning Services in Manchester",
    tagline: "Thorough, Eco-Friendly, Meticulous Refresh Cleans.",
    description:
      "Our deep cleaning service in Manchester is designed as a complete full and thorough cleaning of the entirety of your property. Every inch of your home will be cleaned, polished, and scrubbed up to the highest professional standards, and following specifically designed checklists. We guarantee that by scheduling our deep cleaning in Manchester your home will be cleaned to exceptional standards. Our experienced cleaners in Manchester will follow our checklists, which we have designed to make sure that every inch of your home is cleaned and left spotless. However, make sure you advise us on any specific requirements you have for your deep cleaning service and we will make sure those are listed as priorities. Our deep cleaning service is ideal for one-off property resets, while our end of tenancy cleaning Manchester is designed for tenants, landlords and letting agents before check-out.",
    points: [
      "Complete sanitization of all high-contact surfaces",
      "Eco-friendly, chemical-free premium cleaning solutions",
      "Ideal for seasonal spring cleaning or pre-event preparation",
      "Specialized room-by-room thorough checklist",
    ],
    extended: "DEEP",
  },
  "airbnb-cleaning-manchester": {
    title: "Airbnb Cleaning Manchester | Short-Let Cleaners Near You",
    areaNoun: "Airbnb cleaners",
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
    title: "Office Cleaning Manchester | Office Cleaners Near You",
    areaNoun: "Office cleaners",
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
    title: "Post-Construction Cleaning Manchester | Cleaners Near You",
    areaNoun: "After-builders cleaners",
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
  "general-cleaning-manchester": {
    title: "General Cleaning Manchester | Home Cleaners Near You",
    areaNoun: "Home cleaners",
    meta: "One-off general cleaning in Manchester. A thorough whole-home clean from vetted home cleaners near you, eco-friendly products and a 48-hour re-clean guarantee.",
    heading: "General Cleaning Services in Manchester",
    tagline: "A Thorough Whole-Home Clean, Whenever You Need It.",
    description:
      "Need your home cleaned properly, without committing to a schedule? Our general cleaning service is a one-off, whole-home clean from local cleaners — kitchens, bathrooms, bedrooms and living areas left fresh and tidy. Prefer a clean every week or fortnight? See our regular house cleaning.",
    points: [
      "One-off cleans booked around you — no contract",
      "Full room cleaning — kitchens, bathrooms, living areas, bedrooms",
      "Eco-friendly, non-toxic cleaning products safe for families & pets",
      "Vetted, insured, and background-checked professional cleaners",
    ],
    extended: "GENERAL",
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
      {/* Always in the HTML (hidden until opened) so search engines and AI tools can read the answer. */}
      <div className="pb-5" hidden={!open}>
        <p className="text-slate-600 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
};

/* Mobile sticky CTA */
const MobileCTABar = ({ isEOT }) => (
  <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-4 py-3 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
    {isEOT && (
      <a
        href="tel:+447846726428"
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
const REGULAR_EXTENDED = {
  intro: `Searching for reliable house cleaners near you in Manchester? Cleaniq Services' regular house cleaning keeps your home consistently clean on a schedule that suits you — every week, every fortnight or once a month. Every visit follows the same checklist, so your kitchen, bathrooms, bedrooms and living areas are looked after every time, and you can add extras such as oven cleaning whenever you need them.`,

  whyChoosePoints: [
    {
      icon: <BadgeCheck size={22} />,
      title: "Vetted Local House Cleaners",
      body: "Every Cleaniq cleaner has a face-to-face interview, background checks and a practical skills assessment before cleaning a customer's home.",
    },
    {
      icon: <Calendar size={22} />,
      title: "A Schedule That Suits You",
      body: "Choose weekly, fortnightly or monthly visits when you book, and pick the day and arrival time that works for you.",
    },
    {
      icon: <ShieldCheck size={22} />,
      title: "48-Hour Re-Clean Guarantee",
      body: "If anything isn't right after a visit, tell us within 48 hours and we'll send a cleaner back to re-clean it for free.",
    },
    {
      icon: <Sparkles size={22} />,
      title: "Supplies Your Way",
      body: "Use your own cleaning products, or we'll bring eco-friendly products and equipment for £10 per visit.",
    },
  ],

  checklist: {
    heading: "Regular House Cleaning Checklist — Manchester",
    intro: "What our house cleaners look after on every regular visit:",
    rooms: [
      {
        room: "Kitchen",
        tasks: [
          "Wipe worktops, splashbacks and cupboard fronts",
          "Clean the outside of the oven, hob, microwave and fridge",
          "Clean and polish the sink and taps",
          "Wipe handles and light switches",
          "Sweep and mop the floor",
          "Empty and reline bins",
        ],
      },
      {
        room: "Bathrooms & Toilets",
        tasks: [
          "Clean and disinfect toilets",
          "Clean the bath, shower, basin and taps",
          "Wipe tiles, mirrors and glass",
          "Mop the floor",
        ],
      },
      {
        room: "Bedrooms & Living Areas",
        tasks: [
          "Dust surfaces, shelves and furniture",
          "Vacuum carpets, rugs and upholstery",
          "Clean mirrors and glass",
          "Make beds (change linen if left out)",
          "Tidy and straighten cushions and throws",
        ],
      },
      {
        room: "Floors & Finishing Touches",
        tasks: [
          "Vacuum stairs, landings and hallways",
          "Mop hard floors throughout",
          "Wipe skirting boards, door handles and switches",
          "Empty bins in every room",
        ],
      },
    ],
  },

  whyMatters: {
    heading: "Why a Regular Cleaner Makes Life Easier",
    body: [
      "Dust, grease and limescale build up quickly in a busy home. A regular clean deals with them little and often, so they never become a big job — and your home feels ready for visitors every day of the week.",
      "Most of our regular customers tell us the biggest difference is time: no more spending evenings and weekends catching up on housework. Booking a weekly or fortnightly house cleaner hands that job to someone who does it every day.",
      "Because every visit follows the same checklist, nothing gets forgotten. And if you ever need more, you can add extras like oven cleaning or a one-off deep clean when you book.",
    ],
  },

  faqs: [
    {
      q: "How much does regular house cleaning cost in Manchester?",
      a: "Regular house cleaning is charged by the hour. The current rate is shown at the top of this page and comes straight from our booking system. You choose how many hours each visit lasts when you book.",
    },
    {
      q: "How often can I book a regular cleaner?",
      a: "Weekly, fortnightly or monthly. Choose the frequency, day and arrival time when you book, and your future visits are scheduled for you.",
    },
    {
      q: "Do I need to be home while the house cleaner is there?",
      a: "No. Many customers leave a key or entry code — just add access notes when you book.",
    },
    {
      q: "Do your cleaners bring cleaning products?",
      a: "You choose: use your own supplies, or we bring eco-friendly cleaning products and equipment for £10 per visit.",
    },
    {
      q: "What if I'm not happy with a clean?",
      a: "Tell us within 48 hours and we'll send a cleaner back to re-clean anything that wasn't right, free of charge.",
    },
    {
      q: "Where do you have house cleaners near me?",
      a: "We clean homes across Manchester and Greater Manchester, including Manchester City Centre, Salford, Trafford, Stockport, Didsbury, Chorlton, Bolton, Bury, Oldham, Rochdale, Tameside and Wigan.",
    },
  ],

  manchesterAreas: AREAS.map((a) => a.name),

  seoFooter: `Cleaniq Services provides regular house cleaning across Manchester and Greater Manchester. Looking for a house cleaner near you in Salford, Didsbury, Chorlton, Stockport, Trafford or Manchester City Centre? Book weekly, fortnightly or monthly cleaning from vetted local cleaners online, or call +44 7846 726428.`,
};

const OVEN_EXTENDED = {
  intro: `Looking for oven cleaning near you in Manchester? Cleaniq Services' oven cleaners clean single, double and range ovens inside and out — racks, trays, door glass and the oven interior — so your kitchen looks and smells fresh again. Book an oven clean on its own, or add it to a regular, deep or end of tenancy clean.`,

  whyChoosePoints: [
    {
      icon: <Sparkles size={22} />,
      title: "Inside and Out",
      body: "Racks, trays, door glass and the oven interior are all cleaned, not just the parts you can see.",
    },
    {
      icon: <BadgeCheck size={22} />,
      title: "Fixed, Upfront Prices",
      body: "Every oven size has a fixed price, shown live on this page from our booking system — no surprises.",
    },
    {
      icon: <Calendar size={22} />,
      title: "On Its Own or With a Clean",
      body: "Book an oven clean by itself, or add it as an extra to any home, deep or end of tenancy clean.",
    },
    {
      icon: <ShieldCheck size={22} />,
      title: "48-Hour Re-Clean Guarantee",
      body: "If anything isn't right, tell us within 48 hours and we'll come back and put it right for free.",
    },
  ],

  checklist: {
    heading: "Oven Cleaning Checklist — Manchester",
    intro: "What our oven cleaners cover on every oven clean:",
    rooms: [
      {
        room: "Inside the Oven",
        tasks: [
          "Remove racks, trays and shelf supports",
          "Clean the oven walls, base and roof",
          "Remove grease and carbon build-up",
          "Wipe out and dry the oven cavity",
        ],
      },
      {
        room: "Door & Glass",
        tasks: [
          "Clean the inner and outer door glass",
          "Wipe the door seal and hinges",
          "Clean the door frame",
        ],
      },
      {
        room: "Racks & Trays",
        tasks: [
          "Soak and degrease racks and shelves",
          "Clean baking trays and grill pans",
          "Refit everything once clean",
        ],
      },
      {
        room: "Outside & Finishing",
        tasks: [
          "Wipe control knobs, handles and the oven front",
          "Leave the surrounding area clean and tidy",
        ],
      },
    ],
  },

  whyMatters: {
    heading: "Why Get Your Oven Professionally Cleaned",
    body: [
      "Grease and food spills bake on every time you cook. Over time they build up into a layer that smokes, smells and is very hard to remove with everyday products.",
      "A professional oven clean removes that build-up properly — including the door glass and racks — so cooking smells come from your food, not last month's roast.",
      "If you're moving out, a clean oven matters: landlords and letting agents usually check it at the end of a tenancy. Add an oven clean to your end of tenancy clean to cover it.",
    ],
  },

  faqs: [
    {
      q: "How much does oven cleaning cost in Manchester?",
      a: "Each oven size has a fixed price. The price list on this page comes straight from our booking system, so it always shows today's prices.",
    },
    {
      q: "Which ovens do you clean?",
      a: "Single ovens, double ovens and range ovens. Choose the right size when you book so the price matches your oven.",
    },
    {
      q: "Can I add oven cleaning to another clean?",
      a: "Yes. Add oven cleaning as an extra when you book a regular, deep or end of tenancy clean, or book it on its own.",
    },
    {
      q: "Do I need to be home for an oven clean?",
      a: "No. Many customers leave a key or entry code — just add access notes when you book.",
    },
    {
      q: "What if I'm not happy with the result?",
      a: "Tell us within 48 hours and we'll send a cleaner back to put it right, free of charge.",
    },
    {
      q: "Do you have oven cleaners near me?",
      a: "Our oven cleaners cover Manchester and Greater Manchester, including Manchester City Centre, Salford, Trafford, Stockport, Didsbury, Chorlton, Bolton, Bury, Oldham, Rochdale, Tameside and Wigan.",
    },
  ],

  manchesterAreas: AREAS.map((a) => a.name),

  seoFooter: `Cleaniq Services provides professional oven cleaning across Manchester and Greater Manchester. Looking for oven cleaners near you in Salford, Didsbury, Chorlton, Stockport, Trafford or Manchester City Centre? Book single, double or range oven cleaning online at a fixed price, or call +44 7846 726428.`,
};

const CARPET_EXTENDED = {
  intro: `Looking for carpet cleaning near you in Manchester? Cleaniq Services' carpet cleaners deep clean carpets, stairs, landings and upholstery, pre-treating marks and high-traffic areas to lift the dirt that vacuuming leaves behind. Book carpet cleaning on its own, or add it to an end of tenancy or deep clean.`,

  whyChoosePoints: [
    {
      icon: <Sparkles size={22} />,
      title: "Deeper Than Vacuuming",
      body: "We pre-treat marks and high-traffic areas, then deep clean the carpet fibres to lift ground-in dirt.",
    },
    {
      icon: <BadgeCheck size={22} />,
      title: "Fixed, Upfront Prices",
      body: "Carpets, stairs and upholstery each have a fixed price, shown live on this page from our booking system.",
    },
    {
      icon: <HomeIcon size={22} />,
      title: "Perfect for Moving Day",
      body: "Add carpet cleaning to your end of tenancy clean so the whole property is handed back fresh.",
    },
    {
      icon: <ShieldCheck size={22} />,
      title: "48-Hour Re-Clean Guarantee",
      body: "If anything isn't right, tell us within 48 hours and we'll come back and put it right for free.",
    },
  ],

  checklist: {
    heading: "Carpet Cleaning Checklist — Manchester",
    intro: "What our carpet cleaners do on every carpet clean:",
    rooms: [
      {
        room: "Preparation",
        tasks: [
          "Move small items off the carpet",
          "Thoroughly vacuum to lift loose dirt and dust",
          "Check the carpet type and any problem areas",
        ],
      },
      {
        room: "Deep Clean",
        tasks: [
          "Pre-treat marks, spills and high-traffic areas",
          "Deep clean the carpet fibres",
          "Remove as much moisture as possible",
        ],
      },
      {
        room: "Stairs & Landings",
        tasks: [
          "Clean each stair tread and riser",
          "Pay extra attention to edges and corners",
        ],
      },
      {
        room: "Finishing",
        tasks: [
          "Groom the carpet pile",
          "Put small items back",
          "Give advice on drying and aftercare",
        ],
      },
    ],
  },

  whyMatters: {
    heading: "Why Professional Carpet Cleaning Is Worth It",
    body: [
      "Carpets trap dust, crumbs and everyday dirt deep in the fibres. Regular vacuuming lifts the surface, but the ground-in dirt that dulls carpets over time needs a deeper clean.",
      "Professional carpet cleaning refreshes the whole carpet, brightening colours and tackling marks on busy walkways, stairs and landings.",
      "It's especially worth it when you move: a fresh carpet helps a property feel cared for when it's handed back to a landlord or shown to new tenants.",
    ],
  },

  faqs: [
    {
      q: "How much does carpet cleaning cost in Manchester?",
      a: "Carpets, stairs and upholstery each have a fixed price. The price list on this page comes straight from our booking system, so it always shows today's prices.",
    },
    {
      q: "How long do carpets take to dry?",
      a: "It depends on the carpet, the room temperature and ventilation. Opening windows and keeping the heating on helps carpets dry faster.",
    },
    {
      q: "Will every stain come out?",
      a: "We pre-treat marks and do everything we can, but some old or set-in stains may not come out completely. We'll let you know if a stain is likely to stay.",
    },
    {
      q: "Can I add carpet cleaning to an end of tenancy clean?",
      a: "Yes. Add carpet cleaning as an extra when you book your end of tenancy, deep or regular clean, or book it on its own.",
    },
    {
      q: "What if I'm not happy with the result?",
      a: "Tell us within 48 hours and we'll send a cleaner back to put it right, free of charge.",
    },
    {
      q: "Do you have carpet cleaners near me?",
      a: "Our carpet cleaners cover Manchester and Greater Manchester, including Manchester City Centre, Salford, Trafford, Stockport, Didsbury, Chorlton, Bolton, Bury, Oldham, Rochdale, Tameside and Wigan.",
    },
  ],

  manchesterAreas: AREAS.map((a) => a.name),

  seoFooter: `Cleaniq Services provides professional carpet cleaning across Manchester and Greater Manchester. Looking for carpet cleaners near you in Salford, Didsbury, Chorlton, Stockport, Trafford or Manchester City Centre? Book carpet, stair and upholstery cleaning online at a fixed price, or call +44 7846 726428.`,
};

const EXTENDED_MAP = {
  EOT: EOT_EXTENDED,
  DEEP: DEEP_EXTENDED,
  AIRBNB: AIRBNB_EXTENDED,
  OFFICE: OFFICE_EXTENDED,
  POST: POST_CONSTRUCTION_EXTENDED,
  GENERAL: GENERAL_EXTENDED,
  REGULAR: REGULAR_EXTENDED,
  OVEN: OVEN_EXTENDED,
  CARPET: CARPET_EXTENDED,
};
// Live prices: find the service in the price list that belongs to a page slug.
const slugify = (name) =>
  String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
// Prefers the main (Base) service, so "Book" never preselects an add-on extra.
const matchServiceForSlug = (slug, services) => {
  const matches = services.filter((s) => {
    const nameSlug = slugify(s.name);
    return slug.includes(nameSlug) || nameSlug.includes(slug.split("-")[0]);
  });
  return matches.find((s) => s.category === "Base") || matches[0] || null;
};
const formatPrice = (s) => `£${Number(s.rate).toFixed(2)}${s.type === "hourly" ? " per hour" : ""}`;
const priceListFor = (keywords, services) => {
  if (!keywords?.length) return [];
  const seen = new Set();
  return services
    .filter((s) => Number(s.rate) > 0 && keywords.some((k) => s.name.toLowerCase().includes(k)))
    .filter((s) => {
      const key = slugify(s.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => Number(a.rate) - Number(b.rate));
};
// "From" price for a service page: the cheapest of its main service and its price-list options.
const fromPriceForPage = (slug, services) => {
  const main = matchServiceForSlug(slug, services);
  const options = priceListFor(SERVICES_MAP[slug]?.priceKeywords, services.filter((s) => s !== main));
  const cheapest = [main, ...options].filter((s) => s && s.rate != null).sort((a, b) => Number(a.rate) - Number(b.rate))[0];
  return formatFromPrice(cheapest);
};
const formatFromPrice = (s) =>
  s && s.rate != null
    ? `From £${Number(s.rate).toFixed(2)}${s.type === "hourly" ? "/hr" : ""}`
    : null;

/* ─── MAIN PAGE ─────────────────────────────────────────────────── */
const ServiceDetail = () => {
  const { serviceSlug } = useParams();
  const g = useGoogleReviews();
  const service = SERVICES_MAP[serviceSlug];
  const isEOT = serviceSlug === "end-of-tenancy-cleaning-manchester";
  const ext = service?.extended ? EXTENDED_MAP[service.extended] : null;
  const isDeep = serviceSlug === "deep-cleaning-manchester";
  const pageFaqs = isDeep ? DEEP_FAQS : isEOT ? EOT_FAQS : ext?.faqs || [];
  const [liveServices, setLiveServices] = React.useState([]);
  const liveMatch = matchServiceForSlug(serviceSlug, liveServices);
  const servicePrice = fromPriceForPage(serviceSlug, liveServices);
  const serviceName = liveMatch?.name || "";
  const pageInfo = SERVICE_PAGES.find((p) => p.slug === serviceSlug);
  const bookingLink = serviceName ? `/booking?service=${encodeURIComponent(serviceName)}` : "/booking";
  const quoteLink = whatsappLink(
    `Hi Cleaniq! I'd like a quote for ${pageInfo ? pageInfo.name.toLowerCase() : "a clean"}.`,
  );
  const relatedServices = SERVICE_PAGES.filter((p) => p.slug !== serviceSlug);
  // The page's main service is priced in the hero, so the list shows the specific options.
  const priceList = priceListFor(service?.priceKeywords, liveServices.filter((s) => s !== liveMatch));
  const areaNoun = service?.areaNoun || "Cleaners";

  useEffect(() => {
    let active = true;
    fetch(`${import.meta.env.VITE_API_URL}/services?region=UK&booking=1`)
      .then((res) => res.json())
      .then((data) => { if (active && Array.isArray(data)) setLiveServices(data); })
      .catch((err) => console.error("Failed to fetch prices", err));
    return () => { active = false; };
  }, []);
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
            href={`https://www.cleaniqservices.com/service/${serviceSlug}`}
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
              url: `https://www.cleaniqservices.com/service/${serviceSlug}`,
              provider: { "@id": "https://www.cleaniqservices.com#localbusiness" },
            })}
          </script>
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://www.cleaniqservices.com/" },
                { "@type": "ListItem", position: 2, name: "Services", item: "https://www.cleaniqservices.com/services" },
                { "@type": "ListItem", position: 3, name: service.heading, item: `https://www.cleaniqservices.com/service/${serviceSlug}` },
              ],
            })}
          </script>
          {pageFaqs.length > 0 && (
            <script type="application/ld+json">
              {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: pageFaqs.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: typeof f.a === "string" ? f.a : String(f.a) },
                })),
              })}
            </script>
          )}
        </Helmet>

        {/* ══ HERO ═══════════════════════════════════════════════════ */}
        <div
          className="bg-primary bg-cover bg-center text-white pt-28 sm:pt-32 md:pt-36 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-10 xl:px-16"
          style={
            pageInfo
              ? {
                  backgroundImage: `linear-gradient(rgba(6, 24, 20, 0.86), rgba(6, 24, 20, 0.78)), url(${pageInfo.image(1600)})`,
                }
              : undefined
          }
        >
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-x-2 gap-y-1  mt-2 text-xs text-slate-400 mb-8 tracking-wide">
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
            <span className="text-slate-300" aria-current="page">
              {service.heading}
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
                    {g.rating} ·{" "}
                    <span className="text-white font-semibold">
                      on Google
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
                {servicePrice && (
                  <p className="text-2xl font-bold text-slate-900 mb-1">
                    {servicePrice}
                  </p>
                )}
                <p className="text-xs text-slate-400 mb-5">
                  No hidden fees · Insured cleaners
                </p>
                <Link
                  to={bookingLink}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg bg-[#00B5A4] text-white font-bold text-sm hover:bg-teal-600 transition-colors"
                >
                  Book in 60 Seconds <ArrowRight size={16} />
                </Link>
                <a

                  href={quoteLink}

                  target="_blank"

                  rel="noopener noreferrer"

                  className="flex items-center justify-center gap-2 w-full py-3 mt-2.5 rounded-lg border border-[#00B5A4] text-[#00B5A4] font-bold text-sm hover:bg-teal-50 transition-colors"

                >

                  Get a quote on WhatsApp

                </a>
                {isEOT && (
                  <>
                    <a
                      href="tel:+447846726428"
                      className="flex items-center justify-center gap-2 w-full py-3 mt-3 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm hover:border-teal-400 hover:text-teal-700 transition-colors"
                    >
                      <Phone size={14} /> +44 7846 726428
                    </a>
                  </>
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
              { value: `${g.rating}★`, label: "Google rating" },
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

        {/* End of tenancy only: intro banner (owner-supplied text, word for word) */}
        {isEOT && (
          <section className="px-4 sm:px-6 lg:px-10 xl:px-16 pt-10 sm:pt-14">
            <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-white p-6 sm:p-10 grid lg:grid-cols-5 gap-8 items-center">
              <div className="lg:col-span-3 space-y-4">
                <p className="text-xs font-bold tracking-widest uppercase text-teal-600">Cleaniq Services</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Manchester End of Tenancy Cleaning
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Our End of Tenancy Cleaning Service in Manchester will be provided up to the highest possible standards.
                </p>
                <p className="text-slate-700 font-semibold leading-relaxed">
                  Make sure your deposit is safely returned in full and schedule our End of Tenancy Cleaning in Manchester today.
                </p>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl bg-white border border-slate-200 p-5">
                  <p className="text-sm font-semibold text-slate-500 mb-3">This is a service for:</p>
                  <div className="flex flex-wrap gap-2">
                    {["Domestic Clients", "Commercial Clients"].map((who) => (
                      <span key={who} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-800 text-sm font-semibold">
                        <Check size={14} className="stroke-[3]" /> {who}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-[#0A1520] text-white p-5">
                  <Phone size={18} className="text-teal-400 shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">
                    We are always available for any questions you may have! Our phone lines are open 24/7
                  </p>
                </div>
              </div>
            </div>

            {/* Full move-out clean (owner-supplied text; another company's name replaced with
                Cleaniq Services, guarantee set to our 48 hours) */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
              <p className="text-xs font-bold tracking-widest uppercase text-teal-600 mb-2">Full Move-Out Clean</p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-5">End of tenancy cleaning across Manchester</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Cleaniq Services offers our End of Tenancy Cleaning on all postcodes in Manchester and the surrounding area. Are you moving out, if so our End of Tenancy Cleaning in Manchester will ensure that the move-out process is as stress-free and as easy for you as possible. No matter if you are a tenant, estate agent, or landlord, our End of Tenancy Cleaning is designed to completely transform a property and our expert cleaners will make sure that every inch is cleaned and polished.
                </p>
                <p>
                  The End of Tenancy Cleaning in Manchester offered by Cleaniq Services will meet even the most specific cleaning requirements, no matter who contact us, if you are ending your tenancy and cleaning service you can rely on you can put your trust in Cleaniq Services. We offer a comprehensive move-out clean with affordable prices, expert cleaners, and a 100% satisfaction guarantee on completion of the cleaning service. If you want your deposit back book our End of Tenancy Cleaning Service in Manchester now.
                </p>
                <p>
                  You will receive a list of comprehensive benefits from our End of Tenancy Cleaning Service, we offer a full internal clean of your property and a 48-hour guarantee upon completion of the service. Our quality of cleaning along with the guarantee period means that you will receive an exceptional cleaning service, which will meet even the most strict requirements, and that you can rest assured that all requests after a final inspection after you move out of your property take place, will be met. If you are a tenant you can be sure that your deposit will be successfully returned, if you are a landlord you can be sure that your property will be professionally cleaned and ready for the next tenants to move into.
                </p>
                <p>
                  If you would like to receive a perfectly FREE Quote for our End of Tenancy Cleaning Service in Manchester you can contact us today on{" "}
                  <a href="tel:+447846726428" className="text-teal-700 font-semibold hover:underline">07846 726428</a> or simply fill out the corresponding{" "}
                  <Link to="/get-a-quote" className="text-teal-700 font-semibold hover:underline">End of Tenancy Cleaning request form</Link> listed below.
                </p>
                <p className="text-slate-800 font-semibold">
                  Is it time to move out and are you looking for an End of Tenancy Cleaning in Manchester, if yes call Cleaniq Services today! Cleaniq Services will provide you with the best end of tenancy cleaning in Manchester at the best possible price. You will receive many benefits from our Manchester End of Tenancy Cleaning.
                </p>
              </div>
            </div>
          </section>
        )}

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

              {/* End of tenancy only: benefits (owner-supplied text, word for word) */}
              {isEOT && (
                <>
                  <Divider />
                  <section>
                    <SectionLabel>Benefits</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
                      Benefits of our Manchester End of Tenancy Cleaning
                    </h2>
                    <ul className="grid sm:grid-cols-2 gap-3 mb-6">
                      {[
                        "48-Hour Guarantee - Free Re-Clean if necessary",
                        "Competitive Prices",
                        "Fully trained and experienced cleaners",
                        "Professional Detergents and Equipment",
                        "We follow specific End of Tenancy Cleaning Checklists provided by estate agencies",
                        "Non-hazardous and eco-friendly cleaning detergents",
                        "Our End of Tenancy Cleaning Services comes with a 100% satisfaction guarantee.",
                      ].map((benefit) => (
                        <li key={benefit} className="flex gap-3 items-start p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Check size={11} className="stroke-[3]" />
                          </div>
                          <span className="text-slate-700 text-sm font-medium leading-snug">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-slate-600 leading-relaxed">
                      We will provide you with exceptional quality end-of-tenancy cleaning at just the right cost. Our End of Tenancy Cleaning Service is specifically designed to make sure that the move-out process is as stress-free and as easy for you as possible. If you are for whatever reason not completely satisfied with any part of the end of tenancy cleaning provided by Cleaniq Services or if after an inspection any areas have to be covered by our cleaners again, we will come back and provide you with a completely free of charge re-clean as long as you make us aware of this in the period of the guarantee. Our fully trained professional cleaners have years of experience in providing End of Tenancy Cleaning Services. You can contact us 24/7 at any point convenient for you.
                    </p>
                  </section>

                  {/* How it works (owner-supplied text, word for word) */}
                  <Divider />
                  <section>
                    <SectionLabel>How it Works</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Manchester End of Tenancy Cleaning</h2>
                    <ol className="grid sm:grid-cols-2 gap-4">
                      {[
                        { title: "Schedule", body: "Contact us over the phone with your original end of tenancy cleaning service inquiry. Provide some basic information about your property, and personal requirements for the service and receive a perfectly free quote for your end of tenancy cleaning over the phone in a single 5 minute conversation and choose to accept it." },
                        { title: "Service", body: "All you have to do after is grant access to our cleaners, our experienced end of tenancy cleaning service providers will take care of the hard work, leaving your property clean, sparkling, and ready for the inventory inspection. It is a simple as that, our cleaners have years of experience in providing end of tenancy cleaning services in Manchester." },
                        { title: "Inspection", body: "After your end of tenancy cleaning service has concluded our Manchester cleaners will ask you to inspect your property and make sure that you are happy with the results of your end of tenancy cleaning service. Please note that our cleaners are instructed to cover any area of your property until it is cleaned up to your satisfaction." },
                        { title: "Result", body: "Sit back and enjoy the results of your end of tenancy cleaning services in Manchester. Our end of tenancy cleaning is a complete and comprehensive internal cleaning of the entirety of your property. Our end of tenancy cleaning services will leave your property sparkling clean and we will make sure that your deposit is safely returned in full." },
                      ].map((step, n) => (
                        <li key={step.title} className="relative p-5 pt-6 rounded-xl bg-white border border-slate-200 shadow-sm">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="w-9 h-9 rounded-full bg-[#00B5A4] text-white font-bold flex items-center justify-center shrink-0" aria-hidden="true">{n + 1}</span>
                            <h3 className="font-bold text-slate-900">{step.title}</h3>
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed">{step.body}</p>
                        </li>
                      ))}
                    </ol>
                  </section>
                </>
              )}

              {/* Deep cleaning only: tailored service (owner-supplied text, word for word) */}
              {serviceSlug === "deep-cleaning-manchester" && (
                <>
                  <Divider />
                  <section>
                    <SectionLabel>Choose Cleaniq Services for your next deep cleaning</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                      Deep Cleaning - A Cleaning Service Tailored To Your Needs
                    </h2>
                    <p className="text-slate-600 leading-relaxed mb-5">
                      Our Manchester deep cleaning service follows specific checklists that have been designed by us to make sure that every inch of your property is cleaned and polished up to the highest possible standards. As such our Manchester cleaners will follow this checklist, however, if you have any individual requirements for your deep cleaning services you can always let us know.
                    </p>
                    <p className="text-slate-600 leading-relaxed mb-5">
                      You can configure your deep cleaning up to your exact specifications. Choose which areas of your property you would like our cleaners to focus on, choose the day and time for your deep cleaning service, and if you are interested you can always add several additional services to your deep cleaning and make sure that you will receive a personalized, tailored to your requirements cleaning service in a matter of hours.
                    </p>
                    <p className="text-slate-700 font-semibold mb-3">
                      Additional Services you can add to your deep cleaning in Manchester include:
                    </p>
                    <ul className="grid sm:grid-cols-3 gap-3">
                      {["Carpet Cleaning", "Upholstery Cleaning", "External Window Cleaning"].map((extra) => (
                        <li key={extra} className="flex gap-3 items-start p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Check size={11} className="stroke-[3]" />
                          </div>
                          <span className="text-slate-700 text-sm font-medium leading-snug">{extra}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              )}

              {/* Why Choose section */}
              {ext && (
                <>
                  <Divider />
                  {isEOT ? (
                  <section>
                    {/* End of tenancy: owner-supplied "why choose us" (72-hour set to our 48 hours) */}
                    <SectionLabel>Why Choose Us</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
                      Why Choose Us For Your End Of Tenancy Cleaning Service
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-5">
                      {[
                        { icon: <BadgeCheck size={18} />, title: "Dedicated Professional Cleaning Staff", body: "Our cleaning technicians are fully trained, vetted, instructed, insured, and experienced professionals." },
                        { icon: <Sparkles size={18} />, title: "Professional Cleaning Detergents and Equipment", body: "We will provide all necessary cleaning supplies as part of the End of Tenancy Cleaning." },
                        { icon: <ShieldCheck size={18} />, title: "48-Hour Guarantee", body: "Our End of Tenancy Cleaning in Manchester comes with a 48-hour guarantee on completion, you can be sure that you will get your deposit back in full!" },
                        { icon: <Star size={18} />, title: "Great End of Tenancy Cleaning At Just The Right Cost", body: "We will provide you with the best possible End Of Tenancy cleaning at the best possible price." },
                        { icon: <Calendar size={18} />, title: "7 Day Availability", body: "We are available for the End of Tenancy Cleaning 7 days a week on all postcodes in Greater Manchester at a time convenient for you." },
                        { icon: <Check size={18} />, title: "Attention To Detail", body: "Our End of Tenancy Cleaners will focus on even the smallest details in your property, for example, light switches, or the biggest challenges, for example, full professional oven cleaning." },
                      ].map((pt) => (
                        <div key={pt.title} className="flex gap-4 items-start">
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
                  ) : serviceSlug === "deep-cleaning-manchester" ? (
                  <section>
                    {/* Deep cleaning: owner-supplied "why choose us" text, word for word */}
                    <SectionLabel>Why Cleaniq Services</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                      Why Choose Our Deep Cleaning Services?
                    </h2>
                    <p className="text-slate-600 leading-relaxed mb-8">
                      Our Deep Cleaning in Manchester will transform your property. Our Deep Cleaning is intended to be a complete internal cleaning of your home, therefore it is not necessary to schedule our Deep Cleaning on a shorter frequency. To maintain the cleaning results we recommended that you schedule our Deep Cleaning Service once every 2-3 months. The price for our Deep Cleaning includes all professional cleaning detergents and equipment and you can combine our Deep Clean with any one of your additional services. If you combine our Deep Cleaning with any additional services offered by Cleaniq Services you will receive a personalized discount on the final price.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-5">
                      {[
                        { icon: <ShieldCheck size={18} />, title: "Reliable Services delivered by professional and insured cleaners." },
                        { icon: <Phone size={18} />, title: "24/7 customer service." },
                        { icon: <Calendar size={18} />, title: "7-day-a-week availability." },
                        { icon: <Clock size={18} />, title: "Flexible Schedule." },
                        { icon: <BadgeCheck size={18} />, title: "Obligation-free quotes." },
                        { icon: <Sparkles size={18} />, title: "Professional cleaning detergents and equipment will be provided by us as part of the Deep Cleaning Services in Manchester." },
                        { icon: <Check size={18} />, title: "Easy to follow the booking process." },
                        { icon: <Star size={18} />, title: "The Deep Cleaning Services can easily be personalized to fit your specific cleaning requirements." },
                        { icon: <Sparkles size={18} />, title: "Extra cleaning services.", body: "Feel free to combine our deep cleaning in Manchester with any one of our additional services and you will receive a personalized discount on the final price" },
                      ].map((pt) => (
                        <div key={pt.title} className="flex gap-4 items-start">
                          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                            {pt.icon}
                          </div>
                          <div className="pt-2">
                            <p className="font-bold text-slate-900 text-sm mb-1">{pt.title}</p>
                            {pt.body && <p className="text-slate-500 text-sm leading-relaxed">{pt.body}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  ) : (
                  <section>
                    <SectionLabel>Why Cleaniq Services</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
                      Why Choose Cleaniq Services for {service.heading}?
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
                  )}

                  {/* Deep cleaning only: about our deep cleaning (owner-supplied text, word for word) */}
                  {serviceSlug === "deep-cleaning-manchester" && (
                    <>
                      <Divider />
                      <section className="space-y-5">
                        <p className="text-slate-600 leading-relaxed">
                          The Deep Cleaning Services offered by Cleaniq Services are designed to transform your home. If you require Deep Cleaning in Manchester, Cleaniq Services can help you. Our Manchester Deep Cleaning Service is our most popular cleaning service among clients that are not moving out of their homes, and simply want to have their property freshened up and transformed.
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          If you are moving out of your house or flat we would recommend that you schedule our{" "}
                          <Link to="/service/end-of-tenancy-cleaning-manchester" className="text-teal-700 font-semibold hover:underline">End of Tenancy Cleaning Service</Link>, if you have had your property refurbished we would recommend that you schedule our{" "}
                          <Link to="/service/post-construction-cleaning-manchester" className="text-teal-700 font-semibold hover:underline">After Builders Cleaning</Link>, however, if you want to completely transform the condition of your property or if you have just moved in then our Deep Cleaning is the service for you.
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          As part of our Deep Clean in Manchester, our cleaners will cover your property inch-by-inch, cleaning even the hardest-to-reach places, they will leave no corner untouched and will make sure that they transform the condition of your house or flat. The condition of your home will be utterly transformed, your property will be neat, tidy, and perfectly cleaned.
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          If you would like to schedule our Deep Cleaning Services on all postcodes in Greater Manchester you can contact us at{" "}
                          <a href="tel:+447846726428" className="text-teal-700 font-semibold hover:underline">07846 726428</a> 24 hours a day 7 days a week for a perfectly FREE quote for your Deep Clean, or alternatively, simply fill out the corresponding{" "}
                          <Link to="/get-a-quote" className="text-teal-700 font-semibold hover:underline">cleaning service request form</Link> linked below.
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          Take advantage of the many benefits you will receive from our Deep Cleaning Services in Manchester.
                        </p>
                      </section>
                    </>
                  )}

                  <Divider />

                  {priceList.length > 0 && (
                    <>
                      <section>
                        <SectionLabel>Prices</SectionLabel>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                          {service.heading} Prices
                        </h2>
                        <p className="text-sm text-slate-500 mb-5">
                          Fixed prices, updated automatically from our booking system.
                        </p>
                        <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                          {priceList.map((p) => (
                            <div key={p._id || p.name} className="flex items-center justify-between gap-4 px-5 py-3.5 bg-white">
                              <span className="text-sm font-semibold text-slate-800">{p.name}</span>
                              <span className="text-sm font-bold text-teal-700 whitespace-nowrap">{formatPrice(p)}</span>
                            </div>
                          ))}
                        </div>
                      </section>

                      <Divider />
                    </>
                  )}

                  {/* Checklist */}
                  <section>
                    <SectionLabel>Room-by-room checklist</SectionLabel>

                    {serviceSlug === "deep-cleaning-manchester" && (
                      <div className="mb-12">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Deep Cleaning Checklist</h2>
                        <h3 className="text-base sm:text-lg font-semibold text-teal-700 mb-4">
                          What is included in our Deep Cleaning Service in Manchester
                        </h3>
                        <p className="text-slate-600 leading-relaxed mb-8">
                          Cleaniq Services is able to help with all of your domestic deep cleaning needs. No matter the size and scope of the job our Manchester deep cleaning technicians are always able to offer a helping hand. Our deep cleaning services follow a specific checklist, which all of our cleaners in Manchester are instructed to follow. However, the deep cleaning service can also be tailored to meet your specific cleaning requirements. See some of the basics that are included in our deep cleaning services in Manchester below, when you contact us with your deep cleaning inquiry make sure to advise us on any personal specifications you may have and we will make sure that those are listed as priorities every time you schedule our deep cleaning.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-5">
                          {DEEP_ROOMS.map((r) => (
                            <article key={r.room} className="flex flex-col rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
                              {r.image ? (
                                <img src={r.image} alt={r.alt} loading="lazy" width="1000" height="750" className="w-full aspect-[16/9] object-cover" />
                              ) : (
                                <div className="w-full aspect-[16/9] bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center" aria-hidden="true">
                                  <Sparkles size={40} className="text-teal-500" />
                                </div>
                              )}
                              <div className="flex flex-col grow p-5">
                                <div className="flex items-start justify-between gap-3 mb-4">
                                  <div>
                                    <p className="text-[11px] font-bold tracking-widest uppercase text-teal-600">Deep Cleaning</p>
                                    <h4 className="text-lg font-bold text-slate-900 leading-tight">{r.room}</h4>
                                  </div>
                                  <Link
                                    to={bookingLink}
                                    className="shrink-0 px-3.5 py-2 rounded-lg bg-[#00B5A4] text-white text-xs font-bold hover:bg-teal-600 transition-colors"
                                  >
                                    Book now
                                  </Link>
                                </div>
                                <ul className="space-y-2.5 grow">
                                  {r.tasks.map((task) => (
                                    <li key={task} className="flex gap-2.5 items-start">
                                      <Check size={14} className="text-teal-500 shrink-0 mt-0.5 stroke-[2.5]" />
                                      <span className="text-slate-600 text-sm leading-snug">{task}</span>
                                    </li>
                                  ))}
                                </ul>
                                <a href="#full-checklist" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline">
                                  View full checklist <ArrowRight size={14} />
                                </a>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    )}

                    {isEOT ? (
                      <>
                        <h2 id="full-checklist" className="scroll-mt-32 text-xl sm:text-2xl font-bold text-slate-900 mb-1">End of Tenancy Cleaning Checklist</h2>
                        <p className="text-sm font-semibold text-teal-700 mb-6">Inventory Standard</p>
                        <div className="grid sm:grid-cols-2 gap-5 items-start">
                          {EOT_ROOMS.map((r) => <EotRoomCard key={r.room} room={r} bookingLink={bookingLink} />)}
                        </div>
                      </>
                    ) : (
                    <>
                    <h2 id="full-checklist" className="scroll-mt-32 text-xl sm:text-2xl font-bold text-slate-900 mb-2">
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
                    </>
                    )}
                  </section>

                  {/* Deep cleaning only: benefits and customising (owner-supplied text, word for word) */}
                  {serviceSlug === "deep-cleaning-manchester" && (
                    <>
                      <Divider />
                      <section>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
                          Benefits of our Manchester Deep Cleaning Service
                        </h2>
                        <ul className="grid sm:grid-cols-2 gap-3">
                          {[
                            "Outstanding Cleaning Service results delivered by professional and experienced cleaners.",
                            "Our Deep Cleaning can easily be customized to fit your specific requirements.",
                            "No need to vacate, rearrange, or prepare your property in any way prior to our Deep Cleaning taking place.",
                            "FREE quotes and 7 days a week availability.",
                            "Effective, hassle-free service.",
                            "Easy and straightforward booking process.",
                            "Your home will be left sparkling.",
                          ].map((benefit) => (
                            <li key={benefit} className="flex gap-3 items-start p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                              <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                              <Check size={11} className="stroke-[3]" />
                            </div>
                              <span className="text-slate-700 text-sm font-medium leading-snug">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </section>

                      <Divider />
                      <section className="space-y-5">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                          Customize your Deep Cleaning Service
                        </h2>
                        <p className="text-slate-600 leading-relaxed">
                          You can schedule our Deep Cleaning Services in Manchester at any time convenient for you, you can book your next Deep Cleaning simply and easily over the phone within a matter of minutes. You will be given an obligation-free quote which you can quite easily proceed with all in the same phone call. If you want to receive the best deep clean in Manchester you can call us today on{" "}
                          <a href="tel:+447846726428" className="text-teal-700 font-semibold hover:underline">07846 726428</a>.
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          Our Deep Cleaning Services in Manchester will leave your home sparkling and shining. Kitchen, Bathroom, Bedrooms, and every area of your house or flat will be deep cleaned and left in pristine condition. Our Deep Cleaning Services in Manchester come with many benefits! Take advantage of those today!
                        </p>
                        <ul className="grid sm:grid-cols-2 gap-3">
                          {[
                            "Flexible booking slots are available.",
                            "7 Day a week availability",
                            "Non-hazardous eco-friendly cleaning solutions",
                            "Fully insured and vetted cleaning professionals.",
                          ].map((point) => (
                            <li key={point} className="flex gap-3 items-start p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                              <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                              <Check size={11} className="stroke-[3]" />
                            </div>
                              <span className="text-slate-700 text-sm font-medium leading-snug">{point}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-slate-600 leading-relaxed">
                          You can freely customize our deep cleaning service to meet the requirements of your apartment or your house cleaning needs. You can freely choose the day and time you schedule your deep cleaning service in Manchester, you can advise us on what areas our Manchester cleaners should focus on and what furniture, areas, decor, or additional services you would like to have included.{" "}
                          <Link to="/contact" className="text-teal-700 font-semibold hover:underline">Contact us today</Link> for a perfectly free quote!
                        </p>
                      </section>

                      <Divider />
                      <section className="space-y-5">
                        <SectionLabel>Intensive grime restoration</SectionLabel>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                          What We Tackle: Intensive Grime Restoration &amp; Sanitization
                        </h2>
                        <p className="text-slate-600 leading-relaxed">
                          Standard domestic cleaning often skims the surface. Our deep cleaning protocol is engineered to penetrate the layers of built-up dirt and mineral deposits that accumulate in every home over time.
                        </p>
                        <p className="text-slate-700 font-semibold">
                          We focus on the &quot;stubborn&quot; areas that haven&apos;t been professionally addressed in months:
                        </p>
                        <ul className="grid sm:grid-cols-2 gap-4">
                          {DEEP_TACKLE.map((t) => (
                            <li key={t.title} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="font-bold text-slate-900 text-sm mb-1">{t.title}</p>
                              <p className="text-slate-600 text-sm leading-relaxed">{t.body}</p>
                            </li>
                          ))}
                        </ul>
                        <p className="text-slate-600 leading-relaxed">
                          A true deep clean is more than just an aesthetic upgrade; it is a vital reset for your home’s hygiene and longevity. Over time, environmental pollutants and biological contaminants like pet dander and skin cells settle into the fabric of your property, often in areas a standard weekly clean simply cannot reach. At Cleaniq Services, we utilize industrial-strength, eco-friendly chelating agents that bond with and lift stubborn mineral deposits without abrasive scrubbing that could damage your fixtures.
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          Beyond the visible shine, our intensive process significantly improves indoor air quality by extracting allergens that have become embedded in soft furnishings and hidden behind heavy appliances. According to the EPA, indoor air can be two to five times more polluted than outdoor air; our use of HEPA-filtration and steam-sanitization targets these unseen triggers at their source. By investing in a specialist deep clean, you aren&apos;t just getting a &apos;tidy&apos; house—you are disinfecting your living space, reducing the bacterial load in high-moisture &apos;wet zones,&apos; and preserving the integrity of your home&apos;s surfaces for years to come.
                        </p>
                      </section>

                      <Divider />
                      <section className="space-y-5">
                        <SectionLabel>Add-on services</SectionLabel>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                          Combine our Deep Cleaning in Manchester with any one of our additional services for a personalized discount
                        </h2>
                        <p className="text-slate-600 leading-relaxed">
                          You can combine our Deep Cleaning in Manchester with any one of our additional cleaning services, by doing so we will be able to offer you a personalized discount on the final combined price of your requested cleaning services. You can choose to add Carpet Cleaning, Upholstery Cleaning, External Window Cleaning, or even Pressure Washing for any external areas of your home, to your Deep Cleaning Services in Manchester. As part of our deep cleaning services all carpeted areas of your home will be vacuumed, however, you can add professional carpet cleaning to your service, as well as all windows in your home will be cleaned internally, however, we are able to provide external window cleaning as a separate add-on to your deep cleaning in Manchester.
                        </p>
                        <p className="text-slate-700 font-semibold">You can combine our Deep Cleaning Service with the following services:</p>
                        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { name: "Carpet Cleaning", link: "/service/carpet-cleaning-manchester" },
                            { name: "Upholstery Cleaning" },
                            { name: "Window Cleaning" },
                            { name: "Antiviral Disinfection" },
                          ].map((extra) => (
                            <li key={extra.name} className="flex flex-col items-center text-center gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                                <Sparkles size={18} />
                              </div>
                              {extra.link ? (
                                <Link to={extra.link} className="text-slate-800 text-sm font-semibold hover:text-teal-700 hover:underline">{extra.name}</Link>
                              ) : (
                                <span className="text-slate-800 text-sm font-semibold">{extra.name}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                        <p className="text-slate-600 leading-relaxed">
                          If you would like to schedule our Manchester Deep Cleaning Services you can contact us on{" "}
                          <a href="tel:+447846726428" className="text-teal-700 font-semibold hover:underline">07846 726428</a>, Monday to Sunday at a time convenient for you. Our customer service representatives will assist you with any questions related to our Deep Cleaning you may have. Alternatively, you can fill out our corresponding{" "}
                          <Link to="/get-a-quote" className="text-teal-700 font-semibold hover:underline">Deep Cleaning request form</Link> linked below.
                        </p>
                      </section>
                    </>
                  )}

                  <Divider />

                  {/* Areas */}
                  <section>
                    <SectionLabel>Coverage</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                      {areaNoun} Near You
                    </h2>
                    {isDeep || isEOT ? (
                      <>
                        <h3 className="text-base font-semibold text-slate-800 mb-1">Areas We Cover</h3>
                        <p className="text-sm text-slate-500 mb-4">
                          {isEOT
                            ? "You can schedule our End of Tenancy Cleaning Services on all postcodes in: Bolton, Bury, Oldham, Rochdale, Stockport, Tameside, Trafford, Wigan, Salford and Manchester"
                            : "You can schedule our Deep Cleaning Services on all postcodes in: Bolton, Bury, Oldham, Rochdale, Stockport, Tameside, Trafford, Wigan, and the cities of Salford and Manchester"}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500 mb-4">
                        Our {areaNoun.toLowerCase()} work across Manchester and Greater Manchester, including:
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {AREAS.map((area) => (
                        <Link
                          key={area.slug}
                          to={`/locations/${area.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full hover:border-teal-400 hover:text-teal-700 transition-colors"
                        >
                          <MapPin size={10} className="text-teal-500" /> {areaNoun} in {area.name}
                        </Link>
                      ))}
                    </div>
                  </section>

                  {/* End of tenancy only: convenience + personalised discount (owner-supplied text; another
                      company's name and phone number replaced with ours) */}
                  {isEOT && (
                    <>
                      <Divider />
                      <section className="space-y-5">
                        <SectionLabel>Delivered With Convenience</SectionLabel>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                          End of Tenancy Cleaning - Delivered With Your Convenience in Mind
                        </h2>
                        <p className="text-sm font-bold uppercase tracking-wide text-teal-700">
                          Ensure a stress and hassle-free move out process by scheduling our end of tenancy cleaning services
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          Cleaniq Services provides bespoke end of tenancy cleaning services based on your personal specifications and cleaning requirements to every client of every background on all postcodes in Greater Manchester. Our end of tenancy cleaning service in Manchester will be delivered on time, on budget, and up to your specific cleaning requirements. Simply provide a few basic details about your property, your requested date and time for your end of tenancy cleaning, receive a free quote, choose to accept it and enjoy the many benefits that come with scheduling our end of tenancy cleaning in Manchester. You can schedule our end of tenancy cleaning services 7 days a week at a time suitable for you, even on Bank Holidays or weekends.
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {[["Easy", "Scheduling."], ["Free", "Bespoke quotes."], ["Fast", "Short-notice availability"]].map(([big, small]) => (
                            <div key={big} className="rounded-xl bg-teal-50 border border-teal-100 p-4 text-center">
                              <p className="text-2xl font-bold text-teal-700">{big}</p>
                              <p className="text-xs sm:text-sm text-slate-600 font-medium">{small}</p>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-2xl bg-[#0A1520] text-white p-6 sm:p-8">
                          <p className="text-xs font-bold tracking-widest uppercase text-teal-400 mb-1">Save your time save your effort choose Cleaniq Services!</p>
                          <h3 className="text-lg sm:text-xl font-bold mb-4 uppercase">Choose Cleaniq Services for your end of tenancy cleaning in Manchester</h3>
                          <ul className="space-y-2.5 mb-6">
                            {[
                              "Available 7 days a week at a time convenient to you, even on Bank Holidays and weekends.",
                              "Book entirely online or within a 5 minute phone call.",
                              "Remote payment options are available.",
                              "Keys can be collected and returned upon request.",
                              "A final inspection is always conducted.",
                            ].map((pt) => (
                              <li key={pt} className="flex gap-2.5 items-start text-sm text-slate-200">
                                <Check size={15} className="text-teal-400 shrink-0 mt-0.5 stroke-[3]" /> {pt}
                              </li>
                            ))}
                          </ul>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Link to="/get-a-quote" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#00B5A4] text-white font-bold text-sm hover:bg-teal-600 transition-colors">
                              Get a Free Quote <ArrowRight size={16} />
                            </Link>
                            <a href="tel:+447846726428" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border-2 border-white/60 text-white font-bold text-sm hover:bg-white/10 transition-colors">
                              <Phone size={16} /> Call Now
                            </a>
                          </div>
                        </div>
                      </section>

                      <Divider />
                      <section className="space-y-5">
                        <SectionLabel>Personalized Discount</SectionLabel>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                          Combine our End of Tenancy Cleaning in Manchester with any one of our additional services for a personalized discount
                        </h2>
                        <p className="text-slate-600 leading-relaxed">
                          You can combine our End of Tenancy Cleaning in Manchester with any one of our additional cleaning services, by doing so we will be able to offer you a personalized discount on the final combined price of your requested cleaning services. You can choose to add Carpet Cleaning, Upholstery Cleaning, External Window Cleaning, or even Pressure Washing for any external areas of your home, to your End of Tenancy Cleaning Services in Manchester. As part of our End of Tenancy Cleaning services all carpeted areas of your home will be vacuumed, however, you can add professional carpet cleaning to your service, as well as all windows in your home will be cleaned internally, however, we are able to provide external window cleaning as a separate add-on to your End of Tenancy Cleaning in Manchester.
                        </p>
                        <p className="text-slate-700 font-semibold">You can combine our End of Tenancy Cleaning Service with the following services:</p>
                        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { name: "Carpet Cleaning", link: "/service/carpet-cleaning-manchester" },
                            { name: "Upholstery Cleaning" },
                            { name: "Window Cleaning" },
                            { name: "Antiviral Disinfection" },
                          ].map((extra) => (
                            <li key={extra.name} className="flex flex-col items-center text-center gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                                <Sparkles size={18} />
                              </div>
                              {extra.link ? (
                                <Link to={extra.link} className="text-slate-800 text-sm font-semibold hover:text-teal-700 hover:underline">{extra.name}</Link>
                              ) : (
                                <span className="text-slate-800 text-sm font-semibold">{extra.name}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                        <p className="text-slate-600 leading-relaxed">
                          If you would like to schedule our Manchester End of Tenancy Cleaning Services you can contact us on{" "}
                          <a href="tel:+447846726428" className="text-teal-700 font-semibold hover:underline">07846 726428</a>, Monday to Sunday at a time convenient for you. Our customer service representatives will assist you with any questions related to our End of Tenancy Cleaning you may have. Alternatively, you can fill out our corresponding{" "}
                          <Link to="/get-a-quote" className="text-teal-700 font-semibold hover:underline">End of Tenancy Cleaning request form</Link> linked below. Upholstery cleaning and Carpet Cleaning can also be added to our end of tenancy cleaning Manchester service for tenants, landlords and letting agents preparing furnished properties for check-out.
                        </p>
                      </section>
                    </>
                  )}

                  {/* End of tenancy only: guarantee + free quote (owner-supplied text; re-clean set to our
                      48 hours, the empty "including:" list left out) */}
                  {isEOT && (
                    <>
                      <Divider />
                      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                        <SectionLabel>Get Your Deposit Back in Full</SectionLabel>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-5">
                          Guaranteed end of tenancy cleaning in Manchester
                        </h2>
                        <ul className="grid sm:grid-cols-2 gap-3">
                          {[
                            { icon: <Clock size={16} />, text: "Free re-clean within 48 hours if needed." },
                            { icon: <Sparkles size={16} />, text: "Includes all cleaning materials and equipment." },
                            { icon: <ShieldCheck size={16} />, text: "You can extend your guarantee if needed." },
                            { icon: <BadgeCheck size={16} />, text: "Professional, qualified, experienced cleaning teams." },
                            { icon: <ShieldCheck size={16} />, text: "We are fully insured." },
                            { icon: <Check size={16} />, text: "Add any additional services" },
                          ].map((pt) => (
                            <li key={pt.text} className="flex gap-3 items-center p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                              <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">{pt.icon}</span>
                              <span className="text-slate-700 text-sm font-medium leading-snug">{pt.text}</span>
                            </li>
                          ))}
                        </ul>
                      </section>

                      <Divider />
                      <section className="rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white p-7 sm:p-9">
                        <p className="text-xs font-bold tracking-widest uppercase text-teal-100 mb-2">Contact Us For a Free Quote</p>
                        <h2 className="text-xl sm:text-2xl font-bold mb-3">Contact us for a free quote today!</h2>
                        <p className="text-teal-50 leading-relaxed mb-6">
                          We provide our customers with bespoke end of tenancy cleaning services personalized based on your specific cleaning requirements. Contact us for a free quote today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Link to="/get-a-quote" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white text-teal-800 font-bold text-sm hover:bg-teal-50 transition-colors">
                            Get a Free Quote <ArrowRight size={16} />
                          </Link>
                          <a href="tel:+447846726428" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border-2 border-white/70 text-white font-bold text-sm hover:bg-white/10 transition-colors">
                            <Phone size={16} /> Call Now
                          </a>
                        </div>
                      </section>

                      {/* One exceptional service (owner-supplied text; another company's name replaced) */}
                      <Divider />
                      <section className="space-y-5">
                        <SectionLabel>One Exceptional Service</SectionLabel>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                          End of Tenancy Cleaning in Manchester - one exceptional service for all Clients
                        </h2>
                        <h3 className="text-lg font-semibold text-teal-700">Our End of Tenancy Cleaning in Manchester</h3>
                        <p className="text-slate-600 leading-relaxed">
                          Our Manchester End of Tenancy Cleaning will transform your property. Cleaniq Services will provide you with a complete internal clean as part of the End of Tenancy Cleaning, the only exceptions to the End of Tenancy Cleaning are the painted walls and ceilings as those areas are easily prone to damage. Apart from them everything else in your house or flat will be cleaned. The tenancy cleaners will begin their task by delegating into specific areas of your property. Some of our cleaning experts will cover the bedrooms, living rooms, and common spaces, while specifically trained cleaners will focus on the bathrooms and kitchen.
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          All of the cupboards, cabinets, drawers, shelves will be cleaned as part of our End of Tenancy Cleaning in Manchester. All of the kitchen appliances will be cleaned, including the oven. Effectively free Oven Cleaning is part of our Manchester End of Tenancy Cleaning Service. The cleaners will cover all windows, frames, ledges, and sills internally as part of the cleaning service and will even focus on small details such as light sockets, light switches, and plugs.
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          The entirety of your property will be fully and professionally cleaned, this is why we are certain that you will receive an exceptional End of Tenancy Cleaning if you schedule our cleaning services. Our End of Tenancy Cleaning comes with a specific estate agency regulated checklist, in this way we make sure that you successfully get your deposit back, as we follow specific requirements for cleaning services when a final inspection of your property will be conducted.
                        </p>
                      </section>
                    </>
                  )}

                  {/* Deep cleaning only: our deep cleaners (owner-supplied text, word for word) */}
                  {serviceSlug === "deep-cleaning-manchester" && (
                    <>
                      <Divider />
                      <section className="space-y-5">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                          Deep Cleaning Services Provided by Expert Cleaners in Manchester
                        </h2>
                        <SectionLabel>You can rely on us for your deep cleaning needs.</SectionLabel>
                        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
                          Trust us with your deep cleaning needs
                        </h3>
                        <p className="text-slate-600 leading-relaxed">
                          Our experienced cleaning technicians will follow a specific Deep Cleaning Checklist, thus making sure that every inch and corner, even the hardest-to-reach places that you may not pay attention to during your usual cleaning schedule, is fully and thoroughly cleaned. Our Deep Cleaning checklist is designed to ensure exceptional cleaning results. However, that checklist can also be amended to fit your specific cleaning requirements.
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          If you want to have only parts of your property cleaned you can inform us in advance and we will make sure that our Manchester cleaning teams cover only the areas you have specified. If you want to add additional services to your Deep Cleaning Services you have the opportunity to do so. Feel free to model our Deep Cleaning in any way that you believe will produce the best cleaning outcome for your home! If you have any special requirements for your next Deep Cleaning Service let our office staff know and those requirements will be included as priorities.
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          Our deep cleaning services are provided by local, professionally trained, fully vetted experienced, and employed cleaners. Our cleaning service providers in Manchester are our biggest asset and we are fully confident in their ability to provide you with the best possible deep cleaning service every time you schedule our one-off deep cleaning in Manchester. Our cleaning staff are available 7 days a week in one of our flexible time slots.
                        </p>
                        <p className="text-slate-600 leading-relaxed">
                          All of our cleaning technicians travel fully equipped with the latest cleaning equipment and professional-grade certified safe, cleaning detergents. Our cleaning technicians will work hard to make sure that every inch of your property is cleaned up to the highest professional standards and that your deep house cleaning service is provided exactly up to your personal requirements and that all of your cleaning needs are met.
                        </p>
                      </section>

                      <Divider />
                      <section className="space-y-5">
                        <SectionLabel>Exceptional deep cleaning services</SectionLabel>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                          Deep cleaning services provided by expert cleaners in Manchester
                        </h2>
                        <p className="text-slate-600 leading-relaxed">
                          Your deep cleaning services will be provided by expertly trained, professional cleaners, employed by our cleaning company in Manchester, who have years of experience in providing deep cleaning services to all clients of every background in the greater Manchester area. Our local Manchester cleaners are professionally trained and in addition, follow a specific deep cleaning checklist. This is why we are certain that we offer the absolute best deep cleaning service throughout the entire Greater Manchester service area.
                        </p>
                        <ul className="grid sm:grid-cols-2 gap-3">
                          {[
                            "Professionally trained, fully vetted, insured, and experienced cleaners.",
                            "Will arrive fully equipped with the latest cleaning technology and professionally certified cleaning detergents.",
                            "Available 7 days a week.",
                            "Certified and experienced in the lasted cleaning methods.",
                            "Following a professionally designed checklist and applying the latest cleaning methods.",
                          ].map((point) => (
                            <li key={point} className="flex gap-3 items-start p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                              <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                              <Check size={11} className="stroke-[3]" />
                            </div>
                              <span className="text-slate-700 text-sm font-medium leading-snug">{point}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <Link
                            to={bookingLink}
                            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#00B5A4] text-white font-bold text-sm hover:bg-teal-600 transition-colors"
                          >
                            <Calendar size={16} /> Book now
                          </Link>
                          <a
                            href="tel:+447846726428"
                            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg border-2 border-[#00B5A4] text-teal-700 font-bold text-sm hover:bg-teal-50 transition-colors"
                          >
                            <Phone size={16} /> Call now
                          </a>
                        </div>
                      </section>
                    </>
                  )}

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

                  {/* Before & after photos for this service, when we have some */}
                  {beforeAfterFor(serviceSlug).length > 0 && (
                    <>
                      <BeforeAfter slug={serviceSlug} title={`${service.heading}: before & after`} limit={4} />
                      <Divider />
                    </>
                  )}

                  {/* Gallery of real photos from our jobs for this service, when we have some */}
                  {ourWorkFor(serviceSlug).length > 0 && (
                    <>
                      <OurWork slug={serviceSlug} />
                      <Divider />
                    </>
                  )}

                  {/* End of tenancy only: insured cleaners, under the photos (owner-supplied text) */}
                  {isEOT && (
                    <>
                      <section>
                        <SectionLabel>Trained, Vetted, Instructed and Insured</SectionLabel>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                          Fully insured End of Tenancy Cleaners in Manchester
                        </h2>
                        <p className="text-slate-600 leading-relaxed mb-6">
                          We will always send out a team of fully insured cleaners for your end of tenancy cleaning service in Manchester. All of our Manchester cleaners have years of experience in providing end of tenancy cleaning services in Manchester, they have worked on thousands of properties and have successfully won back deposits for many of our clients in the past.
                        </p>
                        <ul className="grid sm:grid-cols-2 gap-3">
                          {[
                            "Verified, trained, instructed, and insured end of tenancy cleaning specialists.",
                            "Public liability insurance up to 1 million.",
                            "Professional cleaning approach, using specific cleaning techniques and detergents based on specific surfaces.",
                            "Equipped with professional cleaning detergents and supplies.",
                            "Trusted by thousands of clients in Manchester for their end of tenancy cleaning services.",
                            "Dedicated to providing exceptional cleaning services.",
                          ].map((pt) => (
                            <li key={pt} className="flex gap-3 items-start p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                              <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                              <Check size={11} className="stroke-[3]" />
                            </div>
                              <span className="text-slate-700 text-sm font-medium leading-snug">{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                      <Divider />
                    </>
                  )}

                  {/* Testimonials */}
                  <section>
                    <SectionLabel>Customer reviews</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                      What Our Customers Say
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">
                      {g.rating}★ on Google ·{" "}
                      <a href={g.url} target="_blank" rel="noopener noreferrer" className="text-teal-700 font-semibold hover:underline">
                        Read all reviews on Google
                      </a>
                    </p>
                    <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
                      {g.reviews.slice(0, 3).map((t, i) => (
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
                              Google review
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <Divider />

                  {/* Related services */}
                  <section>
                    <SectionLabel>More from Cleaniq Services</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
                      Related cleaning services
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {relatedServices.map((p) => (
                        <Link
                          key={p.slug}
                          to={servicePagePath(p.slug)}
                          className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-teal-400 hover:shadow-md transition-all"
                        >
                          <div className="aspect-[3/2] overflow-hidden bg-slate-100">
                            <img
                              src={p.image(600)}
                              srcSet={`${p.image(400)} 400w, ${p.image(600)} 600w, ${p.image(900)} 900w`}
                              sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
                              alt={p.imageAlt}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="p-4">
                            <p className="font-bold text-slate-900 text-sm flex items-center justify-between gap-2">
                              {p.name}
                              <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-600 transition-colors shrink-0" />
                            </p>
                            <p className="text-slate-500 text-xs mt-1 leading-relaxed">{p.blurb}</p>
                            {fromPriceForPage(p.slug, liveServices) && (
                              <p className="text-teal-700 text-sm font-bold mt-2">{fromPriceForPage(p.slug, liveServices)}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>

                  <Divider />

                  {/* FAQs */}
                  {isDeep && (
                    <>
                      <section className="rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white p-7 sm:p-9">
                        <p className="text-xs font-bold tracking-widest uppercase text-teal-100 mb-2">Contact Us For a Free Quote</p>
                        <h2 className="text-xl sm:text-2xl font-bold mb-3">Contact us for a free quote today!</h2>
                        <p className="text-teal-50 leading-relaxed mb-6">
                          We provide our customers with bespoke deep cleaning services personalized based on your specific cleaning requirements. Contact us for a free quote today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Link to="/get-a-quote" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white text-teal-800 font-bold text-sm hover:bg-teal-50 transition-colors">
                            Get a free quote <ArrowRight size={16} />
                          </Link>
                          <a href="tel:+447846726428" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border-2 border-white/70 text-white font-bold text-sm hover:bg-white/10 transition-colors">
                            <Phone size={16} /> 07846 726428
                          </a>
                        </div>
                      </section>
                      <Divider />
                    </>
                  )}

                  <section>
                    <SectionLabel>Frequently asked questions</SectionLabel>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                      {isDeep ? "Frequently Asked Questions: Deep Cleaning Manchester" : isEOT ? "Frequently Asked Questions: End of Tenancy Cleaning Manchester" : `${service.heading} — FAQs`}
                    </h2>
                    <div className="mt-4">
                      {pageFaqs.map((faq, i) => (
                        <FAQItem key={i} q={isDeep || isEOT ? `${i + 1}. ${faq.q}` : faq.q} a={faq.a} />
                      ))}
                    </div>
                    {isEOT && (
                      <div className="mt-8 p-6 rounded-2xl bg-teal-50 border border-teal-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <p className="font-bold text-slate-900">Book your end of tenancy clean</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Link to="/get-a-quote" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white border border-teal-200 text-teal-800 font-bold text-sm hover:bg-teal-50 transition-colors">
                            Get a Free Quote <ArrowRight size={16} />
                          </Link>
                          <a href="tel:+447846726428" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#00B5A4] text-white font-bold text-sm hover:bg-teal-600 transition-colors">
                            <Phone size={16} /> Call 07846 726428
                          </a>
                        </div>
                      </div>
                    )}
                    {isDeep && (
                      <div className="mt-8 p-6 rounded-2xl bg-teal-50 border border-teal-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-900">Need help booking your deep clean?</p>
                          <p className="text-slate-600 text-sm">Call Cleaniq Services today for a fast quote.</p>
                        </div>
                        <a href="tel:+447846726428" className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#00B5A4] text-white font-bold text-sm hover:bg-teal-600 transition-colors">
                          <Phone size={16} /> Call 07846 726428
                        </a>
                      </div>
                    )}
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
                    {servicePrice && (
                      <p className="text-2xl font-bold text-white mb-1">
                        {servicePrice}
                      </p>
                    )}
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
                          text: `${g.rating}★ rated on Google`,
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
                        to={bookingLink}
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg bg-[#00B5A4] text-white font-bold text-sm hover:bg-teal-600 transition-colors"
                      >
                        Book in 60 Seconds <ArrowRight size={15} />
                      </Link>
                      <a

                        href={quoteLink}

                        target="_blank"

                        rel="noopener noreferrer"

                        className="flex items-center justify-center gap-2 w-full py-3 mt-2.5 rounded-lg border border-[#00B5A4] text-[#00B5A4] font-bold text-sm hover:bg-teal-50 transition-colors"

                      >

                        Get a quote on WhatsApp

                      </a>
                      {isEOT && (
                        <>
                          <a
                            href="tel:+447846726428"
                            className="flex items-center justify-center gap-2 w-full py-3 mt-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm hover:border-teal-400 hover:text-teal-700 transition-colors"
                          >
                            <Phone size={14} /> +44 7846 726428
                          </a>
                        </>
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
                            {AREAS.map((area) => (
                              <Link
                                key={area.slug}
                                to={`/locations/${area.slug}`}
                                className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded hover:text-teal-700"
                              >
                                {area.name}
                              </Link>
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
