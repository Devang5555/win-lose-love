// Smart per-location default policies for trips.
// Admin can override these per-trip via TripEditor (saved in trips.policies JSONB).
// Falls back to a sensible global default if no location keyword matches.

const STANDARD_POLICIES = [
  "Booking confirmation is subject to availability.",
  "Cancellation as per company cancellation policy.",
  "Itinerary may change based on weather or local conditions.",
  "The organizer reserves the right to make changes when necessary.",
  "Government-issued photo ID is mandatory for all travelers at check-in.",
  "Any damage to hotel/vehicle property will be borne by the traveler.",
];

const MOUNTAIN_POLICIES = [
  "AMS (Acute Mountain Sickness) — travelers must consult a doctor before high-altitude travel (above 9,000 ft).",
  "Roads to high passes (Rohtang, Atal Tunnel, Khardung La) are subject to weather closures and permit availability.",
  "Sightseeing may be rescheduled or skipped due to landslides, snowfall, or roadblocks — no refund applies.",
  "Pack warm layers, sturdy shoes, sunglasses, sunscreen, and a personal first-aid kit.",
  "Limited mobile network — BSNL/Jio work best in remote Himalayan regions.",
  "Carry sufficient cash — ATMs are sparse beyond major towns.",
];

const BEACH_POLICIES = [
  "Water sports are operated by third-party vendors — travelers participate at their own risk.",
  "Swimming is permitted only in designated safe zones marked by lifeguards.",
  "Beach shacks and boat operators may have separate cash-only charges not included in package.",
  "Avoid monsoon (June–September) for water activities — many beaches are closed by authorities.",
  "Carry light cottons, sunscreen, swimwear, and a hat. Modest attire required at religious sites.",
  "Drone usage is prohibited near beaches and military zones without permission.",
];

const DESERT_POLICIES = [
  "Desert temperatures vary drastically — carry both warm jackets (nights) and light cottons (days).",
  "Camel safaris and dune-bashing are weather-dependent and may be cancelled for safety.",
  "Carry ample drinking water, lip balm, and sunscreen — dehydration is the biggest risk.",
  "Photography of border / military areas is strictly prohibited.",
  "Network connectivity is limited in remote desert camps.",
];

const SPIRITUAL_POLICIES = [
  "Modest clothing required at all temples, gurudwaras, and dargahs (covered shoulders & knees).",
  "Footwear must be removed before entering shrines — carry a small bag for storage.",
  "Photography may be restricted inside sanctums — please follow signage and priest instructions.",
  "Carry a head cover (scarf/cap) for visits to gurudwaras and dargahs.",
  "Aarti / prayer timings are fixed — late arrivals may miss the experience.",
];

const ADVENTURE_POLICIES = [
  "All adventure activities (rafting, trekking, paragliding) are operated by certified third-party vendors.",
  "Travelers with heart conditions, asthma, pregnancy, or recent surgery must inform the operator in advance.",
  "Activity participation is at traveler's own risk — disclaimer forms must be signed on-site.",
  "Activities are weather-dependent and may be cancelled or rescheduled without refund.",
  "Minimum age and weight restrictions apply for certain activities — check with team before booking.",
];

const FOREST_POLICIES = [
  "Jungle safaris are subject to forest department permits and availability — no guaranteed sightings.",
  "Maintain silence inside the park; flash photography of wildlife is prohibited.",
  "Plastic, alcohol, and loud music are strictly banned inside core forest zones.",
  "Wear earth-tone clothing (no bright colors) for safari rides.",
  "Park entry timings are fixed — late arrivals will not be permitted entry.",
];

interface PolicyMatcher {
  keywords: string[];
  policies: string[];
}

const MATCHERS: PolicyMatcher[] = [
  {
    keywords: ["spiti", "ladakh", "leh", "manali", "shimla", "kasol", "sissu", "lahaul", "kashmir", "himachal", "uttarakhand", "rishikesh", "kedarnath", "badrinath", "nainital", "mussoorie", "auli", "tawang", "sikkim", "darjeeling", "mountain", "trek", "himalaya"],
    policies: MOUNTAIN_POLICIES,
  },
  {
    keywords: ["goa", "guhagar", "tarkarli", "malvan", "alibaug", "gokarna", "varkala", "kovalam", "andaman", "lakshadweep", "pondicherry", "diu", "beach", "coast"],
    policies: BEACH_POLICIES,
  },
  {
    keywords: ["jaisalmer", "rann", "kutch", "jodhpur", "bikaner", "pushkar", "thar", "desert"],
    policies: DESERT_POLICIES,
  },
  {
    keywords: ["amritsar", "varanasi", "ayodhya", "mathura", "vrindavan", "tirupati", "shirdi", "haridwar", "golden temple", "temple", "spiritual", "pilgrimage"],
    policies: SPIRITUAL_POLICIES,
  },
  {
    keywords: ["rafting", "paragliding", "bungee", "trek", "adventure", "camping", "skiing", "sky diving"],
    policies: ADVENTURE_POLICIES,
  },
  {
    keywords: ["jim corbett", "ranthambore", "bandhavgarh", "kanha", "tadoba", "kaziranga", "sundarban", "gir", "wildlife", "safari", "national park"],
    policies: FOREST_POLICIES,
  },
];

/**
 * Returns a deduplicated, ordered list of policies based on trip name + locations.
 * Always includes STANDARD_POLICIES; adds region-specific ones based on keyword match.
 */
export const getDefaultPolicies = (tripName?: string | null, locations?: string[] | null): string[] => {
  const haystack = [tripName ?? "", ...(locations ?? [])].join(" ").toLowerCase();
  const matched: string[] = [];

  for (const m of MATCHERS) {
    if (m.keywords.some((kw) => haystack.includes(kw))) {
      matched.push(...m.policies);
    }
  }

  // Standard policies first, then region-specific (deduped, preserve order)
  const all = [...STANDARD_POLICIES, ...matched];
  return Array.from(new Set(all));
};

/**
 * Resolve the policies to display: prefer admin-saved ones, otherwise smart defaults.
 */
export const resolveTripPolicies = (
  adminPolicies: { items?: string[] } | null | undefined,
  tripName?: string | null,
  locations?: string[] | null,
): string[] => {
  const items = adminPolicies?.items;
  if (Array.isArray(items) && items.filter((s) => typeof s === "string" && s.trim()).length > 0) {
    return items.filter((s) => typeof s === "string" && s.trim());
  }
  return getDefaultPolicies(tripName, locations);
};
