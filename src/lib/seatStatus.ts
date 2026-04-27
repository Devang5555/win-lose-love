// Shared "filling fast" / "only X left" / "sold out" status used across cards & detail pages.
// Reuses existing batch fields: capacity (batch_size) + seats_booked.

export type SeatStatusLevel = "sold_out" | "low" | "filling_fast" | "available" | "unknown";

export interface SeatStatus {
  level: SeatStatusLevel;
  remaining: number;
  capacity: number;
  /** Short label shown on cards / next to price. Empty string when nothing to show. */
  label: string;
  /** Tailwind classes for inline badge styling. */
  className: string;
}

const EMPTY: SeatStatus = {
  level: "unknown",
  remaining: 0,
  capacity: 0,
  label: "",
  className: "",
};

/**
 * Compute a display status from raw capacity + bookings.
 *
 * Rules (per spec):
 *  - remaining === 0   → ❌ Sold Out
 *  - remaining <= 5    → ⚠️ Only X seats left
 *  - booked/cap >= 0.7 → 🔥 Filling Fast
 *  - else              → no badge
 */
export const getSeatStatus = (capacity?: number | null, seatsBooked?: number | null): SeatStatus => {
  if (!capacity || capacity <= 0) return EMPTY;
  const booked = Math.max(0, seatsBooked ?? 0);
  const remaining = Math.max(0, capacity - booked);

  if (remaining === 0) {
    return {
      level: "sold_out",
      remaining,
      capacity,
      label: "❌ Sold Out",
      className: "bg-destructive/10 text-destructive border-destructive/20",
    };
  }

  if (remaining <= 5) {
    return {
      level: "low",
      remaining,
      capacity,
      label: `⚠️ Only ${remaining} seat${remaining === 1 ? "" : "s"} left`,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    };
  }

  if (booked / capacity >= 0.7) {
    return {
      level: "filling_fast",
      remaining,
      capacity,
      label: "🔥 Filling Fast",
      className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    };
  }

  return { level: "available", remaining, capacity, label: "", className: "" };
};

/**
 * Aggregate status across all batches of a trip:
 * sums capacity & seats_booked of *active* batches so that one nearly-full
 * upcoming batch doesn't drown out a fresh one.
 */
export const getAggregateSeatStatus = (
  batches: Array<{ batch_size: number; seats_booked: number; status?: string }>
): SeatStatus => {
  if (!batches || batches.length === 0) return EMPTY;
  const active = batches.filter((b) => !b.status || b.status === "active");
  if (active.length === 0) return EMPTY;

  // Use the *most pressing* batch (lowest remaining) so urgency surfaces.
  let best: SeatStatus = EMPTY;
  for (const b of active) {
    const s = getSeatStatus(b.batch_size, b.seats_booked);
    if (s.level === "unknown") continue;
    const order = { sold_out: 4, low: 3, filling_fast: 2, available: 1, unknown: 0 } as const;
    if (order[s.level] > order[best.level]) best = s;
  }
  return best;
};
