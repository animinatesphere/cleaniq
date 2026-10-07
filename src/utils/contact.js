// Business contact details used across the website.
// Our number for calls (answered by the AI receptionist) and WhatsApp.
export const PHONE_NUMBER = "+44 7846 726428";
export const WHATSAPP_NUMBER = "447846726428"; // Twilio line: Brenda replies on WhatsApp

export const whatsappLink = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
