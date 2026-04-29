// Adapter: convert admin-saved JSON itinerary (from trips.itinerary_data) into
// the typed TripItineraryData shape consumed by <TripItinerarySection>.
// Icons are stored as strings in JSON; mapped to LucideIcon components here.

import {
  Calendar, Route, Moon, Sun, Camera, Landmark, Mountain, Waves,
  Fuel, Banknote, Signal, Shirt, AlertTriangle, UtensilsCrossed, Home,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TripItineraryData } from "@/data/tripItineraries";

const ICON_MAP: Record<string, LucideIcon> = {
  Calendar, Route, Moon, Sun, Camera, Landmark, Mountain, Waves,
  Fuel, Banknote, Signal, Shirt, AlertTriangle, UtensilsCrossed, Home,
};

const ICON_LABELS: Array<{ key: keyof typeof ICON_MAP; label: string }> = [
  { key: "Calendar", label: "Calendar" },
  { key: "Route", label: "Route / Drive" },
  { key: "Moon", label: "Night / Travel" },
  { key: "Sun", label: "Day / Leisure" },
  { key: "Camera", label: "Sightseeing" },
  { key: "Landmark", label: "Heritage" },
  { key: "Mountain", label: "Mountain" },
  { key: "Waves", label: "Water / Beach" },
  { key: "Fuel", label: "Fuel Stop" },
  { key: "Banknote", label: "Money / ATM" },
  { key: "Signal", label: "Network" },
  { key: "Shirt", label: "Packing" },
  { key: "AlertTriangle", label: "Warning" },
  { key: "UtensilsCrossed", label: "Food" },
  { key: "Home", label: "Stay" },
];

export const ICON_OPTIONS = ICON_LABELS;

export const resolveIcon = (name?: string | null, fallback: LucideIcon = Sun): LucideIcon =>
  (name && ICON_MAP[name]) || fallback;

// ——— Raw JSON shapes (admin-friendly, no LucideIcon refs) ———
export interface RawItineraryDay {
  day: number;
  title: string;
  icon?: string;
  stay?: string | null;
  items: string[];
  options?: { label: string; desc: string }[];
}

export interface RawOverviewItem { icon?: string; label: string; value: string }
export interface RawTravelNote { icon?: string; text: string }
export interface RawHotelGroup { city: string; hotels: string[] }
export interface RawStayRow { destination: string; dates: string; nights: string }
export interface RawDistanceRow { route: string; distance: string }

export interface RawItineraryJson {
  bestTime?: string;
  overview?: RawOverviewItem[];
  itinerary?: RawItineraryDay[];
  travelNotes?: RawTravelNote[];
  hotels?: RawHotelGroup[];
  staySummary?: RawStayRow[];
  distanceSummary?: RawDistanceRow[];
}

export const isAdminItineraryUsable = (raw: unknown): raw is RawItineraryJson => {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as RawItineraryJson;
  return Array.isArray(r.itinerary) && r.itinerary.length > 0;
};

export const adaptAdminItinerary = (raw: RawItineraryJson): TripItineraryData => ({
  bestTime: raw.bestTime,
  overview: (raw.overview ?? []).map((o) => ({
    icon: resolveIcon(o.icon, Calendar),
    label: o.label,
    value: o.value,
  })),
  itinerary: (raw.itinerary ?? []).map((d) => ({
    day: d.day,
    title: d.title,
    icon: resolveIcon(d.icon, Sun),
    stay: d.stay ?? null,
    items: d.items ?? [],
    options: d.options,
  })),
  travelNotes: (raw.travelNotes ?? []).map((n) => ({
    icon: resolveIcon(n.icon, AlertTriangle),
    text: n.text,
  })),
  hotels: raw.hotels,
  staySummary: raw.staySummary,
  distanceSummary: raw.distanceSummary,
});

export const emptyAdminItinerary = (): RawItineraryJson => ({
  bestTime: "",
  overview: [],
  itinerary: [{ day: 1, title: "Day 1", icon: "Sun", stay: "", items: [""] }],
  travelNotes: [],
  hotels: [],
});
