import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface WishlistItem {
  id: string;
  user_id: string;
  trip_id: string;
  price_at_save: number | null;
  created_at: string;
}

export const useWishlist = () => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("wishlist")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setWishlist(data as WishlistItem[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = useCallback(
    (tripId: string): boolean => {
      return wishlist.some((w) => w.trip_id === tripId);
    },
    [wishlist]
  );

  const isToggling = useCallback(
    (tripId: string): boolean => {
      return togglingIds.has(tripId);
    },
    [togglingIds]
  );

  const toggleWishlist = useCallback(
    async (tripId: string, currentPrice?: number) => {
      if (!user) return false;

      setTogglingIds((prev) => new Set(prev).add(tripId));

      try {
        const existing = wishlist.find((w) => w.trip_id === tripId);

        if (existing) {
          const { error } = await supabase
            .from("wishlist")
            .delete()
            .eq("id", existing.id);
          if (error) throw error;
          setWishlist((prev) => prev.filter((w) => w.id !== existing.id));
        } else {
          const { data, error } = await supabase
            .from("wishlist")
            .insert({
              user_id: user.id,
              trip_id: tripId,
              price_at_save: currentPrice ?? null,
            })
            .select()
            .single();
          if (error) throw error;
          setWishlist((prev) => [data as WishlistItem, ...prev]);
        }
        return true;
      } catch (err) {
        console.error("Wishlist toggle error:", err);
        return false;
      } finally {
        setTogglingIds((prev) => {
          const next = new Set(prev);
          next.delete(tripId);
          return next;
        });
      }
    },
    [user, wishlist]
  );

  /** Check if price dropped since user saved the trip */
  const hasPriceDropped = useCallback(
    (tripId: string, currentPrice: number): boolean => {
      const item = wishlist.find((w) => w.trip_id === tripId);
      if (!item || item.price_at_save === null) return false;
      return currentPrice < item.price_at_save;
    },
    [wishlist]
  );

  const getSavedPrice = useCallback(
    (tripId: string): number | null => {
      const item = wishlist.find((w) => w.trip_id === tripId);
      return item?.price_at_save ?? null;
    },
    [wishlist]
  );

  return {
    wishlist,
    loading,
    isInWishlist,
    isToggling,
    toggleWishlist,
    hasPriceDropped,
    getSavedPrice,
    refetch: fetchWishlist,
  };
};

export default useWishlist;
