import { bySlug } from "./bySlug";
export const SERVICE_CONTENT = bySlug(import.meta.glob("./services/*.json", { eager: true, import: "default" }));
