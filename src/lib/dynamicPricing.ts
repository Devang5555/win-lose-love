import { differenceInDays } from "date-fns";

export interface DynamicPriceResult {
  basePrice: number;
  effectivePrice: number;
  /** Positive = surcharge, negative = discount */
  adjustmentPercent: number;
  badges: Array<{ label: string; type: "surge" | "discount" }>;
}

/**
 * Compute dynamic price for a batch without mutating any DB values.
 *
 * Rules (cumulative, capped at ±20%):
 *  - occupancy ≥ 85% → +15%
 *  - occupancy ≥ 70% → +8%
 *  - start_date within 7 days → +10%
 *  - start_date > 30 days away → −5% (early bird)
 */
export function calculateDynamicPrice(
  basePrice: number,
  batchSize: number,
  availableSeats: number,
  startDate: string,
): DynamicPriceResult {
  const occupancy = batchSize > 0 ? ((batchSize - availableSeats) / batchSize) * 100 : 0;
  const daysUntilStart = differenceInDays(new Date(startDate), new Date());

  let adjustment = 0;
  const badges: DynamicPriceResult["badges"] = [];

  // Occupancy-based (mutually exclusive tiers)
  if (occupancy >= 85) {
    adjustment += 15;
    badges.push({ label: "High Demand", type: "surge" });
  } else if (occupancy >= 70) {
    adjustment += 8;
    badges.push({ label: "High Demand", type: "surge" });
  }

  // Date-based
  if (daysUntilStart <= 7 && daysUntilStart >= 0) {
    adjustment += 10;
    badges.push({ label: "Last Minute", type: "surge" });
  } else if (daysUntilStart > 30) {
    adjustment -= 5;
    badges.push({ label: "Early Bird Offer", type: "discount" });
  }

  // Cap
  adjustment = Math.min(adjustment, 20);
  adjustment = Math.max(adjustment, -20);

  const effectivePrice = Math.round(basePrice * (1 + adjustment / 100));

  return {
    basePrice,
    effectivePrice,
    adjustmentPercent: adjustment,
    badges,
  };
}
