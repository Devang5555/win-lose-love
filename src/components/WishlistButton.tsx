import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  tripId: string;
  currentPrice?: number;
  isSaved: boolean;
  isToggling: boolean;
  onToggle: (tripId: string, currentPrice?: number) => Promise<boolean>;
  className?: string;
  size?: "sm" | "md";
}

const WishlistButton = ({
  tripId,
  currentPrice,
  isSaved,
  isToggling,
  onToggle,
  className,
  size = "md",
}: WishlistButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to save trips to your wishlist.",
        variant: "destructive",
      });
      return;
    }

    const success = await onToggle(tripId, currentPrice);
    if (success) {
      toast({
        title: isSaved ? "Removed from Wishlist" : "Saved to Wishlist",
        description: isSaved
          ? "Trip removed from your wishlist."
          : "You'll be notified of price drops!",
      });
    }
  };

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const btnSize = size === "sm" ? "w-8 h-8" : "w-10 h-10";

  return (
    <button
      onClick={handleClick}
      disabled={isToggling}
      className={cn(
        "rounded-full flex items-center justify-center transition-all duration-200",
        "bg-background/80 backdrop-blur-sm hover:bg-background border border-border shadow-sm",
        "hover:scale-110 active:scale-95",
        btnSize,
        className
      )}
      aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
    >
      {isToggling ? (
        <Loader2 className={cn(iconSize, "animate-spin text-muted-foreground")} />
      ) : (
        <Heart
          className={cn(
            iconSize,
            "transition-colors duration-200",
            isSaved
              ? "fill-destructive text-destructive"
              : "text-muted-foreground hover:text-destructive"
          )}
        />
      )}
    </button>
  );
};

export default WishlistButton;
