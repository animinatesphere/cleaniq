// Local guide for each area page (/locations/:slug), so every page has its own content instead of
// a template with the town name swapped (Google treats near-identical town pages as low quality).
// Facts only: real neighbourhoods, housing and local patterns. No invented jobs, reviews or prices.
//   intro       – two paragraphs about cleaning in this area
//   popular     – the services that suit this area best, with a local reason (slug from servicePages.js)
//   goodToKnow  – practical local points before booking
//   faqs        – questions specific to this area
//   highlights  – three neighbourhoods, used on the homepage links

export const AREA_GUIDE = {
  "manchester-city-centre": {
    highlights: ["Deansgate", "Ancoats", "Northern Quarter"],
    intro: [
      "Living in Manchester city centre usually means apartment living: a high-rise near Deansgate or Spinningfields, or a converted mill in Ancoats, Castlefield or the Northern Quarter. These flats look great, but big windows, open-plan kitchens and city dust mean they need cleaning more often than you'd think.",
      "Our city centre cleaners are used to concierge desks, fob entry, lifts and tight parking. Whether you live here, let a flat out or run an office around Piccadilly, we plan the clean around your building and your diary.",
    ],
    popular: [
      { slug: "airbnb-cleaning-manchester", why: "Lots of city centre flats are short-lets, and turnovers between guests need to be quick and consistent." },
      { slug: "end-of-tenancy-cleaning-manchester", why: "Most city centre flats are rented, and letting agents check the oven, bathroom and cupboards at checkout." },
      { slug: "office-cleaning-manchester", why: "Offices and co-working spaces around Piccadilly and Spinningfields need cleaning outside working hours." },
    ],
    goodToKnow: [
      "Tell us about concierge, fob access or key collection when you book, so your cleaner can get straight in.",
      "Parking is limited and expensive, so we plan city centre visits with that in mind.",
      "Apartments with floor-to-ceiling windows benefit from a deep clean that includes interior glass and sills.",
      "Short-let hosts can book turnovers to fit guest check-out and check-in times.",
    ],
    faqs: [
      { q: "Can your cleaners get into my apartment building in the city centre?", a: "Yes. Tell us how access works when you book, for example concierge, a fob, a key safe or key collection, and your cleaner will follow those instructions." },
      { q: "Do you clean converted mill apartments in Ancoats and the Northern Quarter?", a: "Yes. Exposed brick, high ceilings and large windows collect dust quickly, so a deep clean is a good place to start, followed by regular cleans." },
      { q: "Can you clean my city centre office before or after work?", a: "Yes. Tell us about your workplace on our commercial cleaning form and we'll plan cleaning around your working hours." },
    ],
  },
  salford: {
    highlights: ["Salford Quays", "Eccles", "Swinton"],
    intro: [
      "Salford is really several places in one: waterside apartments at Salford Quays and MediaCityUK, Victorian terraces in Pendleton and Seedley, family homes in Swinton, Eccles and Worsley, and student houses close to the University of Salford.",
      "That variety means our Salford cleaners do a bit of everything, from regular cleans for busy professionals at the Quays to deep cleans for family homes and end of tenancy cleans when student and rental tenancies finish.",
    ],
    popular: [
      { slug: "end-of-tenancy-cleaning-manchester", why: "Student and rental tenancies near the university end in summer, and deposits depend on a proper clean." },
      { slug: "regular-house-cleaning-manchester", why: "Busy households in Swinton, Eccles and Worsley keep on top of things with weekly or fortnightly visits." },
      { slug: "deep-cleaning-manchester", why: "Older terraced houses in Pendleton and Seedley often need a top-to-bottom reset." },
    ],
    goodToKnow: [
      "End of tenancy dates for student houses cluster in June and July, so book early.",
      "Quays apartments with glass balconies and big windows are worth adding to a deep clean.",
      "Family homes in Worsley and Swinton often suit a fortnightly regular clean.",
      "Tell us about parking permits or visitor bays near your home when you book.",
    ],
    faqs: [
      { q: "Do you clean apartments at Salford Quays and MediaCityUK?", a: "Yes. Our cleaners look after apartments across Salford Quays and MediaCityUK, including regular cleans, deep cleans and end of tenancy cleans." },
      { q: "Can you clean a student house in Salford at the end of a tenancy?", a: "Yes. One end of tenancy clean can cover the whole shared house, including the kitchen, bathrooms and every bedroom. Book early for June and July." },
      { q: "Do you cover Eccles, Swinton and Worsley?", a: "Yes. Our Salford cleaners cover Eccles, Swinton, Worsley, Walkden and the rest of the city of Salford." },
    ],
  },
  trafford: {
    highlights: ["Sale", "Altrincham", "Stretford"],
    intro: [
      "Trafford covers everything from terraces and newer flats in Old Trafford and Stretford to family semis in Sale and Urmston and large period homes in Altrincham, Hale and Timperley.",
      "With so many family homes, our Trafford cleaners spend a lot of time on regular cleans that keep busy weeks under control, plus longer deep cleans for bigger houses that need a proper reset.",
    ],
    popular: [
      { slug: "regular-house-cleaning-manchester", why: "Family homes in Sale, Urmston and Timperley stay on top of things with a regular cleaner." },
      { slug: "deep-cleaning-manchester", why: "Larger Altrincham and Hale houses need extra time for a thorough top-to-bottom clean." },
      { slug: "carpet-cleaning-manchester", why: "Family homes with carpeted stairs and lounges benefit from a deep carpet clean once or twice a year." },
    ],
    goodToKnow: [
      "Larger homes in Altrincham and Hale: allow extra hours for a first deep clean.",
      "Roads around Old Trafford get busy on match days, so a morning clean is often easier.",
      "Regular cleans have a regular cleaner, which suits family homes with routines.",
      "Tell us about pets when you book, so your cleaner knows what to expect.",
    ],
    faqs: [
      { q: "Do you clean large family homes in Altrincham and Hale?", a: "Yes. Bigger homes simply need more hours. Choose the number of hours when you book, or call us and we'll help you decide." },
      { q: "Is there a good time to book a clean near Old Trafford?", a: "Match days make the roads around Old Trafford busy, so a morning clean on those days is usually easier." },
      { q: "Do you cover Sale, Urmston and Timperley?", a: "Yes. Our Trafford cleaners cover Sale, Urmston, Timperley, Stretford, Altrincham, Hale and Old Trafford." },
    ],
  },
  stockport: {
    highlights: ["Bramhall", "Cheadle", "Heaton Moor"],
    intro: [
      "Stockport has a real mix of homes: Victorian terraces in Edgeley and Heaton Moor, family houses in Cheadle, Bramhall and Hazel Grove, and older stone properties towards Marple.",
      "Older terraces bring their own challenges, like condensation and mould around bathrooms and windows, while larger family homes in the southern suburbs need cleaning that fits around school runs and work.",
    ],
    popular: [
      { slug: "deep-cleaning-manchester", why: "Older terraces often need mould spots on silicone and window frames tackled properly." },
      { slug: "regular-house-cleaning-manchester", why: "Family homes in Bramhall and Cheadle keep on top of busy weeks with a fortnightly clean." },
      { slug: "end-of-tenancy-cleaning-manchester", why: "Getting a house ready to sell or let? A full clean makes viewings go better." },
    ],
    goodToKnow: [
      "Older terraces: mention damp or mould when you book so your cleaner can focus on it.",
      "Bramhall and Cheadle family homes often choose a fortnightly regular clean.",
      "Selling or letting a house? Book the clean before your viewings start.",
      "Stone cottages towards Marple can have uneven floors and tight stairs, so tell us about access.",
    ],
    faqs: [
      { q: "Can you help with condensation mould in my Stockport terrace?", a: "Yes. A deep clean can include mould spots on bathroom silicone, tiles and window frames. Tell us about it when you book so your cleaner can focus on it." },
      { q: "Do you cover Bramhall, Cheadle and Hazel Grove?", a: "Yes. Our Stockport cleaners cover Bramhall, Cheadle, Hazel Grove, Marple, Heaton Moor, Edgeley and the rest of Stockport." },
      { q: "Can you clean my house before I sell it?", a: "Yes. A deep clean or end of tenancy clean gets the kitchen, bathrooms and every room ready for viewings and photos." },
    ],
  },
  didsbury: {
    highlights: ["West Didsbury", "East Didsbury", "Withington"],
    intro: [
      "Didsbury is known for its big Victorian and Edwardian houses, many now split into flats, along with family homes in East Didsbury and rentals for students and young professionals towards Withington and Fallowfield.",
      "High ceilings, original features and shared houses make Didsbury a little different to clean. Deep cleans and end of tenancy cleans are common here, especially at the end of the academic year.",
    ],
    popular: [
      { slug: "end-of-tenancy-cleaning-manchester", why: "Shared houses and flats towards Withington and Fallowfield change tenants every summer." },
      { slug: "deep-cleaning-manchester", why: "Period homes with high ceilings, cornices and fireplaces need careful, thorough cleaning." },
      { slug: "regular-house-cleaning-manchester", why: "Family homes in East Didsbury keep on top of things with regular visits." },
    ],
    goodToKnow: [
      "Shared houses: one end of tenancy clean for the whole house is usually simpler than room by room.",
      "High ceilings and period features: tell us if you need cornices and light fittings reached.",
      "Student lets in Withington and Fallowfield get busy in June and July, so book early.",
      "Flats in converted houses: let us know which floor you're on and how to get in.",
    ],
    faqs: [
      { q: "Do you clean period houses in West Didsbury?", a: "Yes. High ceilings, cornices, fireplaces and original features are no problem. Mention anything delicate when you book." },
      { q: "Can you clean a shared house in Withington or Fallowfield?", a: "Yes. We clean shared and student houses, including end of tenancy cleans for the whole property. Book early for June and July." },
      { q: "Do you cover Burnage and Northenden?", a: "Yes. Our Didsbury cleaners also cover Burnage, Northenden, Withington and Fallowfield." },
    ],
  },
  chorlton: {
    highlights: ["Beech Road", "Whalley Range", "Firswood"],
    intro: [
      "Chorlton-cum-Hardy is mostly Victorian and Edwardian terraces and semis around Beech Road and Chorlton Green, with flats and newer homes nearby in Firswood and Whalley Range.",
      "Many of these homes are family homes or rentals, so most of our work in Chorlton is regular cleaning for busy households and end of tenancy cleans when rentals change hands.",
    ],
    popular: [
      { slug: "regular-house-cleaning-manchester", why: "Family homes around Beech Road and Chorlton Green suit weekly or fortnightly visits." },
      { slug: "end-of-tenancy-cleaning-manchester", why: "Rented terraces and flats need a full clean when tenants move out." },
      { slug: "oven-cleaning-manchester", why: "Busy family kitchens build up baked-on grease faster than most." },
    ],
    goodToKnow: [
      "Terraced streets can be tight for parking, so tell us about permits or nearby spaces.",
      "Victorian terraces often have original tiles and floors, so mention anything delicate.",
      "Rentals in Firswood and Whalley Range: book your end of tenancy clean as soon as you know your date.",
      "Add oven cleaning every few months to keep a busy family kitchen fresh.",
    ],
    faqs: [
      { q: "Do you clean Victorian terraces in Chorlton?", a: "Yes. Our cleaners look after terraced and semi-detached homes across Chorlton, including those with original tiles and floors. Tell us about anything delicate when you book." },
      { q: "Do you cover Whalley Range and Firswood?", a: "Yes. Our Chorlton cleaners cover Chorlton-cum-Hardy, Whalley Range, Firswood and nearby Stretford." },
      { q: "Can I get my oven cleaned as well as a regular clean?", a: "Yes. Add oven cleaning when you book, or book it on its own whenever your oven needs it." },
    ],
  },
  bolton: {
    highlights: ["Horwich", "Farnworth", "Westhoughton"],
    intro: [
      "Bolton mixes terraced streets close to the town centre with family homes and newer estates in Horwich, Westhoughton and Bromley Cross, and plenty of rented homes in between.",
      "That means our Bolton cleaners do a lot of end of tenancy cleans for landlords and tenants, alongside regular cleans for family homes and deep cleans for properties that need a fresh start.",
    ],
    popular: [
      { slug: "end-of-tenancy-cleaning-manchester", why: "Bolton has lots of rented terraces, and a proper clean makes handover simpler for tenants and landlords." },
      { slug: "regular-house-cleaning-manchester", why: "Family homes in Horwich and Westhoughton stay on top of busy weeks with regular visits." },
      { slug: "carpet-cleaning-manchester", why: "Carpeted terraces and family homes freshen up with a deep carpet clean between tenants or once a year." },
    ],
    goodToKnow: [
      "Landlords: book the clean between tenancies so the property is ready for viewings.",
      "Newer estates in Horwich and Westhoughton usually have easy parking; town centre terraces less so.",
      "Add carpet cleaning to an end of tenancy clean when carpets need more than a vacuum.",
      "Tell us about pets or anything that needs special care when you book.",
    ],
    faqs: [
      { q: "Do you clean rental properties in Bolton for landlords?", a: "Yes. We clean between tenancies so properties are ready to let, including end of tenancy cleans with optional carpet cleaning." },
      { q: "Do you cover Horwich, Farnworth and Westhoughton?", a: "Yes. Our Bolton cleaners cover Horwich, Farnworth, Westhoughton, Kearsley, Little Lever and Bromley Cross." },
      { q: "Can you clean carpets as well as the house?", a: "Yes. Add carpet cleaning to your booking, or book it on its own." },
    ],
  },
  bury: {
    highlights: ["Ramsbottom", "Prestwich", "Whitefield"],
    intro: [
      "Bury runs from busy commuter areas like Prestwich and Whitefield to the stone cottages and hillside homes of Ramsbottom, Tottington and Summerseat.",
      "Families here tend to want a regular cleaner they can rely on, while older stone properties further north can need deep cleans that deal with dust, damp and hard-to-reach corners.",
    ],
    popular: [
      { slug: "regular-house-cleaning-manchester", why: "Commuter families in Prestwich and Whitefield get their evenings back with a regular cleaner." },
      { slug: "deep-cleaning-manchester", why: "Older stone cottages in Ramsbottom and Tottington benefit from a thorough top-to-bottom clean." },
      { slug: "general-cleaning-manchester", why: "A one-off clean before guests arrive or after a busy month keeps things manageable." },
    ],
    goodToKnow: [
      "Stone cottages can have narrow stairs and low ceilings, so tell us about access.",
      "Prestwich and Whitefield homes often suit a weekly or fortnightly regular clean.",
      "Tell us about parking on steep or narrow roads in Ramsbottom and Summerseat.",
      "A one-off general clean is ideal before visitors or a family occasion.",
    ],
    faqs: [
      { q: "Do you clean stone cottages in Ramsbottom?", a: "Yes. Older stone properties are no problem. Tell us about access, stairs and anything delicate when you book." },
      { q: "Do you cover Prestwich and Whitefield?", a: "Yes. Our Bury cleaners cover Prestwich, Whitefield, Radcliffe, Ramsbottom, Tottington and Summerseat." },
      { q: "Can I book a one-off clean rather than regular cleaning?", a: "Yes. Book a general clean or deep clean as a one-off whenever you need it." },
    ],
  },
  oldham: {
    highlights: ["Chadderton", "Royton", "Saddleworth"],
    intro: [
      "Oldham ranges from terraced streets and family homes in Chadderton, Royton, Shaw and Failsworth to the stone villages and rural homes of Saddleworth.",
      "Our Oldham cleaners help families keep on top of busy weeks, help landlords get properties ready between tenants, and give older homes the deeper clean they need.",
    ],
    popular: [
      { slug: "regular-house-cleaning-manchester", why: "Family homes in Chadderton, Royton and Shaw stay clean with weekly or fortnightly visits." },
      { slug: "end-of-tenancy-cleaning-manchester", why: "Rented homes need a full clean so they're ready for the next tenants." },
      { slug: "deep-cleaning-manchester", why: "Older stone homes in Saddleworth benefit from a thorough reset." },
    ],
    goodToKnow: [
      "Saddleworth homes can be more rural, so share directions and parking details when you book.",
      "Terraced streets in Chadderton and Failsworth can be busy for parking, so tell us about permits.",
      "Landlords: book the clean as soon as you know the tenancy end date.",
      "Older homes: mention damp or mould so your cleaner can focus on it.",
    ],
    faqs: [
      { q: "Do you cover Saddleworth?", a: "Yes. Our Oldham cleaners cover Saddleworth as well as Chadderton, Royton, Shaw, Failsworth and Lees. Share directions and parking details when you book." },
      { q: "Can you clean a rented house in Oldham between tenants?", a: "Yes. Our end of tenancy clean covers the kitchen, oven, bathrooms and every room so the property is ready to let." },
      { q: "Do you offer regular cleaning in Chadderton and Royton?", a: "Yes. Choose weekly, fortnightly or monthly visits when you book." },
    ],
  },
  rochdale: {
    highlights: ["Heywood", "Middleton", "Littleborough"],
    intro: [
      "Rochdale takes in the town itself, Heywood and Middleton, and the Pennine-edge villages of Littleborough, Milnrow and Norden, with a mix of terraces, family homes and rentals.",
      "Our Rochdale cleaners keep family homes on track with regular visits, get rental properties ready between tenants, and tackle the damp and mould that older Pennine homes can suffer from.",
    ],
    popular: [
      { slug: "regular-house-cleaning-manchester", why: "Family homes in Heywood, Middleton and Norden suit regular weekly or fortnightly cleans." },
      { slug: "deep-cleaning-manchester", why: "Older homes near the Pennines can need help with condensation, damp and mould." },
      { slug: "end-of-tenancy-cleaning-manchester", why: "Rental properties need a full clean ready for the next tenants." },
    ],
    goodToKnow: [
      "Older homes: mention damp or mould on windows and bathroom silicone when you book.",
      "Villages like Littleborough and Milnrow can be more spread out, so share directions and parking.",
      "Middleton and Heywood homes often suit a fortnightly regular clean.",
      "Landlords: book the clean as soon as you know the tenancy end date.",
    ],
    faqs: [
      { q: "Do you cover Heywood and Middleton?", a: "Yes. Our Rochdale cleaners cover Heywood, Middleton, Littleborough, Milnrow, Castleton and Norden." },
      { q: "Can you help with mould in an older Rochdale home?", a: "Yes. A deep clean can include mould spots on bathroom silicone, tiles and window frames. Tell us about it when you book." },
      { q: "Can I book a regular cleaner in Rochdale?", a: "Yes. Choose weekly, fortnightly or monthly visits, and the day and time that suit you." },
    ],
  },
  tameside: {
    highlights: ["Ashton-under-Lyne", "Hyde", "Stalybridge"],
    intro: [
      "Tameside brings together Ashton-under-Lyne, Hyde, Stalybridge, Denton, Dukinfield and Droylsden, with terraced streets, family homes and a good number of rented properties.",
      "Our Tameside cleaners help families with regular cleaning, help landlords and tenants with end of tenancy cleans, and freshen up kitchens with oven cleaning.",
    ],
    popular: [
      { slug: "regular-house-cleaning-manchester", why: "Family homes across Denton, Hyde and Stalybridge stay on top of things with regular visits." },
      { slug: "end-of-tenancy-cleaning-manchester", why: "Rented homes across Tameside need a full clean when tenants move out." },
      { slug: "oven-cleaning-manchester", why: "A professional oven clean freshens up busy family kitchens." },
    ],
    goodToKnow: [
      "Terraced streets can be busy for parking, so tell us about permits or nearby spaces.",
      "Landlords: book the clean between tenancies so the property is ready to let.",
      "Add oven cleaning to any clean, or book it on its own.",
      "Tell us about pets when you book, so your cleaner knows what to expect.",
    ],
    faqs: [
      { q: "Do you cover Ashton-under-Lyne and Stalybridge?", a: "Yes. Our Tameside cleaners cover Ashton-under-Lyne, Stalybridge, Hyde, Denton, Dukinfield and Droylsden." },
      { q: "Can you clean my oven in Tameside?", a: "Yes. Book an oven clean on its own or add it to any clean. Every oven size has a fixed price, shown on our oven cleaning page." },
      { q: "Do you clean rental properties in Tameside?", a: "Yes. Our end of tenancy cleaning gets rented homes ready for the next tenants." },
    ],
  },
  wigan: {
    highlights: ["Leigh", "Standish", "Hindley"],
    intro: [
      "Wigan covers the town itself plus Leigh, Standish, Hindley, Orrell, Atherton and Ashton-in-Makerfield, from terraced streets to newer family estates.",
      "Our Wigan cleaners look after family homes with regular cleaning, get rental properties ready between tenants, and give homes a deep clean when they need a fresh start.",
    ],
    popular: [
      { slug: "regular-house-cleaning-manchester", why: "Family homes in Standish, Orrell and Leigh keep on top of busy weeks with a regular cleaner." },
      { slug: "end-of-tenancy-cleaning-manchester", why: "Rented homes need a full clean when tenants move out." },
      { slug: "deep-cleaning-manchester", why: "A top-to-bottom clean gives homes a fresh start, for example after moving in." },
    ],
    goodToKnow: [
      "Newer estates usually have easy parking; town centre terraces less so, so tell us when you book.",
      "Moving into a new home? A deep clean before you unpack is the easiest time.",
      "Landlords: book the clean as soon as you know the tenancy end date.",
      "Regular cleans have a regular cleaner, which suits family routines.",
    ],
    faqs: [
      { q: "Do you cover Leigh, Standish and Hindley?", a: "Yes. Our Wigan cleaners cover Leigh, Standish, Hindley, Orrell, Atherton and Ashton-in-Makerfield." },
      { q: "Can you deep clean a house before I move in?", a: "Yes. A deep clean before you unpack is the easiest time to get every room, cupboard and appliance clean." },
      { q: "Do you offer regular house cleaning in Wigan?", a: "Yes. Choose weekly, fortnightly or monthly visits on the day and time that suit you." },
    ],
  },
};
