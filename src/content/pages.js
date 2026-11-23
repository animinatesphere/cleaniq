import { bySlug } from "./bySlug";
export const PAGE_CONTENT = bySlug(import.meta.glob("./pages/*.json", { eager: true, import: "default" }));
