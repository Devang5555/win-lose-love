/**
 * Adventure Add-ons — shared types and helpers.
 * Stored as JSONB on `trips.addons` (catalog) and `bookings.addons` (selected).
 */

export interface AddonCatalogItem {
  id: string;
  name: string;
  price: number;          // ₹ per qty
  max_qty?: number;       // optional cap
  description?: string;
  default_qty?: number;   // optional starting qty when enabled
}

export interface SelectedAddon {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export const parseAddonCatalog = (raw: unknown): AddonCatalogItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({
      id: String(x.id ?? crypto.randomUUID()),
      name: String(x.name ?? "").trim(),
      price: Number(x.price ?? 0) || 0,
      max_qty: x.max_qty != null ? Number(x.max_qty) : undefined,
      description: x.description ? String(x.description) : undefined,
      default_qty: x.default_qty != null ? Number(x.default_qty) : undefined,
    }))
    .filter((a) => a.name && a.price > 0);
};

export const addonsTotal = (selected: SelectedAddon[]): number =>
  selected.reduce((sum, a) => sum + a.price * Math.max(0, a.qty || 0), 0);

export const formatAddonsForBooking = (selected: SelectedAddon[]) =>
  selected.filter((a) => a.qty > 0).map((a) => ({
    id: a.id,
    name: a.name,
    price: a.price,
    qty: a.qty,
  }));
