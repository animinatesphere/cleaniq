// Business contact details used across the website.
// Two numbers for calls (the first is answered by the AI receptionist).
export const PHONE_NUMBER = "+44 7846 726428";
export const PHONE_NUMBER_2 = "+44 7752 476368";
export const WHATSAPP_NUMBER = "447846726428"; // Twilio line: Brenda replies on WhatsApp

export const whatsappLink = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
