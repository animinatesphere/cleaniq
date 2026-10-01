// Real cleaning photos for each service, picked by name (same photos as the customer app).
const PHOTOS = {
  residential: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&q=70",
  tenancy: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=200&q=70",
  office: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=200&q=70",
  deep: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&q=70",
  airbnb: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&q=70",
  construct: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=70",
  carpet: "https://images.unsplash.com/photo-1580256081112-e49377338b7f?w=300&auto=format&fit=crop&q=60",
  oven: "https://plus.unsplash.com/premium_photo-1679500355493-2a1ce67cb938?w=300&auto=format&fit=crop&q=60",
  general: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=300&auto=format&fit=crop&q=60",
  default: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&q=70",
};

export function servicePhoto(name = "") {
  const n = String(name).toLowerCase();
  if (n.includes("residential") || n.includes("domestic") || n.includes("house")) return PHOTOS.residential;
  if (n.includes("tenancy") || n.includes("move")) return PHOTOS.tenancy;
  if (n.includes("office") || n.includes("commercial")) return PHOTOS.office;
  if (n.includes("deep") || n.includes("thorough")) return PHOTOS.deep;
  if (n.includes("airbnb") || n.includes("short")) return PHOTOS.airbnb;
  if (n.includes("construct") || n.includes("build")) return PHOTOS.construct;
  if (n.includes("carpet") || n.includes("rug")) return PHOTOS.carpet;
  if (n.includes("oven") || n.includes("cooker")) return PHOTOS.oven;
  if (n.includes("general") || n.includes("regular")) return PHOTOS.general;
  return PHOTOS.default;
}
