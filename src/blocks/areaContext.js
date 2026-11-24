import { createContext } from "react";

/** The location page's area: { slug, name }. Set by the location page (and by the editor). */
export const AreaContext = createContext({ slug: "", name: "" });
