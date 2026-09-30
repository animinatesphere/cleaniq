// Business contact details used across the website.
// Two call numbers: the AI receptionist line and the mobile (which also has WhatsApp).
export const PHONE_NUMBER = "+44 7846 726428";
export const PHONE_NUMBER_2 = "+44 7752 476368";
export const WHATSAPP_NUMBER = "447752476368";

export const whatsappLink = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
