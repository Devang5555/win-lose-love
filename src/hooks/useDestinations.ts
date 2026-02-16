import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Destination {
  id: string;
  name: string;
  slug: string;
  state: string;
  description: string | null;
  hero_image: string | null;
  trip_count?: number;
}

export const useDestinations = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDestinations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("destinations")
        .select("*")
        .order("name");

      if (fetchError) throw fetchError;

      // Fetch trip counts per destination
      const { data: trips } = await supabase
        .from("trips")
        .select("destination_id")
        .eq("is_active", true);

      const countMap: Record<string, number> = {};
      trips?.forEach((t) => {
        if (t.destination_id) {
          countMap[t.destination_id] = (countMap[t.destination_id] || 0) + 1;
        }
      });

      const enriched: Destination[] = (data || []).map((d) => ({
        ...d,
        trip_count: countMap[d.id] || 0,
      }));

      setDestinations(enriched);
    } catch (err: any) {
      setError(err?.message || "Failed to load destinations");
      console.error("Error fetching destinations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const getDestinationBySlug = useCallback(
    (slug: string): Destination | undefined => {
      return destinations.find((d) => d.slug === slug);
    },
    [destinations]
  );

  const getDestinationsByState = useCallback((): Record<string, Destination[]> => {
    const grouped: Record<string, Destination[]> = {};
    destinations.forEach((d) => {
      if (!grouped[d.state]) grouped[d.state] = [];
      grouped[d.state].push(d);
    });
    return grouped;
  }, [destinations]);

  const getFeaturedDestinations = useCallback(
    (limit: number = 8): Destination[] => {
      return [...destinations]
        .sort((a, b) => (b.trip_count || 0) - (a.trip_count || 0))
        .slice(0, limit);
    },
    [destinations]
  );

  return {
    destinations,
    loading,
    error,
    getDestinationBySlug,
    getDestinationsByState,
    getFeaturedDestinations,
    refetch: fetchDestinations,
  };
};
