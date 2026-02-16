import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "@/components/StarRating";
import { useSubmitReview } from "@/hooks/useReviews";

interface ReviewFormProps {
  tripId: string;
  bookingId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const ReviewForm = ({ tripId, bookingId, onSuccess, onCancel }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const { submitReview, submitting } = useSubmitReview();

  const handleSubmit = async () => {
    if (rating === 0) return;
    const success = await submitReview(tripId, bookingId, rating, reviewText);
    if (success) onSuccess();
  };

  return (
    <div className="space-y-4 p-4 bg-card border border-border rounded-xl">
      <h4 className="font-serif font-semibold text-foreground">Write a Review</h4>
      <div>
        <p className="text-sm text-muted-foreground mb-2">Your Rating</p>
        <StarRating rating={rating} size="lg" interactive onRate={setRating} />
      </div>
      <Textarea
        placeholder="Share your experience (optional)"
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        rows={3}
      />
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={rating === 0 || submitting} size="sm">
          {submitting ? "Submitting..." : "Submit Review"}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ReviewForm;
