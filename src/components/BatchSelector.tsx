import { useState, useEffect } from "react";
import { AlertTriangle, Bell, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { calculateDynamicPrice, DynamicPriceResult } from "@/lib/dynamicPricing";
import { autoShiftEmptyBatches } from "@/lib/autoShiftBatches";
import { autoDuplicateBatches } from "@/lib/autoDuplicateBatches";
import DepartureStrip from "@/components/DepartureStrip";

export interface BatchInfo {
  id: string;
  batch_name: string;
  start_date: string;
  end_date: string;
  batch_size: number;
  available_seats: number;
  price_override: number | null;
  status: string;
  marketing_tags?: string[] | null;
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
const BatchSelector = ({ tripId, tripName, basePrice, selectedBatchId, onSelectBatch }: BatchSelectorProps) => {
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      setError(null);

      try { await autoShiftEmptyBatches(); } catch { /* non-fatal */ }
      try { await autoDuplicateBatches(); } catch { /* non-fatal */ }

      const { data, error: fetchError } = await supabase
        .from("batches")
        .select("id, batch_name, start_date, end_date, batch_size, available_seats, price_override, status, marketing_tags")
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

    const channel = supabase
      .channel(`batches-${tripId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'batches', filter: `trip_id=eq.${tripId}` },
        () => { fetchBatches(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tripId]);

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Upcoming Departures</p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-[180px] flex-shrink-0 rounded-2xl" />
          ))}
        </div>
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

  const allSoldOut = batches.every((b) => b.available_seats === 0);

  return (
    <div className="space-y-3">
      <DepartureStrip
        batches={batches}
        selectedBatchId={selectedBatchId}
        onSelectBatch={onSelectBatch}
      />

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
