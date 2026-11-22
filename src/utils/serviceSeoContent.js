// Extra SEO content for service pages (src/pages/ServiceDetail.jsx), shown by
// src/component/ServiceSeoSections.jsx in the same layout as the Airbnb page.
// Written only from facts already on the site: vetted cleaners (interview, background checks,
// skills assessment), the 48-hour re-clean guarantee, live prices from the booking system,
// eco-friendly supplies for £10 per visit, our office at 20 Swan St, and each page's own checklist.
// No prices, percentages or claims that aren't already published.
//
// Links in text: [label](/path) or [label](tel:+447846726428).

const PHONE = "[07846 726428](tel:+447846726428)";
const AREAS_TEXT =
  "Manchester City Centre, Ancoats and the Northern Quarter, Salford, Didsbury, Chorlton, Stockport, Trafford, Bolton, Bury, Oldham, Rochdale, Tameside and Wigan";

export const SERVICE_SEO = {
  // ─────────────────────────────────────────────────────────────────────────────
  "regular-house-cleaning-manchester": {
    faqTitle: "Regular House Cleaning Manchester",
    banner: {
      h2: "Regular House Cleaning in Manchester",
      ticks: ["Weekly, fortnightly or monthly visits", "Vetted local house cleaners", "48-hour re-clean guarantee"],
      serviceFor: ["Homeowners", "Tenants", "Busy Families", "Landlords"],
    },
    intro: {
      label: "Manchester House Cleaners",
      h2: "Regular house cleaners in Manchester you can rely on",
      paras: [
        "Cleaniq Services provides regular house cleaning in Manchester and across Greater Manchester. Our local house cleaners visit every week, every fortnight or once a month, and follow the same checklist on every visit, so your home stays clean without you having to think about it.",
        "A regular cleaner is one of the simplest ways to get your evenings and weekends back. Instead of catching up on housework, you come home to clean floors, fresh bathrooms and a tidy kitchen. You choose the day, the arrival time and how many hours each visit lasts when you book, and your future visits are scheduled for you.",
        `Book your regular house cleaning online in a few minutes or call us on ${PHONE}. Need a bigger refresh first? Start with a [deep clean](/service/deep-cleaning-manchester), keep it that way with regular visits, and add [oven cleaning](/service/oven-cleaning-manchester) or [carpet cleaning](/service/carpet-cleaning-manchester) whenever you need it.`,
      ],
    },
    how: {
      h2: "How does regular house cleaning in Manchester work?",
      intro:
        "Setting up regular house cleaning with Cleaniq Services takes a few minutes. You tell us how often you'd like a cleaner, which day suits you and how long each visit should last, and we take care of the rest. Every visit follows our regular house cleaning checklist, so the standard stays the same week after week, and you can add extras such as oven cleaning when your home needs a little more. If you ever need to change a visit, just let us know. Here is how it works, step by step:",
      steps: [
        { title: "Book", body: "Book online or call us. Choose weekly, fortnightly or monthly visits, the day and arrival time that suit you, and how many hours each visit lasts." },
        { title: "Your cleaner arrives", body: "A vetted Cleaniq Services house cleaner arrives at the agreed time. If you won't be home, tell us how to get in, for example a key or entry code." },
        { title: "The clean", body: "Your cleaner works through our regular house cleaning checklist: kitchen, bathrooms, bedrooms, living areas, stairs and hallways." },
        { title: "Repeat", body: "Your next visits are already scheduled, so your home stays clean week after week. Tell us within 48 hours if anything wasn't right and we'll put it right for free." },
      ],
    },
    benefits: {
      h2: "Benefits of regular house cleaning in Manchester",
      intro:
        "A regular cleaner does more than keep your home tidy. Cleaning little and often stops dust, grease and limescale from building up, which keeps your home healthier for you, your family and your pets, and makes every visit go further. It also takes away one of the biggest sources of weekly stress: housework that never seems to end. Here are the main benefits our regular house cleaning customers in Manchester tell us about:",
      items: [
        { title: "More free time", body: "No more spending evenings and weekends catching up on cleaning. Your house cleaner looks after it while you get on with your life." },
        { title: "A consistently clean home", body: "Every visit follows the same checklist, so nothing gets missed and your home is ready for visitors any day of the week." },
        { title: "A regular cleaner", body: "Regular cleans have a regular cleaner, who gets to know your home and how you like things done." },
        { title: "Less build-up", body: "Cleaning little and often keeps dust, grease and limescale under control, so they never turn into a big job." },
        { title: "A schedule that suits you", body: "Weekly, fortnightly or monthly, on the day and at the arrival time you choose." },
        { title: "48-hour re-clean guarantee", body: "If something isn't right, tell us within 48 hours and we'll send a cleaner back to put it right, free of charge." },
      ],
    },
    types: {
      label: "Every Type of Home",
      h2: "Regular house cleaning for every kind of home in Manchester",
      body:
        "Our house cleaners look after all kinds of homes across Manchester, from city-centre flats to family houses in the suburbs. Every home is different, so tell us about yours when you book: the number of bedrooms and bathrooms, any pets, and anything you'd like your cleaner to focus on. You can use your own cleaning products, or we'll bring eco-friendly products and equipment for £10 per visit.",
      chips: ["Flats & apartments", "Family houses", "Shared houses", "Rented homes", "Homes with pets", "New-build homes"],
    },
    compare: {
      label: "Regular or Deep Clean?",
      h2: "Regular house cleaning or a deep clean: what's the difference?",
      intro: "Most homes need both at some point. A deep clean gets your home to a high standard, and regular house cleaning keeps it there.",
      cards: [
        { title: "Regular house cleaning", body: "Visits every week, fortnight or month. Your cleaner keeps on top of the everyday jobs: kitchen surfaces and the outside of appliances, bathrooms, dusting, vacuuming, mopping and bins, following our regular house cleaning checklist." },
        { title: "Deep clean", body: "A one-off, top-to-bottom clean for when your home needs more, or before you start regular cleaning. It reaches the areas a regular visit doesn't cover, such as inside appliances and cupboards, behind furniture and built-up limescale. Read more about our [deep cleaning in Manchester](/service/deep-cleaning-manchester)." },
      ],
    },
    experts: {
      label: "House Cleaners Manchester",
      h2: "Vetted house cleaners in Manchester you can trust",
      paras: [
        "Letting someone into your home takes trust. Every Cleaniq Services cleaner has a face-to-face interview, background checks and a practical skills assessment before they clean a customer's home. They know what a regular clean should cover and take pride in leaving your home looking and feeling fresh.",
        "Your house cleaner works carefully around your belongings, follows any notes you leave, and lets us know if they spot anything that needs your attention. If anything isn't right after a visit, tell us within 48 hours and we'll send a cleaner back to put it right, free of charge.",
      ],
      points: ["Interviewed face to face and background checked.", "Practical skills assessment before their first clean.", "Local to Manchester and Greater Manchester.", "Backed by our 48-hour re-clean guarantee."],
    },
    combine: {
      h2: "Add extras to your regular house cleaning",
      intro:
        "Regular visits keep on top of the everyday jobs. Every so often, your home will need a little more, and you can add one of our other cleaning services in Manchester whenever you need it. Many customers book a deep clean before their first regular visit, add an oven clean every few months, or have their carpets cleaned once or twice a year to keep their home fresh. Choose from:",
      links: [
        { to: "/service/deep-cleaning-manchester", name: "Deep Cleaning", body: "A top-to-bottom clean of the areas a regular visit doesn't reach." },
        { to: "/service/oven-cleaning-manchester", name: "Oven Cleaning", body: "Racks, trays, door glass and the oven interior cleaned properly." },
        { to: "/service/carpet-cleaning-manchester", name: "Carpet Cleaning", body: "Fresher carpets, stairs and upholstery." },
        { to: "/service/end-of-tenancy-cleaning-manchester", name: "End of Tenancy Cleaning", body: "Moving out? Hand the property back clean." },
      ],
    },
    local: {
      label: "House Cleaning Across Manchester",
      h2: "House cleaners across Manchester and Greater Manchester",
      paras: [
        `Our house cleaners cover homes across Manchester and Greater Manchester, including ${AREAS_TEXT}. Our office is at 20 Swan St in Ancoats, so we're never far from your home.`,
        "Whether you live in a city-centre apartment or a family home in the suburbs, you can book regular house cleaning on the day and at the time that suits you. Choose your area from the list on this page to see more about house cleaning near you.",
      ],
    },
    tips: {
      label: "Tips",
      h2: "Tips for getting the most from your regular cleaner",
      intro: "A few simple habits help your house cleaner get more done in the time you've booked, and keep your home looking its best between visits:",
      tips: [
        "Tidy away clutter, toys and clothes before your cleaner arrives, so they can spend their time cleaning rather than tidying.",
        "Leave a short note about anything you'd like your cleaner to focus on this visit.",
        "Tell us how your cleaner can get in if you won't be home, for example a key or entry code.",
        "Leave fresh bed linen out if you'd like your beds changed.",
        "Choose enough hours for the size of your home, especially for the first few visits.",
        "Add an oven clean or a deep clean every few months for the jobs a regular visit doesn't cover.",
        "Tell us within 48 hours if anything wasn't right, so we can put it right quickly.",
      ],
    },
    quote: {
      h2: "Get a quote for regular house cleaning",
      body:
        "Not sure how many hours you need, or how often? Contact Cleaniq Services and we'll help you choose. Tell us how many bedrooms and bathrooms your home has, whether you have pets and how often you'd like a cleaner, and we'll recommend the right regular house cleaning for your home. Call us on 07846 726428 or fill out our quick quote form and we'll get back to you. There's no obligation, and we cover homes right across Manchester and Greater Manchester.",
    },
    closing: {
      h2: "Book your regular house cleaning in Manchester",
      body: `Book your first visit online in a few minutes, or call Cleaniq Services on ${PHONE} and we'll help you set up a schedule that suits you.`,
    },
    faqs: [
      { q: "What does a regular house clean include?", a: "Every regular visit covers the kitchen, bathrooms, bedrooms, living areas, stairs and hallways: surfaces wiped, the outside of appliances cleaned, toilets and bathrooms cleaned, dusting, vacuuming, mopping and bins emptied. The full regular house cleaning checklist is on this page." },
      { q: "Will I have the same cleaner every time?", a: "Regular cleans have a regular cleaner, so you see the same person on each visit wherever possible." },
      { q: "When am I charged for regular cleans?", a: "Each visit is charged 24 hours before it takes place, using the card you saved when you booked your first visit." },
      { q: "Can I pause or cancel my regular cleaning?", a: "Yes. Contact us to pause or cancel your regular cleans. Please see our terms and conditions for notice periods and any fees." },
      { q: "How many hours do I need for each visit?", a: "It depends on the size of your home and how much needs doing. You choose the number of hours when you book. If you're not sure, call us on 07846 726428 and we'll help you decide." },
      { q: "Do you clean homes with pets?", a: "Yes. Just let us know about any pets when you book, so your cleaner knows what to expect." },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  "general-cleaning-manchester": {
    faqTitle: "General Cleaning Manchester",
    banner: {
      h2: "General Cleaning in Manchester",
      ticks: ["One-off or regular home cleaning", "Every room, top to bottom", "Vetted, local cleaners"],
      serviceFor: ["Homeowners", "Tenants", "Landlords", "Busy Professionals"],
    },
    intro: {
      label: "Manchester Home Cleaning",
      h2: "General cleaning in Manchester, whenever you need it",
      paras: [
        "Cleaniq Services provides general cleaning in Manchester and across Greater Manchester. Our general clean is a thorough, whole-home clean of your kitchen, bathrooms, bedrooms, living areas, stairs and hallways, carried out by vetted local cleaners who follow the same checklist on every visit.",
        "Book a general clean as a one-off when life gets busy, before guests arrive or after a hectic few weeks, or set it up weekly or fortnightly to keep your home in great condition. You choose the day, the arrival time and how many hours you need when you book, so you only pay for the cleaning your home actually needs.",
        `Book your general clean online in a few minutes or call us on ${PHONE}. If your home needs more than a general clean, our [deep cleaning](/service/deep-cleaning-manchester) goes further, and you can add [oven cleaning](/service/oven-cleaning-manchester) or [carpet cleaning](/service/carpet-cleaning-manchester) to any visit.`,
      ],
    },
    how: {
      h2: "How does our general cleaning in Manchester work?",
      intro:
        "Booking a general clean with Cleaniq Services is quick and simple. Whether it's a one-off or a regular visit, you choose how long you'd like your cleaner for and when they should arrive, and we send a vetted cleaner who knows exactly what a general clean should cover. Every visit follows our general cleaning checklist, so the important jobs are always done, and you can leave notes about anything you'd like your cleaner to focus on. Here is how it works:",
      steps: [
        { title: "Book", body: "Book online or call us. Choose a one-off clean or weekly or fortnightly visits, the day, the arrival time and how many hours you need." },
        { title: "Your cleaner arrives", body: "A vetted Cleaniq Services cleaner arrives at the agreed time. If you won't be home, tell us how to get in when you book." },
        { title: "The clean", body: "Your cleaner works through our general cleaning checklist, room by room: kitchen, bathrooms, bedrooms, living areas, stairs and hallways." },
        { title: "Enjoy your home", body: "Come home to a clean, fresh home. Tell us within 48 hours if anything wasn't right and we'll put it right for free." },
      ],
    },
    benefits: {
      h2: "Benefits of professional general cleaning in Manchester",
      intro:
        "Keeping a home clean takes time, and it's often the first thing to slip when work, family and everything else get busy. A professional general clean puts your home back on track in one visit, reaching the spots that get missed in a quick tidy-up and leaving every room fresh. Here are the main reasons Manchester customers book a general clean with Cleaniq Services:",
      items: [
        { title: "Your time back", body: "Hand over the cleaning and spend your evenings and weekends on the things you enjoy." },
        { title: "Every room covered", body: "Kitchen, bathrooms, bedrooms, living areas, stairs and hallways, all cleaned to the same checklist." },
        { title: "One-off or regular", body: "Book a single clean when you need it, or weekly or fortnightly visits to keep on top of things." },
        { title: "Pay for what you need", body: "Choose the number of hours when you book. Our hourly rate comes live from our booking system." },
        { title: "Supplies your way", body: "Use your own cleaning products, or we'll bring eco-friendly products and equipment for £10 per visit." },
        { title: "48-hour re-clean guarantee", body: "If something isn't right, tell us within 48 hours and we'll send a cleaner back to put it right, free of charge." },
      ],
    },
    types: {
      label: "When to Book",
      h2: "A general clean for every occasion in Manchester",
      body:
        "There's no wrong time for a general clean. Our Manchester customers book one before family or friends come to stay, after a party, when moving into a new home, before a property viewing, for a seasonal spring clean, or simply to catch up after a busy month. Tell us what the clean is for when you book, and leave a note about anything you'd like your cleaner to focus on.",
      chips: ["Before guests arrive", "After a party", "Spring cleaning", "Moving in", "Before a viewing", "Catching up after a busy month"],
    },
    compare: {
      label: "General or Deep Clean?",
      h2: "General clean or deep clean: what's the difference?",
      intro: "Both leave your home clean, but they're designed for different jobs. Here's how to choose:",
      cards: [
        { title: "General clean", body: "A thorough clean of every room's everyday areas: worktops and the outside of appliances, bathrooms, dusting, vacuuming, mopping and bins. Ideal as a one-off refresh or as a regular weekly or fortnightly clean." },
        { title: "Deep clean", body: "A top-to-bottom clean that goes further, reaching inside appliances and cupboards, behind furniture and built-up limescale and grime. Best for homes that haven't had a proper clean for a while. Read more about our [deep cleaning in Manchester](/service/deep-cleaning-manchester)." },
      ],
    },
    experts: {
      label: "Home Cleaners Manchester",
      h2: "Professional home cleaners in Manchester you can trust",
      paras: [
        "Every Cleaniq Services cleaner has a face-to-face interview, background checks and a practical skills assessment before they clean a customer's home. They know what a proper general clean should cover and work through every room methodically, so nothing is missed.",
        "Your cleaner works carefully around your belongings, follows the notes you leave and lets us know if they spot anything that needs your attention. If anything isn't right after your clean, tell us within 48 hours and we'll send a cleaner back to put it right, free of charge.",
      ],
      points: ["Interviewed face to face and background checked.", "Practical skills assessment before their first clean.", "Trained to follow our general cleaning checklist.", "Backed by our 48-hour re-clean guarantee."],
    },
    combine: {
      h2: "Combine your general clean with our other services",
      intro:
        "A general clean covers the everyday areas of your home. When some parts need extra attention, add one of our other cleaning services in Manchester to the same booking or book it separately. It's an easy way to tackle the bigger jobs, like a greasy oven or tired carpets, while your cleaner looks after the rest of your home. Choose from:",
      links: [
        { to: "/service/deep-cleaning-manchester", name: "Deep Cleaning", body: "For homes that need a more thorough, top-to-bottom clean." },
        { to: "/service/oven-cleaning-manchester", name: "Oven Cleaning", body: "Racks, trays, door glass and the oven interior cleaned properly." },
        { to: "/service/carpet-cleaning-manchester", name: "Carpet Cleaning", body: "Fresher carpets, stairs and upholstery." },
        { to: "/service/regular-house-cleaning-manchester", name: "Regular House Cleaning", body: "Keep your home clean with weekly, fortnightly or monthly visits." },
      ],
    },
    local: {
      label: "Cleaning Across Manchester",
      h2: "Home cleaners across Manchester and Greater Manchester",
      paras: [
        `Our general cleaning service covers homes across Manchester and Greater Manchester, including ${AREAS_TEXT}. Our office is at 20 Swan St in Ancoats, so we're never far from your home.`,
        "From city-centre apartments to family houses in the suburbs, you can book a general clean on the day and at the time that suits you. Choose your area from the list on this page to see more about home cleaning near you.",
      ],
    },
    tips: {
      label: "Tips",
      h2: "How to get the most from your general clean",
      intro: "A little preparation helps your cleaner make the most of the time you've booked, so more of your home gets cleaned:",
      tips: [
        "Clear away clutter, clothes and toys so your cleaner can reach surfaces and floors.",
        "Tell us which rooms matter most, so your cleaner can start there.",
        "Book enough hours for the size of your home, especially for a first clean.",
        "Let us know about pets and how your cleaner can get in if you won't be home.",
        "Leave out any cleaning products you'd like us to use, or choose our eco-friendly supplies when you book.",
        "Add oven or carpet cleaning if those areas need more than a general clean.",
        "Tell us within 48 hours if anything wasn't right, so we can put it right quickly.",
      ],
    },
    quote: {
      h2: "Get a quote for general cleaning",
      body:
        "Not sure how long your clean will take? Contact Cleaniq Services and we'll help. Tell us how many bedrooms and bathrooms your home has, when it was last cleaned and whether you'd like a one-off or regular clean, and we'll recommend the right number of hours for your home. Call us on 07846 726428 or fill out our quick quote form and we'll get back to you. There's no obligation, and we cover homes right across Manchester and Greater Manchester.",
    },
    closing: {
      h2: "Book your general clean in Manchester",
      body: `Book your general clean online in a few minutes, or call Cleaniq Services on ${PHONE} and we'll help you choose the right clean for your home.`,
    },
    faqs: [
      { q: "Can I book a one-off general clean?", a: "Yes. Book a single general clean whenever you need one, or set up weekly or fortnightly visits if you'd like regular cleaning." },
      { q: "How much does general cleaning cost in Manchester?", a: "General cleaning is charged by the hour. You choose how many hours you need when you book, and the current rate comes straight from our booking system." },
      { q: "How long does a general clean take?", a: "It depends on the size of your home and how much needs doing. You choose the number of hours when you book. If you're not sure, call us on 07846 726428 and we'll help you decide." },
      { q: "What's the difference between a general clean and a deep clean?", a: "A general clean covers the everyday areas of every room. A deep clean goes further, reaching inside appliances and cupboards, behind furniture and built-up limescale and grime." },
      { q: "Can I add oven or carpet cleaning to a general clean?", a: "Yes. Add oven cleaning or carpet cleaning when you book, or book them separately." },
      { q: "What if I'm not happy with my clean?", a: "Tell us within 48 hours and we'll send a cleaner back to put it right, free of charge." },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  "office-cleaning-manchester": {
    faqTitle: "Office Cleaning Manchester",
    banner: {
      h2: "Office Cleaning in Manchester",
      ticks: ["Cleaning before or after working hours", "Insured, vetted office cleaners", "A fixed checklist on every visit"],
      serviceFor: ["Offices", "Shops", "Restaurants", "Gyms", "Communal Areas"],
    },
    intro: {
      label: "Manchester Office Cleaners",
      h2: "Office cleaners in Manchester you can rely on",
      paras: [
        "Cleaniq Services provides office cleaning and commercial cleaning in Manchester and across Greater Manchester. Our office cleaners keep workspaces, receptions, kitchens and washrooms clean and hygienic, following a fixed checklist on every visit so your workplace looks the same high standard every day.",
        "A clean office matters. It's the first thing clients notice when they walk in, and it affects how your team feels about coming to work. We work early mornings, evenings and weekends, so your staff arrive to a clean office with no disruption to the working day.",
        `To get a quote, tell us about your premises on our [commercial cleaning enquiry form](/commercial-cleaning), including the size in square metres and how often you'd like cleaning, or call us on ${PHONE}. We also clean restaurants, gyms, communal areas and event spaces, and offer [post-construction cleaning](/service/post-construction-cleaning-manchester) after office fit-outs.`,
      ],
    },
    how: {
      h2: "How does our office cleaning in Manchester work?",
      intro:
        "Every workplace is different, so we start by understanding yours. Tell us about the size of your premises, the areas that need cleaning and how often, and we'll put together a cleaning plan and quote that fits your business and your budget. Once it's agreed, your office cleaners follow the same fixed checklist on every visit, and we carry out quality checks to make sure your expectations are met. Here is how it works:",
      steps: [
        { title: "Get a quote", body: "Tell us about your premises on our commercial cleaning form or by phone: the type of space, its size in square metres and how often you'd like cleaning." },
        { title: "Agree a schedule", body: "We agree the areas to clean and the days and times, including early mornings, evenings or weekends, so cleaning never gets in the way of work." },
        { title: "Cleaning to a checklist", body: "Your office cleaners work through a fixed checklist covering workspaces, kitchens, washrooms, reception and communal areas." },
        { title: "Quality checks", body: "We check the standard regularly and adjust the plan if your needs change, so your workplace stays consistently clean." },
      ],
    },
    benefits: {
      h2: "Benefits of professional office cleaning in Manchester",
      intro:
        "Professional office cleaning is about more than tidy desks. A consistently clean workplace makes a strong first impression on clients and visitors, gives your team a healthier and more pleasant place to work, and frees your staff from cleaning jobs that take them away from their real work. Here are the main benefits for Manchester businesses:",
      items: [
        { title: "A great first impression", body: "Clean receptions, meeting rooms and washrooms show clients and visitors that you care about the details." },
        { title: "A healthier workplace", body: "Regular cleaning of desks, phones, keyboards, door handles and washrooms keeps high-contact surfaces hygienic." },
        { title: "No disruption", body: "We clean before or after working hours, including evenings and weekends, so your team can work without interruption." },
        { title: "The same standard every visit", body: "A fixed checklist and regular quality checks mean nothing gets missed." },
        { title: "Insured and vetted", body: "Our commercial cleaners carry public liability insurance and are background checked." },
        { title: "Flexible plans", body: "Daily, several times a week or weekly cleaning, planned around your footfall and budget." },
      ],
    },
    types: {
      label: "Every Type of Workplace",
      h2: "Commercial cleaning for every type of workplace in Manchester",
      body:
        "As well as offices, Cleaniq Services cleans a wide range of commercial premises across Manchester. Whatever your business, we'll plan the cleaning around how your space is used, when it's busy and which areas matter most. For anything that isn't a standard office, tell us about it on our commercial cleaning form and we'll quote for it.",
      chips: ["Offices", "Co-working spaces", "Receptions & meeting rooms", "Restaurants", "Gyms", "Communal areas", "Event spaces"],
    },
    compare: {
      label: "Regular or One-Off?",
      h2: "Regular office cleaning or a one-off deep clean?",
      intro: "Most businesses benefit from both: regular cleaning to keep on top of daily use, and a deeper clean from time to time.",
      cards: [
        { title: "Regular office cleaning", body: "Scheduled visits, from daily to weekly, to keep workspaces, kitchens and washrooms clean and hygienic. Your cleaners follow a fixed checklist on every visit." },
        { title: "One-off deep clean", body: "A more thorough clean for when your office needs a reset, for example after a refurbishment, before an important visit or when moving into new premises. After building work, our [post-construction cleaning](/service/post-construction-cleaning-manchester) removes fine dust and debris." },
      ],
    },
    experts: {
      label: "Office Cleaners Manchester",
      h2: "Professional office cleaners in Manchester you can trust",
      paras: [
        "Our commercial cleaners are background checked and carry public liability insurance, so you can trust them with your premises, your equipment and your keys. They follow a fixed checklist on every visit and work quietly and efficiently, before or after your working hours.",
        "We know every business is different. Tell us about any areas that need special care, security procedures or rooms that are off limits, and we'll build them into your cleaning plan. If anything isn't right, tell us and we'll put it right.",
      ],
      points: ["Background checked commercial cleaners.", "Public liability insurance.", "A fixed checklist on every visit.", "Early morning, evening and weekend cleaning."],
    },
    combine: {
      h2: "Add other cleaning services for your workplace",
      intro:
        "Regular office cleaning keeps your workplace clean day to day. From time to time, some areas need specialist attention, and you can add one of our other cleaning services in Manchester. It's an easy way to keep carpets fresh, get the office kitchen properly clean, or clear up after building work without bringing in another company. Choose from:",
      links: [
        { to: "/service/carpet-cleaning-manchester", name: "Carpet Cleaning", body: "Fresher office carpets and upholstered chairs." },
        { to: "/service/oven-cleaning-manchester", name: "Oven Cleaning", body: "For office and staff kitchens with an oven." },
        { to: "/service/post-construction-cleaning-manchester", name: "Post-Construction Cleaning", body: "After fit-outs, refurbishments and building work." },
        { to: "/commercial-cleaning", name: "Commercial Cleaning", body: "Restaurants, gyms, communal areas, events and contract cleaning." },
      ],
    },
    local: {
      label: "Office Cleaning Across Manchester",
      h2: "Office cleaning across Manchester's business districts",
      paras: [
        "Our office cleaners cover businesses across Manchester and Greater Manchester, including Manchester City Centre, Spinningfields and Deansgate, the Northern Quarter and Ancoats, Salford Quays and MediaCityUK, Trafford, Stockport and the rest of Greater Manchester. Our office is at 20 Swan St in Ancoats, in the heart of the city.",
        "Whether you're a small team in a shared workspace or a larger office across several floors, we'll plan cleaning around your working hours and your building's access arrangements, so your workplace is ready when your team arrives.",
      ],
    },
    tips: {
      label: "Tips",
      h2: "Tips for keeping your Manchester office clean between visits",
      intro: "A few simple habits help your office cleaners do a better job and keep your workplace looking its best between visits:",
      tips: [
        "Encourage a clear-desk policy at the end of the day, so desks can be wiped properly.",
        "Label anything that shouldn't be moved or cleaned, such as equipment or paperwork.",
        "Tell us about access arrangements, keys and alarm codes in advance.",
        "Let us know when consumables like soap, paper towels and toilet rolls are supplied, so they can be restocked.",
        "Empty the office fridge regularly so it can be cleaned.",
        "Tell us about busy periods or events, so we can adjust the cleaning plan.",
        "Report any issues straight away, so we can put them right quickly.",
      ],
    },
    quote: {
      h2: "Get a free office cleaning quote",
      body:
        "Every workplace is different, so we quote for each one individually. Tell us the type of premises, its size in square metres, the areas that need cleaning and how often, and we'll send you a quote for office cleaning that fits your business. Use our commercial cleaning enquiry form or call us on 07846 726428. There's no obligation, and we cover businesses right across Manchester and Greater Manchester.",
    },
    closing: {
      h2: "Arrange office cleaning in Manchester",
      body: `Tell us about your workplace on our [commercial cleaning form](/commercial-cleaning), or call Cleaniq Services on ${PHONE} and we'll help you plan the right cleaning for your business.`,
    },
    faqs: [
      { q: "How much does office cleaning cost in Manchester?", a: "It depends on the size of your premises, the areas that need cleaning and how often. Tell us about your workplace on our commercial cleaning form and we'll send you a quote." },
      { q: "How do I get an office cleaning quote?", a: "Fill out our commercial cleaning enquiry form with the type of premises, its size in square metres and how often you'd like cleaning, or call us on 07846 726428." },
      { q: "Do you clean other commercial premises?", a: "Yes. As well as offices, we clean restaurants, gyms, communal areas and event spaces, and provide contract cleaning across Greater Manchester." },
      { q: "Can you do a one-off office deep clean?", a: "Yes. Tell us what you need on our commercial cleaning form and we'll quote for a one-off clean. After building work, our post-construction cleaning removes fine dust and debris." },
      { q: "What does office cleaning include?", a: "Workspaces, kitchens, washrooms, reception and communal areas: desks and phones wiped, bins emptied, floors vacuumed and mopped, kitchens and washrooms cleaned. The full office cleaning checklist is on this page." },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  "post-construction-cleaning-manchester": {
    faqTitle: "Post-Construction Cleaning Manchester",
    banner: {
      h2: "Post-Construction Cleaning in Manchester",
      ticks: ["Fine dust removed with HEPA-filter vacuums", "Paint splashes, film and stickers removed", "A handover-ready finish"],
      serviceFor: ["Homeowners", "Builders", "Developers", "Landlords", "Businesses"],
    },
    intro: {
      label: "Manchester Builders Cleaning",
      h2: "After-builders cleaning in Manchester you can rely on",
      paras: [
        "Cleaniq Services provides post-construction cleaning in Manchester and across Greater Manchester. After building work, renovation or a refurbishment, our after-builders cleaners remove the fine dust, debris, paint splashes and grime that standard cleaning can't deal with, leaving the property ready to live in, let or hand over.",
        "Construction dust gets everywhere: on every surface, inside cupboards, on light fittings and along skirting boards. We use HEPA-filter industrial vacuums and specialist products to remove it properly instead of spreading it around, then clean every surface, fixture and floor.",
        `Call us on ${PHONE} or use our [quote form](/get-a-quote) to tell us about your project. Moving into a home after the work? Keep it clean afterwards with [regular house cleaning](/service/regular-house-cleaning-manchester), or book [carpet cleaning](/service/carpet-cleaning-manchester) for new or dusty carpets.`,
      ],
    },
    how: {
      h2: "How does our post-construction cleaning in Manchester work?",
      intro:
        "Every building project is different, so we start by finding out about yours. Tell us what work has been done, the size of the property and when you need it ready, and we'll plan the clean around your build schedule and handover date. Larger properties and commercial fit-outs are quoted individually after a site assessment. Once the trades have finished, our team carries out the clean using our post-construction checklist. Here is how it works:",
      steps: [
        { title: "Tell us about the project", body: "Call us or use our quote form. Tell us what work was done, the size of the property and your handover date." },
        { title: "Plan the clean", body: "We agree a date once the trades have finished. Larger properties and commercial fit-outs are quoted after a site assessment." },
        { title: "The builders clean", body: "Our team removes fine dust with HEPA-filter vacuums, then cleans every surface, fixture, window and floor using our post-construction checklist." },
        { title: "Ready for handover", body: "The property is left clean and ready to move into, let or hand over to your client." },
      ],
    },
    benefits: {
      h2: "Benefits of professional post-construction cleaning",
      intro:
        "Cleaning up after builders is one of the hardest cleaning jobs there is. Fine plaster and cement dust settles on every surface, clings to walls and fittings, and comes straight back if it isn't removed properly. A professional post-construction clean saves you days of work, protects your new surfaces and fittings, and gets the property ready for the people who'll use it. Here are the main benefits:",
      items: [
        { title: "Dust removed properly", body: "HEPA-filter industrial vacuums capture fine construction dust instead of spreading it around." },
        { title: "New finishes protected", body: "Paint splashes, sealant residue, stickers and protective film are removed carefully from fixtures and glazing." },
        { title: "Ready for handover", body: "A clean suitable for handing a property over to clients, tenants or buyers." },
        { title: "Fits your schedule", body: "We plan the clean around your build schedule and completion date." },
        { title: "Any size of project", body: "From a single-room refurbishment to a full commercial fit-out." },
        { title: "Saves you days of work", body: "Our team does the hard work, so you can move in, let or sell sooner." },
      ],
    },
    types: {
      label: "Every Type of Project",
      h2: "Post-construction cleaning for every type of project",
      body:
        "Our post-construction cleaning team in Manchester cleans up after all kinds of building work, from small home improvements to new-build developments and commercial fit-outs. Tell us what work was done and which rooms were affected, and we'll plan the clean to match the size and condition of the property.",
      chips: ["Home renovations", "Extensions", "Kitchen & bathroom fits", "New builds", "Office fit-outs", "Retail units"],
    },
    compare: {
      label: "Builders Clean or Deep Clean?",
      h2: "Post-construction clean or deep clean: what's the difference?",
      intro: "Both are thorough, but they're designed for different situations.",
      cards: [
        { title: "Post-construction clean", body: "For properties after building work. It removes fine plaster and cement dust with HEPA-filter vacuums, paint splashes, sealant residue, stickers, protective film and grout haze, then cleans every surface, fixture and floor ready for handover." },
        { title: "Deep clean", body: "For lived-in homes that need a top-to-bottom refresh: inside appliances and cupboards, behind furniture and built-up limescale and grime. Read more about our [deep cleaning in Manchester](/service/deep-cleaning-manchester)." },
      ],
    },
    experts: {
      label: "After-Builders Cleaners Manchester",
      h2: "Experienced after-builders cleaners in Manchester",
      paras: [
        "Post-construction cleaning needs the right equipment and the right approach. Our team uses HEPA-filter industrial vacuums and specialist products for construction dust, paint and sealant residue, working carefully around new fixtures, glazing and finishes so nothing is scratched or damaged.",
        "We work to your handover deadline and follow a fixed post-construction checklist, so every room, surface and fitting is covered. Whether you're a homeowner after a renovation, a builder finishing a job or a developer handing over new homes, we'll leave the property ready for the people who'll use it.",
      ],
      points: ["HEPA-filter industrial vacuums.", "Specialist products for dust, paint and sealant residue.", "A fixed post-construction checklist.", "Residential and commercial projects."],
    },
    combine: {
      h2: "Combine your builders clean with our other services",
      intro:
        "Once the building work is done and the dust is gone, you may want to keep the property in top condition. Add one of our other cleaning services in Manchester to finish the job or keep it clean afterwards. It's a simple way to go from building site to a home or workplace that's ready to enjoy, all with one cleaning company. Choose from:",
      links: [
        { to: "/service/carpet-cleaning-manchester", name: "Carpet Cleaning", body: "For carpets that collected dust during the work." },
        { to: "/service/regular-house-cleaning-manchester", name: "Regular House Cleaning", body: "Keep your newly finished home clean." },
        { to: "/service/office-cleaning-manchester", name: "Office Cleaning", body: "Regular cleaning for your new or refurbished workplace." },
        { to: "/service/end-of-tenancy-cleaning-manchester", name: "End of Tenancy Cleaning", body: "For rental properties between tenants." },
      ],
    },
    local: {
      label: "Builders Cleaning Across Manchester",
      h2: "After-builders cleaning across Manchester and Greater Manchester",
      paras: [
        `Our post-construction cleaning team covers homes, developments and commercial premises across Manchester and Greater Manchester, including ${AREAS_TEXT}. Our office is at 20 Swan St in Ancoats, so we're never far from your project.`,
        "From city-centre apartment refurbishments to new-build homes and commercial fit-outs, we plan each clean around the site, access arrangements and your handover date.",
      ],
    },
    tips: {
      label: "Tips",
      h2: "How to prepare for a post-construction clean",
      intro: "A little preparation helps our team clean faster and more thoroughly, and makes sure the property is ready on time:",
      tips: [
        "Book the clean once all trades have finished, including painters and decorators, so no new dust is created afterwards.",
        "Ask your builder to clear large waste such as rubble, old fittings and offcuts before the clean.",
        "Make sure the property has running water and electricity on the day.",
        "Tell us about delicate new finishes, such as natural stone or high-gloss surfaces.",
        "Let us know how our team can get in and where to park.",
        "Keep windows open where possible during and after the work to help clear airborne dust.",
        "Give yourself a buffer before your handover date in case anything needs a final touch.",
      ],
    },
    quote: {
      h2: "Get a quote for post-construction cleaning",
      body:
        "Every building project is different, so we quote for each one. Tell us what work was done, the size of the property, which rooms were affected and when you need it ready, and we'll give you a quote for your post-construction clean. Larger properties and commercial fit-outs are quoted after a site assessment. Call us on 07846 726428 or use our quick quote form. There's no obligation.",
    },
    closing: {
      h2: "Book your post-construction clean in Manchester",
      body: `Call Cleaniq Services on ${PHONE} or use our [quote form](/get-a-quote) to tell us about your project, and we'll plan the clean around your handover date.`,
    },
    faqs: [
      { q: "How much does post-construction cleaning cost in Manchester?", a: "It depends on the size and condition of the property and what work was done. Larger properties and commercial fit-outs are quoted individually after a site assessment. Call us or use our quote form for a quote." },
      { q: "When should I book a post-construction clean?", a: "Once all trades have finished, including painters and decorators, so no new dust is created after the clean. We'll plan the date around your handover." },
      { q: "Do you remove building waste?", a: "We remove site debris from the immediate access areas as part of the clean. Large waste such as rubble, skips and old fittings should be cleared by your builder first." },
      { q: "Can you clean a new-build home before we move in?", a: "Yes. We clean new-build homes and developments, removing construction dust, stickers and protective film so the property is ready to move into." },
      { q: "Is a post-construction clean the same as a deep clean?", a: "No. A post-construction clean is designed for properties after building work, removing fine construction dust, paint splashes and protective film. A deep clean is for lived-in homes that need a top-to-bottom refresh." },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  "oven-cleaning-manchester": {
    faqTitle: "Oven Cleaning Manchester",
    banner: {
      h2: "Oven Cleaning in Manchester",
      ticks: ["Single, double and range ovens", "Racks, trays and door glass included", "Fixed prices, shown live on this page"],
      serviceFor: ["Homeowners", "Tenants", "Landlords", "Airbnb Hosts"],
    },
    intro: {
      label: "Manchester Oven Cleaners",
      h2: "Professional oven cleaning in Manchester",
      paras: [
        "Cleaniq Services provides professional oven cleaning in Manchester and across Greater Manchester. Our oven cleaners clean single, double and range ovens inside and out: the oven walls, base and roof, the racks and shelves, baking trays and grill pans, and the inner and outer door glass.",
        "Grease and food spills bake on every time you cook. Over time they build up into a layer that smokes, smells and is very hard to remove with everyday products. A professional oven clean removes that build-up properly, so your kitchen smells of your cooking, not of last month's roast.",
        `Every oven size has a fixed price, shown live on this page from our booking system. Book your oven clean online in a few minutes or call us on ${PHONE}. Moving out? A full oven clean is included as standard in our [end of tenancy cleaning](/service/end-of-tenancy-cleaning-manchester). You can also combine oven cleaning with a [deep clean](/service/deep-cleaning-manchester) or [regular house cleaning](/service/regular-house-cleaning-manchester).`,
      ],
    },
    how: {
      h2: "How does our oven cleaning in Manchester work?",
      intro:
        "Booking an oven clean with Cleaniq Services is quick and simple. You choose your oven size when you book, so the price matches your oven, and pick a day and arrival time that suit you. Your oven cleaner removes the racks, trays and shelf supports, cleans every part of the oven, and refits everything once it's clean. You can book an oven clean on its own or add it to another clean. Here is how it works:",
      steps: [
        { title: "Book", body: "Book online or call us. Choose single, double or range oven, the day and the arrival time. The fixed price for your oven size is shown live on this page." },
        { title: "Racks and trays out", body: "Your oven cleaner removes the racks, trays and shelf supports and soaks and degreases them." },
        { title: "Inside and out", body: "The oven walls, base and roof are cleaned, grease and carbon removed, and the inner and outer door glass, seal and hinges cleaned." },
        { title: "Refit and finish", body: "Everything is refitted, the oven front, knobs and handles wiped, and the area around the oven left clean and tidy." },
      ],
    },
    benefits: {
      h2: "Benefits of professional oven cleaning in Manchester",
      intro:
        "Cleaning an oven yourself is one of the least popular jobs in the house. It takes time, strong products and a lot of scrubbing, and the racks and door glass are often left half done. A professional oven clean does the whole job properly, inside and out, so your oven looks better, smells better and is nicer to cook with. Here are the main benefits:",
      items: [
        { title: "No more scrubbing", body: "Our oven cleaners do the hard work, so you don't spend your weekend on your knees in front of the oven." },
        { title: "Inside and out", body: "Racks, trays, door glass and the oven interior are all cleaned, not just the parts you can see." },
        { title: "Fresher cooking", body: "Removing baked-on grease and carbon cuts out the smoke and smells from old spills." },
        { title: "Fixed prices", body: "Every oven size has a fixed price, shown live on this page from our booking system." },
        { title: "Ready for checkout", body: "A clean oven helps at the end of a tenancy, when landlords and letting agents usually check it." },
        { title: "48-hour re-clean guarantee", body: "If anything isn't right, tell us within 48 hours and we'll come back and put it right for free." },
      ],
    },
    types: {
      label: "Every Type of Oven",
      h2: "Oven cleaning for every type of oven",
      body:
        "Our Manchester oven cleaners clean single ovens, double ovens and range ovens, including the racks, shelves, baking trays, grill pans and door glass. Choose the right oven size when you book so the price matches your oven, and add any notes about your oven or kitchen for your cleaner.",
      chips: ["Single ovens", "Double ovens", "Range ovens", "Racks & shelves", "Baking trays & grill pans", "Oven door glass"],
    },
    compare: {
      label: "Professional or DIY?",
      h2: "Professional oven cleaning or doing it yourself?",
      intro: "You can clean an oven yourself, but a professional oven clean is quicker and more thorough.",
      cards: [
        { title: "Doing it yourself", body: "Shop-bought oven cleaners can take hours of soaking and scrubbing, and are often hard to use on the racks, door glass and the roof of the oven. Baked-on carbon is especially difficult to shift." },
        { title: "Professional oven clean", body: "Our oven cleaners remove and degrease the racks, trays and shelf supports, clean the oven walls, base, roof and door glass, and refit everything, following our oven cleaning checklist every time." },
      ],
    },
    experts: {
      label: "Oven Cleaners Manchester",
      h2: "Oven cleaners in Manchester you can trust",
      paras: [
        "Every Cleaniq Services cleaner has a face-to-face interview, background checks and a practical skills assessment before they clean a customer's home. Our oven cleaners follow the same oven cleaning checklist on every job, so every part of your oven is cleaned, not just the parts you can see.",
        "Your oven cleaner works carefully in your kitchen and leaves the area around the oven clean and tidy. If anything isn't right after your oven clean, tell us within 48 hours and we'll come back and put it right, free of charge.",
      ],
      points: ["Interviewed face to face and background checked.", "The same oven cleaning checklist on every job.", "Single, double and range ovens.", "Backed by our 48-hour re-clean guarantee."],
    },
    combine: {
      h2: "Combine oven cleaning with our other services",
      intro:
        "An oven clean is often part of a bigger clean. Add it to one of our other cleaning services in Manchester, or book it on its own whenever your oven needs it. Moving out, getting your home ready for guests or catching up on the bigger jobs? Combining services means the whole kitchen, and the rest of your home, gets done in one go. Choose from:",
      links: [
        { to: "/service/end-of-tenancy-cleaning-manchester", name: "End of Tenancy Cleaning", body: "A full oven clean is included as standard when you move out." },
        { to: "/service/deep-cleaning-manchester", name: "Deep Cleaning", body: "A top-to-bottom clean of your whole home." },
        { to: "/service/regular-house-cleaning-manchester", name: "Regular House Cleaning", body: "Add an oven clean to your regular visits every few months." },
        { to: "/service/airbnb-cleaning-manchester", name: "Airbnb Cleaning", body: "A clean oven for your short-let guests." },
      ],
    },
    local: {
      label: "Oven Cleaning Across Manchester",
      h2: "Oven cleaners across Manchester and Greater Manchester",
      paras: [
        `Our oven cleaners cover homes across Manchester and Greater Manchester, including ${AREAS_TEXT}. Our office is at 20 Swan St in Ancoats, so we're never far from your kitchen.`,
        "Whether you're a homeowner, a tenant getting ready to move out, a landlord between tenancies or an Airbnb host, you can book oven cleaning on the day and at the time that suits you.",
      ],
    },
    tips: {
      label: "Tips",
      h2: "Tips for keeping your oven clean for longer",
      intro: "After a professional oven clean, a few simple habits help keep your oven cleaner for longer:",
      tips: [
        "Use a baking tray under dishes that might bubble over.",
        "Wipe up spills once the oven has cooled, before they bake on next time.",
        "Cover dishes that spit, such as roasts, with a lid or foil.",
        "Wipe the inside of the door glass regularly to stop grease building up.",
        "Clean the racks every few weeks, before grease hardens.",
        "Book a professional oven clean every few months if you cook often, or before moving out.",
        "Tell us within 48 hours of your oven clean if anything wasn't right.",
      ],
    },
    quote: {
      h2: "Questions about oven cleaning?",
      body:
        "Not sure which oven size to choose, or want to combine oven cleaning with another clean? Contact Cleaniq Services and we'll help. Tell us what type of oven you have and whether you'd like any other cleaning, and we'll make sure you book the right service. Call us on 07846 726428 or fill out our quick quote form and we'll get back to you. Every oven size has a fixed price, shown live on this page.",
    },
    closing: {
      h2: "Book your oven clean in Manchester",
      body: `Book your oven clean online in a few minutes, or call Cleaniq Services on ${PHONE} and we'll help you choose the right service.`,
    },
    faqs: [
      { q: "Do you clean the oven racks and trays?", a: "Yes. Racks, shelves, shelf supports, baking trays and grill pans are removed, soaked and degreased, then refitted once the oven is clean." },
      { q: "Do you clean the oven door glass?", a: "Yes. We clean the inner and outer door glass, the door seal, hinges and frame." },
      { q: "How often should I get my oven professionally cleaned?", a: "It depends on how often you cook. Many homes book an oven clean every few months, and it's worth booking one before you move out of a rented home." },
      { q: "Is oven cleaning included in end of tenancy cleaning?", a: "Yes. A full oven clean is included as standard in our end of tenancy cleaning. If you only need your oven cleaned, book an oven clean on its own." },
    ],
  },
};
