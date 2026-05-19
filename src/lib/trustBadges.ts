/**
 * Dynamic Trust Badge Engine — derives contextual badges from trip metadata.
 * Returns max 4 badges, deduped, prioritized by relevance.
 */

import {
  ShieldCheck,
  Users,
  Tent,
  Flame,
  MapPin,
  Mountain,
  Sparkles,
  HeartHandshake,
  Lock,
  Wallet,
  Calendar,
  Compass,
  type LucideIcon,
} from "lucide-react";

export interface TrustBadge {
  key: string;
  label: string;
  icon: LucideIcon;
}

export interface TrustBadgeInput {
  duration?: string;
  durationDays?: number | null;
  type?: string;              // "trip" | "experience"
  category?: string | null;   // experience_category
  tags?: string[];
  inclusions?: string[];
  exclusions?: string[];
  locations?: string[];
  name?: string;
  capacity?: number;
}

// Heuristic: parse "1D/1N", "3 Days 2 Nights", "3–4 Hours" into a rough day count
const parseDays = (d?: string, fallback?: number | null): number => {
  if (fallback && fallback > 0) return fallback;
  if (!d) return 1;
  const lower = d.toLowerCase();
  if (lower.includes("hour")) return 0; // sub-day experience
  const dMatch = lower.match(/(\d+)\s*d/);
  if (dMatch) return parseInt(dMatch[1]);
  const nMatch = lower.match(/(\d+)\s*n/);
  if (nMatch) return parseInt(nMatch[1]) + 1;
  const justNum = lower.match(/^(\d+)/);
  if (justNum) return parseInt(justNum[1]);
  return 1;
};

const hasTag = (haystack: string[] | undefined, needles: string[]): boolean =>
  !!haystack?.some((h) =>
    needles.some((n) => h.toLowerCase().includes(n.toLowerCase()))
  );

const hasIncl = (inclusions: string[] | undefined, keywords: string[]): boolean =>
  !!inclusions?.some((i) =>
    keywords.some((k) => i.toLowerCase().includes(k))
  );

export const deriveTrustBadges = (input: TrustBadgeInput): TrustBadge[] => {
  const days = parseDays(input.duration, input.durationDays);
  const isExperience = input.type === "experience";
  const isCamping =
    input.category === "camping" ||
    hasTag(input.tags, ["camp", "bonfire", "tent"]) ||
    hasTag(input.locations, ["lake", "campsite"]);
  const isTrek =
    input.category === "trek" ||
    hasTag(input.tags, ["trek", "hike", "rappelling", "valley"]) ||
    hasTag([input.name ?? ""], ["trek", "valley", "rappel"]);
  const hasStay = days >= 2 || hasIncl(input.inclusions, ["stay", "hotel", "resort", "tent", "camp"]);
  const isShort = days <= 1;
  const isLong = days >= 3;
  const smallGroup = (input.capacity ?? 30) <= 20;

  const pool: TrustBadge[] = [];

  // SHORT TREKS / 1D-1N / Experiences
  if (isShort || isExperience) {
    if (isTrek || isCamping) {
      pool.push({ key: "leaders", label: "Certified Trek Leaders", icon: ShieldCheck });
      pool.push({ key: "safe", label: "Safe Adventure Experience", icon: ShieldCheck });
    }
    pool.push({ key: "beginner", label: "Beginner Friendly", icon: HeartHandshake });
    pool.push({ key: "weekend", label: "Handpicked Weekend Escape", icon: Sparkles });
  }

  // CAMPING
  if (isCamping) {
    if (hasTag(input.locations, ["lake"])) {
      pool.push({ key: "lakeside", label: "Lakeside Camping", icon: Tent });
    }
    pool.push({ key: "bonfire", label: "Bonfire Experience", icon: Flame });
    pool.push({ key: "curated-camp", label: "Curated Campsite", icon: MapPin });
  }

  // LONG TRIPS
  if (isLong) {
    if (hasStay) pool.push({ key: "stays", label: "Verified Stays", icon: ShieldCheck });
    pool.push({ key: "captain", label: "Trip Captain Support", icon: Compass });
    pool.push({ key: "secure", label: "Secure Booking", icon: Lock });
    pool.push({ key: "pricing", label: "Transparent Pricing", icon: Wallet });
  }

  // SMALL GROUP — always nice if true
  if (smallGroup) {
    pool.push({ key: "small-group", label: "Small Group Experience", icon: Users });
  }

  // Trek-specific
  if (isTrek && !isShort) {
    pool.push({ key: "mountain", label: "Himalayan-Ready Itinerary", icon: Mountain });
  }

  // Generic trust fallback
  pool.push({ key: "trusted", label: "Trusted by Travelers", icon: HeartHandshake });

  // Dedupe by key, keep first occurrence, cap at 4
  const seen = new Set<string>();
  const result: TrustBadge[] = [];
  for (const b of pool) {
    if (seen.has(b.key)) continue;
    seen.add(b.key);
    result.push(b);
    if (result.length === 4) break;
  }
  return result;
};
