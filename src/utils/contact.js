// Business contact details used across the website.
export const WHATSAPP_NUMBER = "447752476368";

export const whatsappLink = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
