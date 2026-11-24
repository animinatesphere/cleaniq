// Every block, loaded straight away: the editor needs them all (public pages load them as needed,
// see src/blocks/registry.js).
import { HOME_BLOCKS } from "../blocks/registry";
import { ABOUT_BLOCKS } from "../blocks/AboutBlocks";
import { SERVICES_BLOCKS } from "../blocks/ServicesBlocks";
import { CONTACT_BLOCKS } from "../blocks/ContactBlocks";
import { QUOTE_BLOCKS } from "../blocks/QuoteBlocks";
import { RECRUIT_BLOCKS } from "../blocks/RecruitBlocks";
import { LOCATION_BLOCKS } from "../blocks/LocationBlocks";
import { SERVICE_BLOCKS } from "../blocks/service/ServiceBlocks";

export const ALL_BLOCKS = { ...HOME_BLOCKS, ...ABOUT_BLOCKS, ...SERVICES_BLOCKS, ...CONTACT_BLOCKS, ...QUOTE_BLOCKS, ...RECRUIT_BLOCKS, ...LOCATION_BLOCKS, ...SERVICE_BLOCKS };
