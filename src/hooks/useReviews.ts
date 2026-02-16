import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Review {
  id: string;
  user_id: string;
  trip_id: string;
  booking_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  is_verified: boolean;
  is_visible: boolean;
  reviewer_name?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  breakdown: Record<number, number>; // 1-5 -> count
}

export const useReviews = (tripId?: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!tripId) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("trip_id", tripId)
      .eq("is_visible", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch reviewer names from profiles
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) ?? []);

      const enriched: Review[] = data.map((r) => ({
        ...r,
        reviewer_name: profileMap.get(r.user_id) || "Anonymous Traveler",
      }));

      setReviews(enriched);

      const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let total = 0;
      enriched.forEach((r) => {
        breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
        total += r.rating;
      });

      setStats({
        averageRating: enriched.length > 0 ? total / enriched.length : 0,
        totalReviews: enriched.length,
        breakdown,
      });
    }
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, stats, loading, refetch: fetchReviews };
};

export const useSubmitReview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async (tripId: string, bookingId: string, rating: number, reviewText: string) => {
    if (!user) {
      toast({ title: "Please log in", variant: "destructive" });
      return false;
    }

    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      trip_id: tripId,
      booking_id: bookingId,
      rating,
      review_text: reviewText || null,
    });

    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already Reviewed", description: "You've already reviewed this booking.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to submit review.", variant: "destructive" });
      }
      return false;
    }

    toast({ title: "Review Submitted!", description: "Thank you for your feedback." });
    return true;
  };

  return { submitReview, submitting };
};
