import { differenceInDays } from "date-fns";

export interface DynamicPriceResult {
  basePrice: number;
  effectivePrice: number;
  /** Always 0 — date/occupancy-based price increases are disabled. */
  adjustmentPercent: number;
  badges: Array<{ label: string; type: "surge" | "discount" }>;
}

/**
 * Price adjustments are DISABLED.
 * We keep this function for backward compatibility — it always returns the base price.
 * Urgency badges (e.g. "Filling fast") are surfaced separately via getSeatStatus.
 */
export function calculateDynamicPrice(
  basePrice: number,
  _batchSize: number,
  _availableSeats: number,
  _startDate: string,
): DynamicPriceResult {
  return {
    basePrice,
    effectivePrice: basePrice,
    adjustmentPercent: 0,
    badges: [],
  };
}
