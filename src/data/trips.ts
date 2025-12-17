export interface ScheduleItem {
  time: string;
  activity: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  schedule: ScheduleItem[];
}

export interface TripPrice {
  fromPune?: number;
  fromMumbai?: number;
  default: number;
}

export interface BookingInfo {
  advance: number;
  paymentMethods: string[];
  bank?: {
    name: string;
    accountNumber: string;
    ifsc: string;
  };
  upi?: string;
}

export interface CancellationPolicy {
  [key: string]: string;
}

export interface Trip {
  tripId: string;
  tripName: string;
  price: TripPrice | number;
  duration: string;
  summary: string;
  itinerary?: ItineraryDay[];
  inclusions?: string[];
  exclusions?: string[];
  booking?: BookingInfo;
  cancellationPolicy?: CancellationPolicy;
  locations?: string[];
  images: string[];
  isActive: boolean;
  tripStatus: 'active' | 'upcoming'; // NEW: Only 'active' trips can be booked
  capacity?: number;
  availableDates?: string[];
  contact?: {
    phone: string;
    email: string;
  };
  notes?: string;
  highlights?: string[];
  stayDetails?: string[]; // For camping trips
  activities?: string[]; // Featured activities
}

export const trips: Trip[] = [
  {
    tripId: "malvan-bhraman-001",
    tripName: "Malvan Escape — Bhraman",
    price: {
      fromPune: 6399,
      fromMumbai: 6899,
      default: 6899
    },
    duration: "3N/2D",
    summary: "Sunrise at Chivla Beach, water adventures (scuba, parasailing, jet ski), Sindhudurg Fort, backwaters of Devbaug. Guided tour and Malvani meals.",
    highlights: [
      "Deep-water scuba diving with video",
      "Parasailing & jet ski adventures",
      "Historic Sindhudurg Fort tour",
      "Backwater boat ride to Tsunami Island",
      "Authentic Malvani cuisine"
    ],
    itinerary: [
      {
        day: 1,
        title: "Depart Mumbai → Pune pickup → Overnight Journey",
        schedule: [
          { time: "17:00", activity: "Assemble at Dadar TT — depart from Mumbai" },
          { time: "22:00", activity: "Pune pickup — continue overnight journey" }
        ]
      },
      {
        day: 2,
        title: "Arrival | Water Adventures | Sunset Experience",
        schedule: [
          { time: "06:00", activity: "Arrive Malvan, check-in, rest, unlimited breakfast" },
          { time: "08:30", activity: "Sunrise at Chivla Beach - gentle walk, silence circle, reflection" },
          { time: "09:00", activity: "Water adventures: deep-water scuba (with video), parasailing, jet ski, banana ride, bumper ride" },
          { time: "13:30", activity: "Unlimited Malvani lunch" },
          { time: "15:30", activity: "Rajkot Fort + Ganpati Mandir darshan" },
          { time: "17:30", activity: "Rock Garden sunset + musical water show" },
          { time: "20:00", activity: "Dinner followed by bonfire and bonding activities" }
        ]
      },
      {
        day: 3,
        title: "Sindhudurg Fort | Devbaug | Backwaters | Departure",
        schedule: [
          { time: "07:00", activity: "Unlimited breakfast" },
          { time: "08:00", activity: "Tarkarli & Devbaug beach — scenic walk, backwater boat ride, Tsunami Island & Sangam Point, (kayaking if available), Seagull island, lighthouse, dolphin point" },
          { time: "14:00", activity: "Unlimited lunch" },
          { time: "16:00", activity: "Ferry ride to Sindhudurg Fort — sightseeing" },
          { time: "19:00", activity: "Depart Malvan — dinner en route (not included)" },
          { time: "04:00", activity: "Pune drop-off (~04:00–04:30)" },
          { time: "07:00", activity: "Arrive Mumbai (~07:00–07:30) — closing group circle" }
        ]
      }
    ],
    inclusions: [
      "Non-AC tempo traveler bus",
      "Accommodation on triple sharing basis",
      "Meals: 4 Malvani meals (2 breakfasts, 2 lunches)",
      "Guided tour",
      "Water sports package: jet ski, banana ride, bumper ride, scuba diving, parasailing",
      "Entry fees and ferry rides (Sindhudurg, Tsunami Island & Sangam Point)",
      "First aid support"
    ],
    exclusions: [
      "Dinner (unless specified)",
      "Travel till pickup point",
      "Beverages & snacks not mentioned",
      "Additional repeated sport activity costs",
      "Medical / emergency evacuation"
    ],
    booking: {
      advance: 2000,
      paymentMethods: ["Bank Transfer", "UPI", "QR/WhatsApp"],
      bank: {
        name: "UTKARSH KARTIKA PRASAD VERMA",
        accountNumber: "188433676328",
        ifsc: "INDB0000430"
      },
      upi: "8433676328@INDIE"
    },
    cancellationPolicy: {
      ">=8_days_before": "75% refund (processed in 5-7 working days)",
      "4_to_7_days_before": "50% refund",
      "<=3_days_before": "No refund",
      "no_show": "No refund"
    },
    locations: ["Chivla Beach", "Sindhudurg Fort", "Tarkarli", "Devbaug", "Tsunami Island", "Sangam Point"],
    images: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
      "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=800&q=80"
    ],
    isActive: true,
    tripStatus: 'active', // ONLY THIS TRIP IS BOOKABLE
    capacity: 40,
    contact: {
      phone: "+91-9415026522",
      email: "bhramanbyua@gmail.com"
    },
    notes: "Items marked with * in the brochure are not included in package."
  },
  {
    tripId: "alibagh-beach-camping-002",
    tripName: "Alibagh Beach Camping Experience",
    price: { default: 4999 },
    duration: "2D/1N",
    summary: "Experience magical beach camping with bonfire nights, stunning sunrise views, and exciting water activities at Alibagh's pristine beaches.",
    highlights: [
      "Beachside tent camping",
      "Bonfire & music night",
      "Sunrise & sunset views",
      "Beach games & activities",
      "Visit historic Kolaba Fort",
      "Optional water sports"
    ],
    stayDetails: [
      "Night camp stay at beachside",
      "Comfortable tents near the beach",
      "Bonfire setup with soft music",
      "Clean shared washrooms",
      "Basic bedding and sleeping bags"
    ],
    activities: [
      "Beach camping",
      "Bonfire night",
      "Beach games",
      "Sunset & sunrise views",
      "Water sports (optional, paid)",
      "Photography & relaxation"
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival | Beach Exploration | Bonfire Night",
        schedule: [
          { time: "07:00", activity: "Departure from Mumbai / Pune" },
          { time: "09:00", activity: "Breakfast en route" },
          { time: "11:00", activity: "Visit Alibagh Beach - free time" },
          { time: "12:30", activity: "Explore historic Kolaba Fort" },
          { time: "14:00", activity: "Lunch (local Konkani cuisine)" },
          { time: "16:00", activity: "Check-in to beachside campsite" },
          { time: "17:00", activity: "Evening beach games & leisure time" },
          { time: "18:30", activity: "Sunset viewing at beach" },
          { time: "20:00", activity: "Bonfire + soft music night" },
          { time: "21:00", activity: "Dinner at campsite" },
          { time: "22:30", activity: "Overnight stay in beachside tents" }
        ]
      },
      {
        day: 2,
        title: "Sunrise | Nagaon Beach | Return Journey",
        schedule: [
          { time: "06:00", activity: "Early morning beach walk & sunrise" },
          { time: "07:30", activity: "Tea & breakfast at camp" },
          { time: "09:30", activity: "Visit Nagaon Beach" },
          { time: "10:30", activity: "Water activities (banana ride / jet ski – optional, extra cost)" },
          { time: "12:00", activity: "Local sightseeing" },
          { time: "13:30", activity: "Lunch" },
          { time: "15:00", activity: "Return journey begins" },
          { time: "19:00", activity: "Arrive Mumbai / Pune" }
        ]
      }
    ],
    inclusions: [
      "AC/Non-AC transport (based on group size)",
      "Beachside tent accommodation",
      "Bonfire with music setup",
      "Meals: 1 breakfast, 2 lunches, 1 dinner",
      "Kolaba Fort entry fees",
      "Beach games equipment",
      "First aid support"
    ],
    exclusions: [
      "Water sports activities (optional)",
      "Personal expenses",
      "Travel to pickup point",
      "Beverages & snacks not mentioned",
      "Camera fees at monuments"
    ],
    locations: ["Alibagh Beach", "Kolaba Fort", "Nagaon Beach"],
    images: [
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80",
      "https://images.unsplash.com/photo-1533873984035-25970ab07461?w=800&q=80"
    ],
    isActive: true,
    tripStatus: 'upcoming', // UPCOMING - NOT BOOKABLE
    capacity: 30,
    contact: {
      phone: "+91-9415026522",
      email: "bhramanbyua@gmail.com"
    }
  },
  {
    tripId: "konkan-weekend-alibaug-003",
    tripName: "Konkan Weekend Escape — Alibaug & Mandwa",
    price: { default: 5499 },
    duration: "2D/1N",
    summary: "Ferry ride, beach time, forts, seafood evening. Perfect weekend getaway from Mumbai.",
    highlights: [
      "Scenic ferry ride from Gateway of India",
      "Alibaug beach exploration",
      "Kolaba Fort visit",
      "Fresh seafood dinner"
    ],
    images: ["https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80"],
    isActive: true,
    tripStatus: 'upcoming',
    availableDates: ["2025-01-18", "2025-02-15", "2025-03-15"],
    locations: ["Alibaug", "Mandwa", "Kolaba Fort"],
    contact: {
      phone: "+91-9415026522",
      email: "bhramanbyua@gmail.com"
    }
  },
  {
    tripId: "ratnagiri-beaches-004",
    tripName: "Ratnagiri Beaches & Sunset Forts",
    price: { default: 9999 },
    duration: "3D/2N",
    summary: "Ganpatipule, Jaigad Fort, beach camping. Experience the pristine beauty of Ratnagiri coast.",
    highlights: [
      "Ganpatipule Temple & Beach",
      "Jaigad Fort sunset views",
      "Beach camping under stars",
      "Local Konkani cuisine"
    ],
    images: ["https://images.unsplash.com/photo-1468413253725-0d5181091126?w=800&q=80"],
    isActive: true,
    tripStatus: 'upcoming',
    locations: ["Ganpatipule", "Jaigad Fort", "Ratnagiri Beach"],
    contact: {
      phone: "+91-9415026522",
      email: "bhramanbyua@gmail.com"
    }
  },
  {
    tripId: "sindhudurg-tarkarli-005",
    tripName: "Sindhudurg Fort & Tarkarli Water Sports",
    price: { default: 18999 },
    duration: "4D/3N",
    summary: "Scuba, snorkeling, Sindhudurg fort tour, Devbaug backwaters. The ultimate Konkan water adventure.",
    highlights: [
      "Professional scuba diving",
      "Snorkeling in crystal waters",
      "Sindhudurg Fort exploration",
      "Devbaug backwater cruise"
    ],
    images: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80"],
    isActive: true,
    tripStatus: 'upcoming',
    locations: ["Sindhudurg Fort", "Tarkarli", "Devbaug"],
    contact: {
      phone: "+91-9415026522",
      email: "bhramanbyua@gmail.com"
    }
  },
  {
    tripId: "murud-janjira-006",
    tripName: "Murud-Janjira & Kulaba Fort",
    price: { default: 6999 },
    duration: "2D/1N",
    summary: "Historic fort visits, coastal walks. Discover the unconquered sea fortress.",
    highlights: [
      "Janjira Fort - the unconquered",
      "Kulaba Fort exploration",
      "Murud beach sunset",
      "Historic tales & legends"
    ],
    images: ["https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800&q=80"],
    isActive: true,
    tripStatus: 'upcoming',
    locations: ["Murud", "Janjira Fort", "Kulaba Fort"],
    contact: {
      phone: "+91-9415026522",
      email: "bhramanbyua@gmail.com"
    }
  },
  {
    tripId: "guhagar-devgad-007",
    tripName: "Guhagar & Devgad Mango Trails",
    price: { default: 8499 },
    duration: "3D/2N",
    summary: "Village walks, orchards (seasonal), coastal trails. Experience authentic Konkan village life.",
    highlights: [
      "Famous Devgad mango orchards",
      "Pristine Guhagar beach",
      "Village homestay experience",
      "Coastal trail walks"
    ],
    images: ["https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80"],
    isActive: true,
    tripStatus: 'upcoming',
    locations: ["Guhagar", "Devgad", "Velneshwar"],
    contact: {
      phone: "+91-9415026522",
      email: "bhramanbyua@gmail.com"
    }
  },
  {
    tripId: "coastal-drive-mumbai-goa-008",
    tripName: "Konkan Coastal Road Trip (Mumbai → Goa)",
    price: { default: 24999 },
    duration: "5D/4N",
    summary: "Scenic coastal drive with stops, forts, beaches and seafood. The ultimate Konkan experience.",
    highlights: [
      "500+ km scenic coastal drive",
      "Multiple fort visits",
      "Beach hopping",
      "Best of Konkan seafood"
    ],
    images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80"],
    isActive: true,
    tripStatus: 'upcoming',
    locations: ["Mumbai", "Alibaug", "Murud", "Ratnagiri", "Malvan", "Goa"],
    contact: {
      phone: "+91-9415026522",
      email: "bhramanbyua@gmail.com"
    }
  }
];

export const getTrip = (tripId: string): Trip | undefined => {
  return trips.find(trip => trip.tripId === tripId);
};

export const getActiveTrips = (): Trip[] => {
  return trips.filter(trip => trip.isActive);
};

// Get only bookable trips (tripStatus === 'active')
export const getBookableTrips = (): Trip[] => {
  return trips.filter(trip => trip.isActive && trip.tripStatus === 'active');
};

// Get upcoming trips (tripStatus === 'upcoming')
export const getUpcomingTrips = (): Trip[] => {
  return trips.filter(trip => trip.isActive && trip.tripStatus === 'upcoming');
};

// Check if a trip is bookable
export const isTripBookable = (trip: Trip): boolean => {
  return trip.tripStatus === 'active';
};

export const getTripPrice = (trip: Trip): number => {
  if (typeof trip.price === 'number') {
    return trip.price;
  }
  return trip.price.default;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
};
