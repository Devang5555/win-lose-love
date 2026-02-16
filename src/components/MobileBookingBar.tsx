import { useState, useEffect } from "react";
import { Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/data/trips";
import { BatchInfo } from "@/components/BatchSelector";

interface MobileBookingBarProps {
  price: number;
  originalPrice?: number;
  selectedBatch: BatchInfo | null;
  isBookable: boolean;
  loading: boolean;
  onBookNow: () => void;
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

const MobileBookingBar = ({
  price,
  originalPrice,
  selectedBatch,
  isBookable,
  loading,
  onBookNow,
}: MobileBookingBarProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show bar once user scrolls past ~50vh (hero section)
      const threshold = window.innerHeight * 0.5;
      setVisible(window.scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isBookable && !loading) return null;

  const seats = selectedBatch?.available_seats ?? 0;
  const isSoldOut = selectedBatch ? seats === 0 : false;

  const barClasses = `fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-300 ease-out ${
    visible ? "translate-y-0" : "translate-y-full"
  }`;

  if (loading) {
    return (
      <div className={barClasses}>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={barClasses}>
      <div className="flex items-center justify-between gap-3">
        {/* Left: Price & info */}
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-foreground leading-tight">
            {formatPrice(price)}
            <span className="text-xs font-normal text-muted-foreground ml-1">/person</span>
            {originalPrice && (
              <span className="text-xs font-normal text-muted-foreground line-through ml-1.5">
                {formatPrice(originalPrice)}
              </span>
            )}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {selectedBatch && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(selectedBatch.start_date)}
              </span>
            )}
            {selectedBatch && !isSoldOut && (
              <>
                {seats <= 3 ? (
                  <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-[10px] px-1.5 py-0 h-4 animate-pulse">
                    Only {seats} left
                  </Badge>
                ) : seats <= 10 ? (
                  <Badge className="bg-accent/15 text-accent border-accent/20 text-[10px] px-1.5 py-0 h-4">
                    Filling Fast
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {seats} seats
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: CTA */}
        <Button
          size="lg"
          disabled={isSoldOut}
          onClick={onBookNow}
          className="rounded-xl font-bold px-6 shadow-lg whitespace-nowrap"
        >
          {isSoldOut ? "Sold Out" : "Book Now"}
        </Button>
      </div>
    </div>
  );
};

export default MobileBookingBar;
