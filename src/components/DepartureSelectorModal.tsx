import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  Users,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Flame,
  Star,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DepartureSlot {
  id: string;
  batch_name: string;
  start_date: string; // ISO yyyy-mm-dd
  end_date: string;
  batch_size: number;
  seats_booked: number;
  price?: number;
  tag?: string | null; // optional marketing tag
}

interface DepartureSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripName: string;
  image?: string;
  duration?: string;
  pickup?: string;
  price: number;
  slots: DepartureSlot[];
  selectedSlotId: string | null;
  onSelectSlot: (slotId: string) => void;
  onContinue: () => void;
  timeline?: string[]; // e.g. ["Fri Night Departure","Sat Experience","Sun Return"]
  difficulty?: string;
}

type Level = "available" | "filling" | "almost" | "sold" | "special";

const seatLevel = (seatsLeft: number, capacity: number, special?: boolean): Level => {
  if (special) return "special";
  if (seatsLeft <= 0) return "sold";
  const ratio = seatsLeft / Math.max(1, capacity);
  if (ratio <= 0.15) return "almost";
  if (ratio <= 0.4) return "filling";
  return "available";
};

const levelStyles: Record<Level, { dot: string; ring: string; soft: string; label: string }> = {
  available: {
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/40 border-emerald-500/40 bg-emerald-500/5",
    soft: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    label: "Available",
  },
  filling: {
    dot: "bg-orange-500",
    ring: "ring-orange-500/40 border-orange-500/40 bg-orange-500/5",
    soft: "text-orange-600 bg-orange-500/10 border-orange-500/20",
    label: "Fast Filling",
  },
  almost: {
    dot: "bg-rose-500",
    ring: "ring-rose-500/40 border-rose-500/40 bg-rose-500/5",
    soft: "text-rose-600 bg-rose-500/10 border-rose-500/20",
    label: "Almost Full",
  },
  sold: {
    dot: "bg-muted-foreground/40",
    ring: "border-border bg-muted",
    soft: "text-muted-foreground bg-muted border-border",
    label: "Sold Out",
  },
  special: {
    dot: "bg-violet-500",
    ring: "ring-violet-500/40 border-violet-500/40 bg-violet-500/5",
    soft: "text-violet-600 bg-violet-500/10 border-violet-500/20",
    label: "Special Departure",
  },
};

const fmtShort = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtWeekday = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { weekday: "short" });

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

