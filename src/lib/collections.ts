/**
 * Discovery Collections — rule-based filters over trips & experiences.
 * Each collection is computed client-side from existing trip metadata
 * (tags, duration, locations, category) — no extra DB columns.
 */

export interface CollectionDef {
  slug: string;
  title: string;
  subtitle: string;
  heroEmoji: string;
  /** returns true if a trip belongs to this collection */
  match: (trip: any) => boolean;
}

const has = (arr: string[] | undefined, needles: string[]) =>
  !!arr?.some((v) => needles.some((n) => v.toLowerCase().includes(n)));

const parseDays = (d?: string, fb?: number | null) => {
  if (fb && fb > 0) return fb;
  if (!d) return 1;
  const m = d.toLowerCase().match(/(\d+)\s*d/);
  return m ? parseInt(m[1]) : 1;
};

export const COLLECTIONS: CollectionDef[] = [
  {
    slug: "weekend-escapes",
    title: "Weekend Escapes",
    subtitle: "1–2 day getaways near the city",
    heroEmoji: "🌅",
    match: (t) => parseDays(t.duration, t.duration_days) <= 2,
  },
  {
    slug: "himalayan-treks",
    title: "Himalayan Treks",
    subtitle: "Mountain trails with certified leaders",
    heroEmoji: "🏔️",
    match: (t) =>
      has(t.tags, ["trek", "himalaya", "hike", "valley"]) ||
      has(t.locations, ["himachal", "uttarakhand", "ladakh", "sikkim", "kashmir"]),
  },
  {
    slug: "monsoon-magic",
    title: "Monsoon Magic",
    subtitle: "Lush waterfalls, misty hills, green trails",
    heroEmoji: "🌧️",
    match: (t) =>
      has(t.tags, ["monsoon", "waterfall", "rain", "green"]) ||
      has(t.locations, ["sahyadri", "lonavala", "bhandardara"]),
  },
  {
    slug: "camping-bonfire",
    title: "Camping & Bonfire Nights",
    subtitle: "Tents, stars, music and warm fires",
    heroEmoji: "🏕️",
    match: (t) =>
      t.experience_category === "camping" ||
      has(t.tags, ["camp", "bonfire", "tent", "lakeside"]),
  },
  {
    slug: "beach-coast",
    title: "Beach & Coastal",
    subtitle: "Konkan shores and turquoise getaways",
    heroEmoji: "🏝️",
    match: (t) =>
      has(t.tags, ["beach", "coast", "konkan", "island"]) ||
      has(t.locations, ["goa", "konkan", "andaman", "alibaug", "gokarna"]),
  },
  {
    slug: "long-journeys",
    title: "Long Journeys",
    subtitle: "5+ day deep-dives across India",
    heroEmoji: "🧭",
    match: (t) => parseDays(t.duration, t.duration_days) >= 5,
  },
];

export const getCollection = (slug: string) =>
  COLLECTIONS.find((c) => c.slug === slug);
