import { createContext } from "react";

/** The service page's live info (see serviceData.js serviceInfo): prices, booking link, slug… */
export const ServiceContext = createContext({ slug: "", services: [], priceList: [], related: [], bookingLink: "/booking", quoteLink: "" });
