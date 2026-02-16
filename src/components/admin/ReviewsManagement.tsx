import { useState, useEffect } from "react";
import { Star, Eye, EyeOff, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StarRating from "@/components/StarRating";

interface AdminReview {
  id: string;
  user_id: string;
  trip_id: string;
  booking_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  is_verified: boolean;
  is_visible: boolean;
}

const ReviewsManagement = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const toggleVisibility = async (review: AdminReview) => {
    const { error } = await supabase
      .from("reviews")
      .update({ is_visible: !review.is_visible })
      .eq("id", review.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update review", variant: "destructive" });
    } else {
      toast({ title: review.is_visible ? "Review Hidden" : "Review Approved" });
      fetchReviews();
    }
  };

  const filtered = reviews.filter((r) => {
    if (ratingFilter !== "all" && r.rating !== parseInt(ratingFilter)) return false;
    if (searchTerm && !r.trip_id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by trip..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => (
              <SelectItem key={r} value={String(r)}>{r} Star{r !== 1 ? "s" : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} review{filtered.length !== 1 ? "s" : ""}</p>

      <div className="space-y-3">
        {filtered.map((review) => (
          <div key={review.id} className={`p-4 bg-card border rounded-xl ${!review.is_visible ? "opacity-60 border-dashed" : "border-border"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground text-sm">{review.trip_id}</span>
                  <StarRating rating={review.rating} size="sm" />
                  {!review.is_visible && <Badge variant="outline" className="text-xs">Hidden</Badge>}
                </div>
                {review.review_text && (
                  <p className="text-sm text-muted-foreground mt-1">{review.review_text}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => toggleVisibility(review)}>
                {review.is_visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No reviews found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsManagement;
