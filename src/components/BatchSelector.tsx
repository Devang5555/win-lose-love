import { useState, useEffect } from "react";
import { Calendar, AlertTriangle, CheckCircle, Bell, MessageCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/trips";
import { calculateDynamicPrice, DynamicPriceResult } from "@/lib/dynamicPricing";
import { autoShiftEmptyBatches } from "@/lib/autoShiftBatches";
import { autoDuplicateBatches } from "@/lib/autoDuplicateBatches";
import { getSeatStatus } from "@/lib/seatStatus";

export interface BatchInfo {
  id: string;
  batch_name: string;
  start_date: string;
  end_date: string;
  batch_size: number;
  available_seats: number;
  price_override: number | null;
  status: string;
  dynamicPrice?: DynamicPriceResult;
}

interface BatchSelectorProps {
  tripId: string;
  tripName?: string;
  basePrice: number;
  selectedBatchId: string | null;
  onSelectBatch: (batch: BatchInfo | null) => void;
}

const WHATSAPP_NUMBER = "919415026522";
const sendWhatsApp = (msg: string) => {
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const getSeatBadge = (capacity: number, seatsBooked: number, available: number) => {
  const status = getSeatStatus(capacity, seatsBooked);
  if (status.label) {
    return (
      <Badge className={`${status.className} font-semibold text-xs ${status.level === "low" ? "animate-pulse" : ""}`}>
        {status.label}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs font-medium">
      {available} seats available
    </Badge>
  );
};

const BatchSelector = ({ tripId, tripName, basePrice, selectedBatchId, onSelectBatch }: BatchSelectorProps) => {
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      setError(null);

      try { await autoShiftEmptyBatches(); } catch { /* non-fatal */ }
      try { await autoDuplicateBatches(); } catch { /* non-fatal */ }

      const { data, error: fetchError } = await supabase
        .from("batches")
        .select("id, batch_name, start_date, end_date, batch_size, available_seats, price_override, status")
        .eq("trip_id", tripId)
        .eq("status", "active")
        .order("start_date", { ascending: true });

      if (fetchError) {
        setError("Could not load departure dates. Please try again.");
        console.error("Batch fetch error:", fetchError);
      } else {
        const batchList: BatchInfo[] = (data || []).map((b) => {
          const availableSeats = b.available_seats ?? 0;
          const batchBasePrice = b.price_override ?? basePrice;
          const dp = calculateDynamicPrice(batchBasePrice, b.batch_size, availableSeats, b.start_date);
          return {
            ...b,
            available_seats: availableSeats,
            dynamicPrice: dp,
          };
        });
        setBatches(batchList);

        if (!selectedBatchId) {
          const firstAvailable = batchList.find((b) => b.available_seats > 0);
          if (firstAvailable) onSelectBatch(firstAvailable);
        }
      }

      setLoading(false);
    };

    fetchBatches();

    // Realtime subscription for batch updates from admin
    const channel = supabase
      .channel(`batches-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'batches',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          fetchBatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Departure Dates</p>
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="rounded-xl bg-muted p-4 text-center">
        <p className="text-sm text-muted-foreground">No departure dates available yet.</p>
      </div>
    );
  }

  const visibleBatches = showAll ? batches : batches.slice(0, 3);
  const hiddenCount = batches.length - visibleBatches.length;
  const allSoldOut = batches.every((b) => b.available_seats === 0);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        Select Departure
        {batches.length > 1 && (
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 h-4 ml-1">
            📅 Multiple Dates
          </Badge>
        )}
      </p>
      {visibleBatches.map((batch) => {
        const isSoldOut = batch.available_seats === 0;
        const isSelected = selectedBatchId === batch.id;
        const dp = batch.dynamicPrice!;

        return (
          <button
            key={batch.id}
            type="button"
            disabled={isSoldOut}
            onClick={() => onSelectBatch(batch)}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-300 ${
              isSoldOut
                ? "opacity-60 cursor-not-allowed border-border bg-muted"
                : isSelected
                ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20 scale-[1.02]"
                : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-semibold text-sm text-card-foreground flex items-center gap-2 flex-wrap">
                {isSelected && <CheckCircle className="w-4 h-4 text-primary animate-in zoom-in-50 duration-200" />}
                {batch.batch_name}
              </span>
              <div className="flex items-center gap-1.5">
                {getSeatBadge(batch.batch_size, Math.max(0, batch.batch_size - batch.available_seats), batch.available_seats)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(batch.start_date)} – {formatDate(batch.end_date)}
              </span>
              <span className="text-sm font-bold text-primary">
                {formatPrice(dp.effectivePrice)}
              </span>
            </div>
          </button>
        );
      })}

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:underline py-1"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Show {hiddenCount} more date{hiddenCount > 1 ? "s" : ""}
        </button>
      )}

      {allSoldOut && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 space-y-2">
          <p className="text-xs font-semibold text-destructive text-center">
            All current batches are sold out — next batch coming soon
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs"
              onClick={() =>
                sendWhatsApp(
                  `Hi GoBhraman 👋\n\nI'd like to *Join the Next Batch* for *${tripName ?? "this trip"}*. Please notify me when new dates open.`,
                )
              }
            >
              <Bell className="w-3.5 h-3.5 mr-1" /> Join Next Batch
            </Button>
            <Button
              size="sm"
              className="h-9 text-xs bg-[#25D366] hover:bg-[#25D366]/90 text-white"
              onClick={() =>
                sendWhatsApp(
                  `Hi GoBhraman 👋\n\nPlease add me to the *Waitlist* for *${tripName ?? "this trip"}*.`,
                )
              }
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1" /> Join Waitlist
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchSelector;