const DepartureSelectorModal = ({
  isOpen,
  onClose,
  tripName,
  image,
  duration,
  pickup,
  price,
  slots,
  selectedSlotId,
  onSelectSlot,
  onContinue,
  timeline,
  difficulty,
}: DepartureSelectorModalProps) => {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // index slots by yyyy-mm-dd
  const slotByDate = useMemo(() => {
    const m = new Map<string, DepartureSlot>();
    slots.forEach((s) => m.set(s.start_date, s));
    return m;
  }, [slots]);

  // upcoming sorted
  const upcoming = useMemo(
    () =>
      [...slots]
        .filter((s) => new Date(s.start_date) >= today)
        .sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [slots, today],
  );

  // most booked id
  const popularId = useMemo(() => {
    let best: DepartureSlot | null = null;
    let score = -1;
    for (const s of upcoming) {
      const booked = s.batch_size - (s.batch_size - s.seats_booked);
      if (booked > score && s.seats_booked < s.batch_size) {
        score = booked;
        best = s;
      }
    }
    return best?.id ?? null;
  }, [upcoming]);

  // cheapest id
  const cheapestId = useMemo(() => {
    let best: DepartureSlot | null = null;
    for (const s of upcoming) {
      if (s.price == null) continue;
      if (!best || (best.price ?? Infinity) > (s.price ?? Infinity)) best = s;
    }
    return best?.id ?? null;
  }, [upcoming]);

  // calendar month state — start at first upcoming month
  const firstMonth = upcoming[0] ? new Date(upcoming[0].start_date) : new Date();
  firstMonth.setDate(1);
  const [cursor, setCursor] = useState<Date>(firstMonth);

  const monthDays = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ date: Date | null; key: string }> = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, key: `e-${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      cells.push({ date, key: date.toISOString() });
    }
    return cells;
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? null;
  const selectedLevel = selectedSlot
    ? seatLevel(
        Math.max(0, selectedSlot.batch_size - selectedSlot.seats_booked),
        selectedSlot.batch_size,
      )
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl md:rounded-3xl gap-0 max-h-[95vh] flex flex-col sm:flex-row">
        {/* LEFT: Trip summary */}
        <aside className="relative w-full sm:w-[280px] md:w-[320px] flex-shrink-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 sm:border-r border-border/50">
          <div className="relative h-40 sm:h-56 overflow-hidden">
            <img
              src={image || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"}
              alt={tripName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />
            <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-md text-foreground border border-border/50 shadow">
              <Sparkles className="w-3 h-3 mr-1 text-primary" /> Premium
            </Badge>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground leading-tight">
                {tripName}
              </h2>
            </div>

            <div className="space-y-2.5 text-sm">
              {duration && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{duration}</span>
                </div>
              )}
              {pickup && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span>{pickup}</span>
                </div>
              )}
              {difficulty && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>{difficulty}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4 text-forest" />
                <span>
                  {upcoming.reduce((acc, s) => acc + Math.max(0, s.batch_size - s.seats_booked), 0)}{" "}
                  seats across {upcoming.length} departures
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-3 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Starting from
              </p>
              <p className="font-serif text-2xl font-bold text-primary leading-none mt-1">
                ₹{price.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">per person · taxes incl.</p>
            </div>
          </div>
        </aside>

        {/* RIGHT: Selector */}
        <div className="flex-1 flex flex-col min-h-0">
          <header className="px-5 pt-5 pb-3 border-b border-border/50">
            <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Choose your departure
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pick a date that fits your plan. Live seat availability.
            </p>
          </header>

          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
            {/* Upcoming strip */}
            {upcoming.length > 0 && (
              <section>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                  Upcoming Departures
                </p>
                <div className="-mx-1 px-1 flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-1.5 scroll-smooth">
                  {upcoming.slice(0, 8).map((s) => {
                    const seatsLeft = Math.max(0, s.batch_size - s.seats_booked);
                    const lvl = seatLevel(seatsLeft, s.batch_size);
                    const isSelected = selectedSlotId === s.id;
                    const sl = levelStyles[lvl];
                    const date = new Date(s.start_date);
                    const tags: string[] = [];
                    if (s.id === popularId) tags.push("Most Popular");
                    else if (s.id === cheapestId) tags.push("Best Price");
                    else if (isWeekend(date)) tags.push("Weekend Batch");

                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={lvl === "sold"}
                        onClick={() => onSelectSlot(s.id)}
                        className={cn(
                          "snap-start flex-shrink-0 min-w-[140px] text-left rounded-2xl border p-3 transition-all duration-300 relative",
                          lvl === "sold"
                            ? "opacity-50 cursor-not-allowed bg-muted border-border"
                            : isSelected
                            ? `${sl.ring} ring-2 shadow-[0_8px_24px_-10px_hsl(var(--primary)/0.5)] scale-[1.02]`
                            : "border-border/60 bg-card hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md",
                        )}
                      >
                        {tags[0] && (
                          <Badge
                            className={cn(
                              "text-[9px] px-1.5 py-0 h-4 mb-1.5 font-semibold border",
                              tags[0] === "Most Popular" &&
                                "bg-orange-500/10 text-orange-600 border-orange-500/30",
                              tags[0] === "Best Price" &&
                                "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
                              tags[0] === "Weekend Batch" &&
                                "bg-blue-500/10 text-blue-600 border-blue-500/30",
                            )}
                          >
                            {tags[0] === "Most Popular" && "🔥 "}
                            {tags[0] === "Best Price" && "💎 "}
                            {tags[0] === "Weekend Batch" && "🌤 "}
                            {tags[0]}
                          </Badge>
                        )}
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          {fmtWeekday(s.start_date)}
                        </p>
                        <p className="text-base font-bold text-foreground leading-tight">
                          {fmtShort(s.start_date)}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full", sl.dot)} />
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {lvl === "sold" ? "Sold Out" : `${seatsLeft} left`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Calendar */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Calendar view
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-full"
                    onClick={() =>
                      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                    }
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-semibold text-foreground min-w-[110px] text-center">
                    {monthLabel}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-full"
                    onClick={() =>
                      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                    }
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {monthDays.map(({ date, key }) => {
                  if (!date) return <div key={key} className="aspect-square" />;
                  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
                    2,
                    "0",
                  )}-${String(date.getDate()).padStart(2, "0")}`;
                  const s = slotByDate.get(iso);
                  const past = date < today;
                  const weekend = isWeekend(date);

                  if (!s) {
                    return (
                      <div
                        key={key}
                        className={cn(
                          "aspect-square rounded-lg flex items-center justify-center text-xs",
                          past
                            ? "text-muted-foreground/30"
                            : weekend
                            ? "text-foreground/70 bg-muted/40"
                            : "text-foreground/60",
                        )}
                      >
                        {date.getDate()}
                      </div>
                    );
                  }
                  const seatsLeft = Math.max(0, s.batch_size - s.seats_booked);
                  const lvl = seatLevel(seatsLeft, s.batch_size, s.tag === "special");
                  const sl = levelStyles[lvl];
                  const isSelected = selectedSlotId === s.id;

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={lvl === "sold"}
                      onClick={() => onSelectSlot(s.id)}
                      title={`${seatsLeft} seats left`}
                      className={cn(
                        "aspect-square rounded-lg border text-xs font-semibold flex flex-col items-center justify-center transition-all relative",
                        sl.ring,
                        isSelected &&
                          "ring-2 ring-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)] scale-[1.04]",
                        lvl !== "sold" && "hover:-translate-y-0.5 hover:shadow",
                      )}
                    >
                      <span className="text-foreground leading-none">{date.getDate()}</span>
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full mt-1",
                          sl.dot,
                          lvl !== "sold" && "animate-pulse",
                        )}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                {(["available", "filling", "almost", "sold", "special"] as Level[]).map((l) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full", levelStyles[l].dot)} />
                    {levelStyles[l].label}
                  </div>
                ))}
              </div>
            </section>

            {/* Selected detail + timeline */}
            {selectedSlot && selectedLevel && (
              <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                      You picked
                    </p>
                    <p className="font-serif text-lg font-bold text-foreground">
                      {fmtWeekday(selectedSlot.start_date)}, {fmtShort(selectedSlot.start_date)} →{" "}
                      {fmtShort(selectedSlot.end_date)}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "border font-semibold",
                      levelStyles[selectedLevel].soft,
                    )}
                  >
                    {levelStyles[selectedLevel].label}
                  </Badge>
                </div>

                {timeline && timeline.length > 0 && (
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs">
                    {timeline.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 sm:gap-3">
                        <div className="px-3 py-1.5 rounded-full bg-background border border-border/60 shadow-sm font-medium text-foreground">
                          {step}
                        </div>
                        {i < timeline.length - 1 && (
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            <p className="text-center text-[11px] text-muted-foreground pt-1">
              <Star className="w-3 h-3 inline -mt-0.5 mr-1 text-amber-500" />
              Flexible dates? Message us on WhatsApp and we'll customise a private batch.
            </p>
          </div>

          {/* Sticky footer */}
          <footer className="px-5 py-3 border-t border-border/50 bg-background/80 backdrop-blur-md flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              {selectedSlot ? (
                <>
                  <span className="font-semibold text-foreground">
                    ₹{(selectedSlot.price ?? price).toLocaleString("en-IN")}
                  </span>{" "}
                  · {fmtShort(selectedSlot.start_date)}
                </>
              ) : (
                "Pick a date to continue"
              )}
            </div>
            <Button
              onClick={onContinue}
              disabled={!selectedSlot || selectedLevel === "sold"}
              className="font-semibold px-5 shadow-lg shadow-primary/30"
            >
              Continue Booking
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepartureSelectorModal;
