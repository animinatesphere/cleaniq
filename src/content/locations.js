import { bySlug } from "./bySlug";
export const LOCATION_CONTENT = bySlug(import.meta.glob("./locations/*.json", { eager: true, import: "default" }));
