import {
  Moon, Sun, Camera, Landmark, Route, Waves, Mountain,
  Fuel, Banknote, Signal, Shirt, AlertTriangle, Calendar, UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import waterfallImg from "@/assets/sissu-waterfall.jpg";
import templeImg from "@/assets/raja-ghepan-temple.jpg";
import riverImg from "@/assets/chandra-river.jpg";
import villageImg from "@/assets/sissu-village.jpg";
import keylongImg from "@/assets/keylong.jpg";
import fortImg from "@/assets/gondhla-fort.jpg";

export interface ItineraryDay {
  day: number;
  title: string;
  icon: LucideIcon;
  stay: string | null;
  items: string[];
  options?: { label: string; desc: string }[];
}

export interface OverviewItem {
  icon: LucideIcon;
  label: string;
  value: string;
}

export interface TravelNote {
  icon: LucideIcon;
  text: string;
}

export interface PlaceCard {
  img: string;
  name: string;
  desc: string;
}

export interface TripItineraryData {
  overview: OverviewItem[];
  itinerary: ItineraryDay[];
  travelNotes: TravelNote[];
  places?: PlaceCard[];
  bestTime?: string;
}

// Keyed by trip_id
const tripItineraries: Record<string, TripItineraryData> = {
  // ——— SISSU ———
  "delhi-to-sissu-005": {
    bestTime: "March–June & Sept–Oct",
    overview: [
      { icon: Calendar, label: "Duration", value: "5 Days" },
      { icon: Route, label: "Distance", value: "~550 km" },
      { icon: Moon, label: "Travel Time", value: "12–14 hours" },
      { icon: Landmark, label: "Route", value: "Delhi → Chandigarh → Mandi → Aut → Kullu → Atal Tunnel → Sissu" },
    ],
    itinerary: [
      { day: 1, title: "Delhi → Sissu (Overnight Journey)", icon: Moon, stay: "Travel Night", items: ["Depart 6–7 PM from Delhi", "Overnight Volvo / Private Cab", "Early morning Atal Tunnel crossing", "Reach Sissu by 6–8 AM"] },
      { day: 2, title: "Sissu Sightseeing & Relaxation", icon: Sun, stay: "Sissu", items: ["Rest & acclimatization", "Visit Sissu Waterfall", "Visit Raja Ghepan Temple", "Walk along Chandra River", "Explore Sissu Village", "Sunset photography"] },
      { day: 3, title: "Day Trip to Keylong (14 km one way)", icon: Landmark, stay: "Sissu", items: ["Drive to Keylong", "Visit Kardang Monastery", "Explore local market", "Lunch at café / dhaba", "Return to Sissu", "Stargazing (weather permitting)"] },
      { day: 4, title: "Local Exploration – Jispa or Gondhla", icon: Camera, stay: "Sissu", options: [{ label: "Option A: Jispa", desc: "Riverside views, nature walks, photography" }, { label: "Option B: Gondhla Village", desc: "Visit Gondhla Fort & explore local culture" }], items: ["Evening return to Sissu"] },
      { day: 5, title: "Sissu → Delhi Return", icon: Route, stay: null, items: ["Early morning departure", "Drive via Atal Tunnel → Kullu → Chandigarh", "Reach Delhi late night"] },
    ],
    travelNotes: [
      { icon: Fuel, text: "Fuel up at Tandi Petrol Pump — last fuel station before Sissu" },
      { icon: Banknote, text: "Carry cash — limited ATMs beyond Kullu" },
      { icon: Signal, text: "BSNL network works best in Lahaul valley" },
      { icon: Shirt, text: "Pack warm clothes — cold nights even in summer" },
      { icon: AlertTriangle, text: "Check road & Atal Tunnel status before travel" },
    ],
    places: [
      { img: waterfallImg, name: "Sissu Waterfall", desc: "A stunning cascade right beside the highway, perfect for a refreshing stop." },
      { img: templeImg, name: "Raja Ghepan Temple", desc: "Ancient Himalayan temple perched high with panoramic valley views." },
      { img: riverImg, name: "Chandra River", desc: "Glacial turquoise waters winding through the dramatic Lahaul valley." },
      { img: villageImg, name: "Sissu Village", desc: "A serene hamlet with green fields, traditional homes, and warm locals." },
      { img: keylongImg, name: "Keylong", desc: "District HQ of Lahaul, home to Kardang Monastery and vibrant markets." },
      { img: fortImg, name: "Gondhla Fort", desc: "A centuries-old stone fortress showcasing Lahaul's rich cultural heritage." },
    ],
  },

  // ——— GOA ———
  "goa-beach-bliss-010": {
    bestTime: "Oct–March",
    overview: [
      { icon: Calendar, label: "Duration", value: "3 Days / 2 Nights" },
      { icon: Route, label: "Distance", value: "~600 km from Mumbai" },
      { icon: Moon, label: "Travel Time", value: "10–12 hours by road" },
      { icon: Landmark, label: "Route", value: "Mumbai → NH66 → Goa (North & South)" },
    ],
    itinerary: [
      { day: 1, title: "Arrival & North Goa Vibes", icon: Sun, stay: "North Goa", items: ["Arrive in Goa by morning / afternoon", "Check in & freshen up", "Visit Calangute & Baga Beach", "Evening at Anjuna flea market (if Wednesday)", "Dinner at a beach shack", "Night walk at Tito's Lane"] },
      { day: 2, title: "South Goa Heritage & Beaches", icon: Camera, stay: "Goa", items: ["Breakfast at hotel", "Visit Basilica of Bom Jesus (UNESCO)", "Explore Old Goa churches", "Lunch at a riverside restaurant", "Palolem or Agonda Beach in the afternoon", "Sunset cruise on Mandovi River (optional)"] },
      { day: 3, title: "Adventure & Departure", icon: Waves, stay: null, items: ["Early morning Dudhsagar Waterfall trip (optional)", "Water sports at Calangute — parasailing, jet ski, banana ride", "Shopping at Mapusa Market", "Depart for home by evening"] },
    ],
    travelNotes: [
      { icon: Banknote, text: "Carry cash for beach shacks and local markets" },
      { icon: Shirt, text: "Pack light cotton clothes & swimwear" },
      { icon: AlertTriangle, text: "Avoid monsoon season (June–Sept) for beach activities" },
      { icon: UtensilsCrossed, text: "Try local Goan fish curry, bebinca & feni" },
    ],
  },

  // ——— MANALI ———
  "manali-escape-009": {
    bestTime: "Dec–Feb & May–June",
    overview: [
      { icon: Calendar, label: "Duration", value: "4 Days / 3 Nights" },
      { icon: Route, label: "Distance", value: "~540 km from Delhi" },
      { icon: Moon, label: "Travel Time", value: "12–14 hours by road" },
      { icon: Landmark, label: "Route", value: "Delhi → Chandigarh → Mandi → Kullu → Manali" },
    ],
    itinerary: [
      { day: 1, title: "Delhi → Manali (Overnight Journey)", icon: Moon, stay: "Travel Night", items: ["Depart 5–6 PM from Delhi", "Overnight Volvo / Private Cab", "Scenic drive through Chandigarh & Mandi", "Reach Manali by morning"] },
      { day: 2, title: "Manali Local Sightseeing", icon: Sun, stay: "Manali", items: ["Check in & rest", "Visit Hadimba Devi Temple", "Explore Old Manali & Mall Road", "Tibetan Monastery visit", "Vashisht Hot Springs", "Evening café hopping in Old Manali"] },
      { day: 3, title: "Solang Valley & Rohtang Adventure", icon: Mountain, stay: "Manali", items: ["Early start to Solang Valley", "Snow activities — skiing, tubing, paragliding", "Drive to Atal Tunnel viewpoint", "Rohtang Pass (permit required, seasonal)", "Return to Manali by evening", "Bonfire & dinner at hotel"] },
      { day: 4, title: "Manali → Delhi Return", icon: Route, stay: null, items: ["Morning visit to Naggar Castle (optional)", "Shopping for Kullu shawls & local crafts", "Depart for Delhi by afternoon", "Reach Delhi late night"] },
    ],
    travelNotes: [
      { icon: Shirt, text: "Pack heavy woolens — temperatures drop below 0°C in winter" },
      { icon: AlertTriangle, text: "Rohtang Pass requires advance permit — book online" },
      { icon: Fuel, text: "Fuel up before Mandi — stations sparse after" },
      { icon: Banknote, text: "ATMs available in Manali but carry backup cash" },
    ],
  },

  // ——— RISHIKESH ———
  "rishikesh-adventure-012": {
    bestTime: "Sept–June",
    overview: [
      { icon: Calendar, label: "Duration", value: "3 Days / 2 Nights" },
      { icon: Route, label: "Distance", value: "~240 km from Delhi" },
      { icon: Moon, label: "Travel Time", value: "5–6 hours by road" },
      { icon: Landmark, label: "Route", value: "Delhi → Haridwar → Rishikesh" },
    ],
    itinerary: [
      { day: 1, title: "Delhi → Rishikesh & Ganga Aarti", icon: Sun, stay: "Rishikesh", items: ["Depart Delhi early morning (5–6 AM)", "Breakfast stop at Murthal dhabas", "Arrive Rishikesh by noon", "Check in & relax", "Visit Laxman Jhula & Ram Jhula", "Attend Ganga Aarti at Triveni Ghat", "Dinner at a riverside café"] },
      { day: 2, title: "Adventure Day – Rafting & Exploration", icon: Waves, stay: "Rishikesh", items: ["White water rafting on the Ganges (16 km stretch)", "Cliff jumping at designated spots", "Visit Beatles Ashram (Chaurasi Kutia)", "Explore Rishikesh local market", "Yoga session at an ashram (optional)", "Evening bonfire at camp"] },
      { day: 3, title: "Temples & Return to Delhi", icon: Mountain, stay: null, items: ["Sunrise yoga or meditation by the Ganges", "Visit Neelkanth Mahadev Temple", "Breakfast & checkout", "Stop at Haridwar — Har Ki Pauri ghat", "Depart for Delhi by afternoon", "Reach Delhi by evening"] },
    ],
    travelNotes: [
      { icon: Banknote, text: "Rafting costs ₹800–₹2500 depending on distance" },
      { icon: Shirt, text: "Carry quick-dry clothes for rafting & comfortable shoes" },
      { icon: AlertTriangle, text: "Rafting season: Sept–June (closed during monsoon)" },
      { icon: Calendar, text: "Book Beatles Ashram tickets online in advance" },
    ],
  },
};

export const getTripItinerary = (tripId: string): TripItineraryData | null => {
  return tripItineraries[tripId] || null;
};

export default tripItineraries;
