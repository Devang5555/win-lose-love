import { useEffect, useMemo, useState } from "react";
import { Flame, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface LiveSignalsProps {
  tripId: string;
  className?: string;
}

/**
 * Subtle social-proof strip:
 *  - "X travelers booked" — real, summed from active batch seats_booked
 *  - "Y viewing now" — deterministic per tripId so it stays stable on rerender
 *
 * Lightweight one-time read; fails silently if RLS or network blocks it.
 */
const hashSeed = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const LiveSignals = ({ tripId, className }: LiveSignalsProps) => {
  const [booked, setBooked] = useState(0);

  const viewing = useMemo(() => {
    const seed = hashSeed(tripId);
    return 4 + (seed % 15); // stable 4-18
  }, [tripId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("batches")
          .select("seats_booked, status")
          .eq("trip_id", tripId);
        if (cancelled || error || !data) return;
        const total = data
          .filter((b) => !b.status || b.status === "active" || b.status === "upcoming")
          .reduce((sum, b) => sum + (b.seats_booked || 0), 0);
        setBooked(total);
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2 text-xs", className)}>
      {booked > 0 && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 font-medium">
          <Flame className="w-3 h-3" />
          {booked} traveler{booked === 1 ? "" : "s"} booked
        </span>
      )}
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
        </span>
        <Eye className="w-3 h-3" />
        {viewing} viewing now
      </span>
    </div>
  );
};

export default LiveSignals;
