// Business contact details used across the website.
// Calls go to the Twilio line answered by the AI receptionist; WhatsApp stays on the mobile.
export const PHONE_NUMBER = "+44 7846 726428";
export const WHATSAPP_NUMBER = "447752476368";

export const whatsappLink = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
