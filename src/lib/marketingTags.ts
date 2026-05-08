// Manual urgency / marketing chips applied by Admin.
// Stored as prefixed strings inside existing `tags[]` (trips, experiences) and
// inside `batches.marketing_tags[]` — zero schema change for trips/experiences.

export const MARKETING_TAG_PREFIX = "mkt:";

export type MarketingTagKey =
  | "filling-fast"
  | "last-few-seats"
  | "almost-sold-out"
  | "trending"
  | "most-booked"
  | "new-batch"
  | "popular"
  | "early-access"
  | "limited-seats"
  | "every-weekend";

interface MarketingTagDef {
  key: MarketingTagKey;
  label: string;
  /** Tailwind class using semantic tokens only. */
  className: string;
}

export const MARKETING_TAGS: MarketingTagDef[] = [
  { key: "filling-fast",     label: "🔥 Filling Fast",         className: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
  { key: "last-few-seats",   label: "⚡ Last Few Seats",       className: "bg-destructive/10 text-destructive border-destructive/30" },
  { key: "almost-sold-out",  label: "⏳ Almost Sold Out",      className: "bg-destructive/10 text-destructive border-destructive/30" },
  { key: "trending",         label: "📈 Trending",             className: "bg-primary/10 text-primary border-primary/30" },
  { key: "most-booked",      label: "⭐ Most Booked",          className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  { key: "new-batch",        label: "✨ New Batch",            className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  { key: "popular",          label: "💖 Popular",              className: "bg-pink-500/10 text-pink-600 border-pink-500/30" },
  { key: "early-access",     label: "🚀 Early Access",         className: "bg-violet-500/10 text-violet-600 border-violet-500/30" },
  { key: "limited-seats",    label: "🎟 Limited Seats",        className: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
  { key: "every-weekend",    label: "🌴 Available Every Weekend", className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
];

export const MAX_ACTIVE_MARKETING_TAGS = 2;

const isMktTag = (s: string) => s.startsWith(MARKETING_TAG_PREFIX);

export const getMarketingTagKeys = (tags: string[] | null | undefined): MarketingTagKey[] => {
  if (!tags?.length) return [];
  return tags
    .filter(isMktTag)
    .map((t) => t.slice(MARKETING_TAG_PREFIX.length) as MarketingTagKey)
    .filter((k) => MARKETING_TAGS.some((d) => d.key === k));
};

export const getMarketingTagDefs = (tags: string[] | null | undefined): MarketingTagDef[] =>
  getMarketingTagKeys(tags)
    .slice(0, MAX_ACTIVE_MARKETING_TAGS)
    .map((k) => MARKETING_TAGS.find((d) => d.key === k)!)
    .filter(Boolean);

/** Returns a new tag array with the marketing-tag set replaced by `selected`. Caps at MAX. */
export const setMarketingTags = (
  tags: string[] | null | undefined,
  selected: MarketingTagKey[]
): string[] => {
  const base = (tags ?? []).filter((t) => !isMktTag(t));
  const capped = selected.slice(0, MAX_ACTIVE_MARKETING_TAGS);
  return [...base, ...capped.map((k) => `${MARKETING_TAG_PREFIX}${k}`)];
};

export const toggleMarketingTagKey = (
  current: MarketingTagKey[],
  key: MarketingTagKey
): MarketingTagKey[] => {
  if (current.includes(key)) return current.filter((k) => k !== key);
  if (current.length >= MAX_ACTIVE_MARKETING_TAGS) {
    // replace the oldest
    return [...current.slice(1), key];
  }
  return [...current, key];
};
