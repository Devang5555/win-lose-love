import { useMemo } from "react";
import { Flame, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveSignalsProps {
  tripId: string;
  /** Total seats booked across active batches (real signal). */
  seatsBooked?: number;
  className?: string;
}

/**
 * Subtle social-proof strip:
 *  - "X travelers booked recently" — real, derived from batch seats_booked when available
 *  - "Y viewing now" — deterministic per tripId so it stays stable on rerender
 *
 * Stays hidden when there's no meaningful signal (no bookings + nothing to show).
 */
const hashSeed = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const LiveSignals = ({ tripId, seatsBooked = 0, className }: LiveSignalsProps) => {
  const viewing = useMemo(() => {
    const seed = hashSeed(tripId);
    // Stable 4-18 range derived from tripId — no flicker
    return 4 + (seed % 15);
  }, [tripId]);

  if (seatsBooked <= 0 && viewing <= 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-xs", className)}>
      {seatsBooked > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 font-medium">
          <Flame className="w-3 h-3" />
          {seatsBooked} traveler{seatsBooked === 1 ? "" : "s"} booked
        </span>
      )}
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
        <Eye className="w-3 h-3" />
        <span className="relative flex h-1.5 w-1.5 mr-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
        </span>
        {viewing} viewing now
      </span>
    </div>
  );
};

export default LiveSignals;
