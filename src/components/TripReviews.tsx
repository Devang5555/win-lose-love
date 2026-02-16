import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import StarRating from "@/components/StarRating";
import { useReviews, ReviewStats, Review } from "@/hooks/useReviews";

interface TripReviewsProps {
  tripId: string;
}

const ReviewCard = ({ review }: { review: Review }) => (
  <div className="p-4 bg-card border border-border rounded-xl">
    <div className="flex items-center justify-between mb-2">
      <div>
        <p className="font-medium text-foreground text-sm">{review.reviewer_name}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      <StarRating rating={review.rating} size="sm" />
    </div>
    {review.review_text && (
      <p className="text-sm text-muted-foreground mt-2">{review.review_text}</p>
    )}
  </div>
);

const RatingBreakdown = ({ stats }: { stats: ReviewStats }) => (
  <div className="space-y-2">
    {[5, 4, 3, 2, 1].map((star) => {
      const count = stats.breakdown[star] || 0;
      const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
      return (
        <div key={star} className="flex items-center gap-2 text-sm">
          <span className="w-8 text-muted-foreground">{star}★</span>
          <Progress value={pct} className="flex-1 h-2" />
          <span className="w-6 text-right text-muted-foreground">{count}</span>
        </div>
      );
    })}
  </div>
);

const TripReviews = ({ tripId }: TripReviewsProps) => {
  const { reviews, stats, loading } = useReviews(tripId);
  const [showAll, setShowAll] = useState(false);

  if (loading) return null;
  if (stats.totalReviews === 0) return null;

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <div className="mb-8">
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
        <MessageSquare className="w-7 h-7 text-primary" />
        Traveler Reviews
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Summary */}
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-4xl font-bold text-primary">{stats.averageRating.toFixed(1)}</p>
          <StarRating rating={Math.round(stats.averageRating)} size="md" />
          <p className="text-sm text-muted-foreground mt-1">{stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}</p>
        </div>
        {/* Breakdown */}
        <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
          <RatingBreakdown stats={stats} />
        </div>
      </div>

      {/* Review Cards */}
      <div className="space-y-3">
        {displayedReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {reviews.length > 3 && (
        <div className="text-center mt-4">
          <Button variant="outline" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Show Less" : `View All ${reviews.length} Reviews`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TripReviews;
export { RatingBreakdown, ReviewCard };
