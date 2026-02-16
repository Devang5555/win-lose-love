import { useState, useEffect } from "react";
import { Calendar, Users, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/trips";

export interface BatchInfo {
  id: string;
  batch_name: string;
  start_date: string;
  end_date: string;
  available_seats: number;
  price_override: number | null;
  status: string;
}

interface BatchSelectorProps {
  tripId: string;
  basePrice: number;
  selectedBatchId: string | null;
  onSelectBatch: (batch: BatchInfo | null) => void;
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const getSeatBadge = (seats: number) => {
  if (seats === 0) {
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-semibold text-xs">
        Sold Out
      </Badge>
    );
  }
  if (seats <= 3) {
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-semibold text-xs animate-pulse">
        Only {seats} seat{seats !== 1 ? "s" : ""} left
      </Badge>
    );
  }
  if (seats <= 10) {
    return (
      <Badge className="bg-accent/10 text-accent border-accent/20 font-semibold text-xs">
        Filling Fast · {seats} seats
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs font-medium">
      {seats} seats available
    </Badge>
  );
};

const BatchSelector = ({ tripId, basePrice, selectedBatchId, onSelectBatch }: BatchSelectorProps) => {
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("batches")
        .select("id, batch_name, start_date, end_date, available_seats, price_override, status")
        .eq("trip_id", tripId)
        .eq("status", "active")
        .order("start_date", { ascending: true });

      if (fetchError) {
        setError("Could not load departure dates. Please try again.");
        console.error("Batch fetch error:", fetchError);
      } else {
        const batchList = (data || []).map((b) => ({
          ...b,
          available_seats: b.available_seats ?? 0,
        }));
        setBatches(batchList);

        // Auto-select first available batch if none selected
        if (!selectedBatchId) {
          const firstAvailable = batchList.find((b) => b.available_seats > 0);
          if (firstAvailable) onSelectBatch(firstAvailable);
        }
      }

      setLoading(false);
    };

    fetchBatches();
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

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        Select Departure
      </p>
      {batches.map((batch) => {
        const isSoldOut = batch.available_seats === 0;
        const isSelected = selectedBatchId === batch.id;
        const price = batch.price_override ?? basePrice;

        return (
          <button
            key={batch.id}
            type="button"
            disabled={isSoldOut}
            onClick={() => onSelectBatch(batch)}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
              isSoldOut
                ? "opacity-50 cursor-not-allowed border-border bg-muted"
                : isSelected
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-semibold text-sm text-card-foreground">
                {batch.batch_name}
              </span>
              {getSeatBadge(batch.available_seats)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(batch.start_date)} – {formatDate(batch.end_date)}
              </span>
              <span className="text-sm font-bold text-primary">
                {formatPrice(price)}
              </span>
            </div>
            {!isSoldOut && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {batch.available_seats} seat{batch.available_seats !== 1 ? "s" : ""} remaining
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default BatchSelector;
