import { useEffect, useState } from "react";
import { Calendar, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getSeatStatus } from "@/lib/seatStatus";

interface SmartDateStripProps {
  tripId: string;
  tripName: string;
}

interface BatchRow {
  id: string;
  batch_name: string;
  start_date: string;
  end_date: string;
  batch_size: number;
  available_seats: number;
  seats_booked: number;
  status: string;
}

const WHATSAPP = "919415026522";

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const sendWhatsApp = (tripName: string, intent: string) => {
  const msg = `Hi GoBhraman 👋\n\nI'm interested in *${tripName}*.\nPreferred timing: ${intent}\n\nPlease share available departure dates & details.`;
  window.open(
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,
    "_blank",
  );
};

const QUICK_OPTIONS = [
  { key: "weekend", label: "This Weekend" },
  { key: "next-weekend", label: "Next Weekend" },
  { key: "later-month", label: "Later This Month" },
  { key: "flexible", label: "I'm Flexible" },
];

const SmartDateStrip = ({ tripId, tripName }: SmartDateStripProps) => {
  const [batches, setBatches] = useState<BatchRow[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("batches")
        .select("id, batch_name, start_date, end_date, batch_size, available_seats, seats_booked, status")
        .eq("trip_id", tripId)
        .eq("status", "active")
        .gte("start_date", new Date().toISOString().slice(0, 10))
        .order("start_date", { ascending: true })
        .limit(3);
      if (mounted) setBatches((data as BatchRow[]) || []);
    })();
    return () => { mounted = false; };
  }, [tripId]);

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 md:p-5 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm md:text-base">
          When do you want to travel?
        </h3>
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => sendWhatsApp(tripName, o.label)}
            className="px-3 py-1.5 text-xs md:text-sm rounded-full border border-border bg-background hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors font-medium"
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Upcoming batches scroll */}
      {batches.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 mb-3 snap-x">
          {batches.map((b) => {
            const status = getSeatStatus(b.batch_size, b.seats_booked);
            const soldOut = b.available_seats === 0;
            return (
              <button
                key={b.id}
                onClick={() =>
                  sendWhatsApp(
                    tripName,
                    soldOut
                      ? `Join Next Batch (after ${formatDate(b.start_date)})`
                      : `${formatDate(b.start_date)} – ${formatDate(b.end_date)}`,
                  )
                }
                className={`snap-start flex-shrink-0 min-w-[160px] text-left rounded-xl border-2 p-3 transition-all ${
                  soldOut
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-border bg-background hover:border-primary hover:shadow-md"
                }`}
              >
                <p className="text-xs text-muted-foreground mb-1">{b.batch_name}</p>
                <p className="font-semibold text-sm text-foreground">
                  {formatDate(b.start_date)} – {formatDate(b.end_date)}
                </p>
                {soldOut ? (
                  <Badge className="mt-2 bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
                    Sold Out – Next Batch Available
                  </Badge>
                ) : status.label ? (
                  <Badge className={`mt-2 text-[10px] ${status.className}`}>{status.label}</Badge>
                ) : (
                  <Badge className="mt-2 bg-primary/10 text-primary border-primary/20 text-[10px]">
                    <Sparkles className="w-2.5 h-2.5 mr-1" />
                    Seats Open
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
        onClick={() => sendWhatsApp(tripName, "Plan Your Own Date")}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Plan Your Own Date on WhatsApp
      </Button>
    </div>
  );
};

export default SmartDateStrip;
