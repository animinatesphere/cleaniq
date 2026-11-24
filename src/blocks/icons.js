// Icons editors can pick for cards and lists in the page editor (used by the About, Services, Join
// the team… blocks). The homepage blocks keep their own small set so the homepage stays light.
import { createElement } from "react";
import {
  ShieldCheck, Home, Clock, RefreshCw, BadgePercent, Award, Leaf, CheckCircle2, Heart, Target, Eye, Gem,
  Lightbulb, Star, Briefcase, Zap, Sparkles, BadgeCheck, Phone, Mail, MapPin, MessageCircle, PoundSterling,
  CalendarClock, Smartphone, GraduationCap, Baby, User, Truck, Building2, KeyRound, BedDouble, Flame, Layers,
  HardHat, Users, ThumbsUp, Lock, Send, FileText, Wrench,
} from "lucide-react";

export const ICON_SET = {
  shield: ["Shield", ShieldCheck],
  home: ["House", Home],
  clock: ["Clock", Clock],
  refresh: ["Arrows (re-clean)", RefreshCw],
  percent: ["Discount", BadgePercent],
  award: ["Award", Award],
  leaf: ["Leaf", Leaf],
  check: ["Tick", CheckCircle2],
  heart: ["Heart", Heart],
  target: ["Target", Target],
  eye: ["Eye", Eye],
  gem: ["Gem", Gem],
  idea: ["Light bulb", Lightbulb],
  star: ["Star", Star],
  briefcase: ["Briefcase", Briefcase],
  zap: ["Lightning", Zap],
  sparkles: ["Sparkle", Sparkles],
  badge: ["Badge", BadgeCheck],
  phone: ["Phone", Phone],
  mail: ["Email", Mail],
  map: ["Map pin", MapPin],
  chat: ["Chat", MessageCircle],
  pound: ["Pound", PoundSterling],
  calendar: ["Calendar", CalendarClock],
  mobile: ["Mobile phone", Smartphone],
  study: ["Graduation cap", GraduationCap],
  baby: ["Baby", Baby],
  person: ["Person", User],
  people: ["People", Users],
  truck: ["Van", Truck],
  building: ["Building", Building2],
  key: ["Key", KeyRound],
  bed: ["Bed", BedDouble],
  flame: ["Flame", Flame],
  layers: ["Layers", Layers],
  hardhat: ["Hard hat", HardHat],
  thumbs: ["Thumbs up", ThumbsUp],
  lock: ["Padlock", Lock],
  send: ["Send", Send],
  file: ["Document", FileText],
  tools: ["Tools", Wrench],
};

export const ICON_OPTIONS = Object.entries(ICON_SET).map(([value, [label]]) => [value, label]);

export function PickedIcon({ name, size = 24, className = "" }) {
  return createElement((ICON_SET[name] || ICON_SET.check)[1], { size, className });
}
