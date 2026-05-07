import { useMemo } from "react";
import { CheckCircle2, Flame, Sparkles, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/data/trips";
import { getSeatStatus } from "@/lib/seatStatus";
import type { BatchInfo } from "@/components/BatchSelector";

interface DepartureStripProps {
  batches: BatchInfo[];
  selectedBatchId: string | null;
  onSelectBatch: (b: BatchInfo) => void;
  /** Limit visible upcoming batches (default 5) */
  limit?: number;
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const fmtWeekday = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { weekday: "short" });

interface SmartBadge {
  label: string;
  className: string;
  icon?: React.ReactNode;
}

const computeSmartBadge = (b: BatchInfo, mostBookedId: string | null): SmartBadge | null => {
  const start = new Date(b.start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((start.getTime() - today.getTime()) / 86400000);
  const day = start.getDay(); // 0=Sun, 6=Sat

  if (b.id === mostBookedId && b.available_seats > 0) {
    return {
      label: "🔥 Most Booked",
      className: "bg-orange-500/15 text-orange-600 border-orange-500/30",
    };
  }
  if (diffDays >= 0 && diffDays <= 7 && (day === 0 || day === 6 || day === 5)) {
    return {
      label: "🌤 This Weekend",
      className: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    };
  }
  // New batch (created in last 3 days) — using id heuristic skipped; fallback to 'New'
  return null;
};

const DepartureStrip = ({ batches, selectedBatchId, onSelectBatch, limit = 5 }: DepartureStripProps) => {
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return batches
      .filter((b) => b.start_date >= today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .slice(0, limit);
  }, [batches, limit]);

  const mostBookedId = useMemo(() => {
    let best: BatchInfo | null = null;
    let bestScore = -1;
    for (const b of upcoming) {
      const booked = Math.max(0, b.batch_size - b.available_seats);
      if (booked > bestScore && b.available_seats > 0) {
        bestScore = booked;
        best = b;
      }
    }
    return best?.id ?? null;
  }, [upcoming]);

  if (upcoming.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <CalendarDays className="w-4 h-4 text-primary" />
        Choose Your Departure
      </p>

      <div className="-mx-1 px-1 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scroll-smooth">
        {upcoming.map((batch) => {
          const isSelected = selectedBatchId === batch.id;
          const seatsBooked = Math.max(0, batch.batch_size - batch.available_seats);
          const seatStatus = getSeatStatus(batch.batch_size, seatsBooked);
          const isSoldOut = batch.available_seats === 0;
          const smart = computeSmartBadge(batch, mostBookedId);
          const dp = batch.dynamicPrice;

          return (
            <button
              key={batch.id}
              type="button"
              disabled={isSoldOut}
              onClick={() => onSelectBatch(batch)}
              className={`snap-start flex-shrink-0 min-w-[180px] max-w-[200px] text-left rounded-2xl border p-4 transition-all duration-300 relative ${
                isSoldOut
                  ? "opacity-50 cursor-not-allowed border-border bg-muted"
                  : isSelected
                  ? "border-primary bg-primary/5 shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.4)] ring-2 ring-primary/30 scale-[1.02]"
                  : "border-border/60 bg-card hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
              }`}
            >
              {isSelected && (
                <CheckCircle2 className="w-4 h-4 text-primary absolute top-2 right-2 animate-in zoom-in-50" />
              )}

              {smart && (
                <Badge className={`${smart.className} text-[9px] px-1.5 py-0 h-4 mb-2 font-semibold border`}>
                  {smart.label}
                </Badge>
              )}

              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {fmtWeekday(batch.start_date)}
              </p>
              <p className="text-lg font-bold text-foreground leading-tight">
                {fmt(batch.start_date)}
              </p>
              <p className="text-[11px] text-muted-foreground mb-2">
                → {fmt(batch.end_date)}
              </p>

              {seatStatus.label ? (
                <Badge className={`${seatStatus.className} text-[10px] px-1.5 py-0 h-4 mb-2 border`}>
                  {seatStatus.label}
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] px-1.5 py-0 h-4 mb-2 border">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                  {batch.available_seats} seats
                </Badge>
              )}

              {dp && (
                <p className="text-sm font-bold text-primary mt-1">
                  {formatPrice(dp.effectivePrice)}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DepartureStrip;
