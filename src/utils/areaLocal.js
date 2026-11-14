// Local detail for each area page (/locations/:slug): the postcodes we cover, the kinds of homes in
// the area and what they usually need. This keeps every area page genuinely different, which
// Google's ranking systems look for (near-identical town pages are treated as low quality).
// Keep it factual: real postcodes, real places and housing, and no invented jobs or reviews.
export const AREA_LOCAL = {
  "manchester-city": {
    postcodes: ["M1", "M2", "M3", "M4", "M15"],
    homes:
      "Most homes in the city centre are apartments: new-build towers around Deansgate and Spinningfields, and converted mills and warehouses in Ancoats, the Northern Quarter and Castlefield. Large windows, exposed brick and open-plan kitchens collect city dust quickly, and many flats are rented or let on Airbnb, so end of tenancy cleans and quick turnovers between guests are a big part of the work here.",
    tips: [
      "Parking is limited, so tell us about building access, concierge or key collection when you book.",
      "Short-let hosts can book turnovers to fit check-out and check-in times.",
      "Handing back a rented flat? An end of tenancy clean covers the oven, kitchen, bathroom and inside cupboards that letting agents check.",
    ],
  },
  salford: {
    postcodes: ["M3", "M5", "M6", "M7", "M27", "M28", "M30", "M50"],
    homes:
      "Salford mixes waterside apartments at Salford Quays and MediaCityUK with Victorian terraces in Pendleton and Seedley, family homes in Swinton, Eccles and Worsley, and student houses near the University of Salford. That means a steady mix of regular cleans for busy professionals, deep cleans for family homes and end of tenancy cleans when student and rental tenancies end in summer.",
    tips: [
      "Student lets: book end of tenancy cleans early for June and July, when most tenancies end.",
      "Quays apartments often have glass balconies and big windows that are worth adding to a deep clean.",
      "Family homes in Worsley and Swinton usually suit a fortnightly regular clean.",
    ],
  },
  trafford: {
    postcodes: ["M16", "M32", "M33", "M41", "WA14", "WA15"],
    homes:
      "Trafford ranges from terraces and newer flats in Old Trafford and Stretford to family semis in Sale and Urmston and larger period homes in Altrincham, Hale and Timperley. Bigger houses often need longer deep cleans, while busy families in Sale and Urmston tend to book weekly or fortnightly regular cleans.",
    tips: [
      "Larger Altrincham and Hale homes: allow extra hours for a first deep clean.",
      "Roads around Old Trafford get busy on match days, so a morning clean is often easier.",
      "Regular cleans keep the same cleaner where possible, which suits family homes.",
    ],
  },
  stockport: {
    postcodes: ["SK1", "SK2", "SK3", "SK4", "SK5", "SK6", "SK7", "SK8"],
    homes:
      "Stockport has Victorian terraces in Edgeley and Heaton Moor, family homes in Cheadle, Bramhall and Hazel Grove, and older stone houses towards Marple. Older terraces often need extra attention for damp and mould in bathrooms and around windows, while larger family homes suit a regular clean to stay on top of busy weeks.",
    tips: [
      "Older terraces: a deep clean can include mould spots on bathroom silicone and window frames.",
      "Bramhall and Cheadle family homes often choose a fortnightly regular clean.",
      "Selling or renting out a house? An end of tenancy clean gets it ready for viewings.",
    ],
  },
  didsbury: {
    postcodes: ["M20", "M14", "M19", "M22"],
    homes:
      "Didsbury is known for large Victorian and Edwardian houses, many split into flats, along with family homes in East Didsbury and student and young-professional rentals towards Withington and Fallowfield. High ceilings, original features and shared houses mean deep cleans and end of tenancy cleans are common, especially at the end of the academic year.",
    tips: [
      "Shared houses: one end of tenancy clean for the whole house is usually cheaper than room by room.",
      "High ceilings and period features: tell us if you need a step ladder for cornices and light fittings.",
      "Withington and Fallowfield student lets get busy in June and July, so book early.",
    ],
  },
  chorlton: {
    postcodes: ["M21", "M16"],
    homes:
      "Chorlton-cum-Hardy is mostly Victorian and Edwardian terraced and semi-detached houses around Beech Road and Chorlton Green, with flats and newer builds nearby in Firswood and Whalley Range. Many are family homes or rentals, so regular cleans and end of tenancy cleans are the most common bookings.",
    tips: [
      "Terraced houses often have narrow staircases; stairs and landings can be added to any clean.",
      "Original wooden floors: tell us and we'll use suitable products.",
      "Renting out a room or house? End of tenancy cleans follow the checklist letting agents use.",
    ],
  },
  bolton: {
    postcodes: ["BL1", "BL2", "BL3", "BL4", "BL5", "BL6", "BL7"],
    homes:
      "Bolton has terraced streets close to the town centre, family homes and new estates in Horwich, Westhoughton and Bromley Cross, and student rentals near the University of Bolton. Regular house cleans for families and end of tenancy cleans for rental properties are the most common jobs across the area.",
    tips: [
      "Landlords with several properties can book end of tenancy cleans back to back.",
      "New-build homes in Horwich and Westhoughton often need an after-builders clean before moving in.",
      "Family homes usually choose a weekly or fortnightly regular clean.",
    ],
  },
  bury: {
    postcodes: ["BL0", "BL8", "BL9", "M25", "M26", "M45"],
    homes:
      "Bury covers the town centre, stone cottages and family homes in Ramsbottom and Tottington, and busier suburbs in Prestwich, Whitefield and Radcliffe close to Manchester. Homes range from older terraces to modern family houses, and local shops, takeaways and offices also book commercial cleans.",
    tips: [
      "Older stone cottages can be prone to damp; a deep clean can include mould spots in bathrooms.",
      "Shops, takeaways and offices can ask for a commercial cleaning quote.",
      "Prestwich and Whitefield are close to the city, so short-notice cleans are often possible.",
    ],
  },
  oldham: {
    postcodes: ["OL1", "OL2", "OL3", "OL4", "OL8", "OL9", "M35"],
    homes:
      "Oldham is mainly terraced and semi-detached housing in the town, Chadderton, Royton and Shaw, with stone-built homes in the Saddleworth villages. Rental properties are common, so end of tenancy cleans are frequent, along with regular cleans for family homes.",
    tips: [
      "Saddleworth homes are further out; please book a little ahead so we can plan travel.",
      "Landlords: end of tenancy cleans help get a property ready for new tenants quickly.",
      "Terraced homes with small kitchens suit a 2 to 3 hour regular clean.",
    ],
  },
  rochdale: {
    postcodes: ["OL10", "OL11", "OL12", "OL15", "OL16", "M24"],
    homes:
      "Rochdale includes the town centre and its terraced streets, family homes in Norden and Castleton, and nearby towns like Heywood, Middleton, Milnrow and Littleborough. Housing is a mix of older terraces and newer estates, with plenty of rental properties needing end of tenancy cleans between tenants.",
    tips: [
      "Older terraces: a deep clean can tackle limescale and mould in bathrooms.",
      "Middleton and Heywood are covered as part of our Rochdale area.",
      "Moving out? Book the end of tenancy clean for after your furniture has gone.",
    ],
  },
  tameside: {
    postcodes: ["OL5", "OL6", "OL7", "SK14", "SK15", "SK16", "M34", "M43"],
    homes:
      "Tameside covers nine towns, including Ashton-under-Lyne, Stalybridge, Hyde, Denton, Droylsden, Dukinfield and Mossley. Homes are mostly terraced and semi-detached family houses, with newer developments in Denton and Droylsden, so regular cleans and end of tenancy cleans make up most bookings.",
    tips: [
      "Family homes often book a fortnightly regular clean with the same cleaner.",
      "Hillside homes towards Mossley and Stalybridge: please mention parking when you book.",
      "End of tenancy cleans include the oven, which letting agents check closely.",
    ],
  },
  wigan: {
    postcodes: ["WN1", "WN2", "WN3", "WN4", "WN5", "WN6", "WN7", "M29", "M46"],
    homes:
      "The Wigan area takes in Wigan town, Standish, Orrell, Ashton-in-Makerfield and Hindley, plus Leigh, Atherton and Tyldesley to the east. It's mostly terraced and semi-detached housing with many new-build estates, so after-builders cleans, regular cleans and end of tenancy cleans are all common.",
    tips: [
      "New-build homes often need an after-builders clean to remove dust before moving in.",
      "Leigh, Atherton and Tyldesley are covered as part of our Wigan area.",
      "Book a little ahead for the further-out towns so we can plan travel.",
    ],
  },
};
