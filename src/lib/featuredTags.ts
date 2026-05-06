// Homepage / curation flags stored inside the existing `tags[]` column on trips.
// Keeping them as tag strings means zero schema change and they remain filterable
// from any existing tag-based query.

export const FEATURED_TAGS = {
  featured: "featured",
  trending: "trending",
  womenOnly: "women-only",
  weekend: "weekend-special",
} as const;

export type FeaturedTagKey = keyof typeof FEATURED_TAGS;

export const FEATURED_TAG_LABELS: Record<FeaturedTagKey, string> = {
  featured: "⭐ Featured",
  trending: "🔥 Trending",
  womenOnly: "👩 Women-only",
  weekend: "🌴 Weekend Special",
};

export const ALL_FEATURED_TAGS = Object.values(FEATURED_TAGS) as string[];

export const hasFeaturedTag = (tags: string[] | null | undefined, key: FeaturedTagKey) =>
  !!tags?.includes(FEATURED_TAGS[key]);

export const toggleFeaturedTag = (tags: string[] | null | undefined, key: FeaturedTagKey) => {
  const tag = FEATURED_TAGS[key];
  const current = tags ?? [];
  return current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
};
