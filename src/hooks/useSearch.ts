import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  type: "trip" | "destination";
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  image?: string;
  price?: number;
}

export const useSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const pattern = `%${term}%`;

      const [tripsRes, destsRes] = await Promise.all([
        supabase
          .from("trips")
          .select("trip_id, trip_name, summary, images, price_default, slug")
          .eq("is_active", true)
          .or(`trip_name.ilike.${pattern},summary.ilike.${pattern}`)
          .limit(5),
        supabase
          .from("destinations")
          .select("id, name, slug, state, hero_image")
          .or(`name.ilike.${pattern},state.ilike.${pattern}`)
          .limit(5),
      ]);

      const tripResults: SearchResult[] = (tripsRes.data || []).map((t) => ({
        type: "trip" as const,
        id: t.trip_id,
        title: t.trip_name,
        subtitle: t.summary || "",
        slug: t.slug || t.trip_id,
        image: t.images?.[0] || undefined,
        price: t.price_default,
      }));

      const destResults: SearchResult[] = (destsRes.data || []).map((d) => ({
        type: "destination" as const,
        id: d.id,
        title: d.name,
        subtitle: d.state,
        slug: d.slug,
        image: d.hero_image || undefined,
      }));

      setResults([...tripResults, ...destResults]);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    (term: string) => {
      setQuery(term);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(term), 300);
    },
    [search]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
  }, []);

  return { query, results, loading, debouncedSearch, clearSearch, setQuery };
};
