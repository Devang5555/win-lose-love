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
  },
  // India-wide destinations
  {
    tripId: "manali-escape-009",
    tripName: "Manali Snow & Mountains Adventure",
    price: { default: 14999 },
    duration: "4D/3N",
    summary: "Explore the snow-capped Himalayas, visit Solang Valley, Rohtang Pass, and experience the charm of Old Manali.",
    highlights: [
      "Solang Valley adventure activities",
      "Rohtang Pass snow experience",
      "Old Manali cafes & culture",
      "Hadimba Temple visit",
      "Mall Road shopping & nightlife"
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival in Manali | Old Manali Exploration",
        schedule: [
          { time: "10:00", activity: "Arrival in Manali, check-in to hotel" },
          { time: "12:00", activity: "Lunch at local restaurant" },
          { time: "14:00", activity: "Visit Hadimba Devi Temple" },
          { time: "16:00", activity: "Explore Old Manali - cafes, shops, Manu Temple" },
          { time: "19:00", activity: "Mall Road walk and dinner" }
        ]
      },
      {
        day: 2,
        title: "Solang Valley Adventure Day",
        schedule: [
          { time: "07:00", activity: "Early breakfast" },
          { time: "08:30", activity: "Depart for Solang Valley" },
          { time: "10:00", activity: "Adventure activities - paragliding, zorbing, ATV rides" },
          { time: "13:00", activity: "Packed lunch in the valley" },
          { time: "15:00", activity: "Snow point activities (seasonal)" },
          { time: "18:00", activity: "Return to hotel, rest" },
          { time: "20:00", activity: "Dinner and bonfire" }
        ]
      },
      {
        day: 3,
        title: "Rohtang Pass Excursion",
        schedule: [
          { time: "05:00", activity: "Early departure for Rohtang Pass" },
          { time: "08:00", activity: "Reach Rohtang - snow activities, photography" },
          { time: "12:00", activity: "Lunch at dhaba en route" },
          { time: "14:00", activity: "Visit Rahala Falls" },
          { time: "16:00", activity: "Return to Manali" },
          { time: "19:00", activity: "Free time and dinner" }
        ]
      },
      {
        day: 4,
        title: "Vashisht & Departure",
        schedule: [
          { time: "08:00", activity: "Breakfast and check-out" },
          { time: "09:30", activity: "Visit Vashisht Hot Springs & Temple" },
          { time: "11:00", activity: "Last minute shopping" },
          { time: "13:00", activity: "Departure from Manali" }
        ]
      }
    ],
    inclusions: [
      "AC Volvo bus/Tempo Traveler",
      "Hotel accommodation on triple sharing",
      "3 breakfasts, 3 dinners",
      "Sightseeing as per itinerary",
      "Entry fees to monuments",
      "First aid support"
    ],
    exclusions: [
      "Adventure activities charges",
      "Rohtang Pass permit (if applicable)",
      "Personal expenses",
      "Lunches",
      "Tips and gratitude"
    ],
    images: ["https://images.unsplash.com/photo-1571401835393-8c5f35328320?w=800&q=80"],
    isActive: true,
    tripStatus: 'upcoming',
    locations: ["Manali", "Solang Valley", "Rohtang Pass", "Old Manali", "Vashisht"],
    contact: {
      phone: "+91-9415026522",
      email: "bhramanbyua@gmail.com"
    }
  },
  {
    tripId: "goa-beach-bliss-010",
    tripName: "Goa Beach Bliss — Sun, Sand & Vibes",
    price: { default: 11999 },
    duration: "3D/2N",
    summary: "Experience the best of Goa - pristine beaches, Portuguese heritage, vibrant nightlife, and delicious seafood.",
    highlights: [
      "North Goa beach hopping",
      "Old Goa churches & heritage walk",
      "Cruise on Mandovi River",
      "Anjuna flea market",
      "Beach shacks & nightlife"
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival | North Goa Beaches",
        schedule: [
          { time: "10:00", activity: "Arrival in Goa, check-in" },
          { time: "12:00", activity: "Lunch at beach shack" },
          { time: "14:00", activity: "Calangute & Baga Beach exploration" },
          { time: "17:00", activity: "Sunset at Anjuna Beach" },
          { time: "19:00", activity: "Explore Titos Lane nightlife" },
          { time: "21:00", activity: "Dinner at beachside restaurant" }
        ]
      },
      {
        day: 2,
        title: "Heritage & Cruise",
        schedule: [
          { time: "08:00", activity: "Breakfast at hotel" },
          { time: "10:00", activity: "Old Goa heritage walk - Basilica of Bom Jesus, Se Cathedral" },
          { time: "13:00", activity: "Lunch at Fontainhas (Latin Quarter)" },
          { time: "15:00", activity: "Panjim city tour" },
          { time: "18:00", activity: "Mandovi River sunset cruise with music & snacks" },
          { time: "21:00", activity: "Dinner and leisure" }
        ]
      },
      {
        day: 3,
        title: "Markets & Departure",
        schedule: [
          { time: "08:00", activity: "Breakfast and check-out" },
          { time: "10:00", activity: "Anjuna Flea Market (if Wednesday) or Mapusa Market" },
          { time: "12:00", activity: "Last beach visit - Vagator" },
          { time: "14:00", activity: "Lunch and departure" }
        ]
      }
    ],
    inclusions: [
      "AC transport",
      "Resort stay on twin sharing",
      "2 breakfasts, 1 dinner",
      "River cruise with snacks",
      "Heritage walk guide",
      "First aid support"
    ],
    exclusions: [
      "Water sports activities",
      "Nightlife expenses",
      "Alcoholic beverages",
      "Personal shopping",
      "Tips"
    ],
    images: ["https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80"],
    isActive: true,
    tripStatus: 'upcoming',
    locations: ["Goa", "Calangute", "Baga Beach", "Old Goa", "Panjim", "Anjuna"],
    contact: {
      phone: "+91-9415026522",
      email: "bhramanbyua@gmail.com"
    }
  },
  {
    tripId: "gokarna-beach-trek-011",
    tripName: "Gokarna Beach Trek & Temple Town",
    price: { default: 8999 },
    duration: "3D/2N",
    summary: "Trek through pristine beaches, visit ancient temples, and experience the peaceful vibes of this hidden gem on Karnataka's coast.",
    highlights: [
      "Beach trek - Om Beach to Paradise Beach",
      "Mahabaleshwar Temple darshan",
      "Sunset at Kudle Beach",
      "Beach camping experience",
      "Hidden beach exploration"
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival | Gokarna Town & Temples",
        schedule: [
          { time: "11:00", activity: "Arrival in Gokarna, check-in" },
          { time: "13:00", activity: "Lunch at local restaurant" },
          { time: "15:00", activity: "Mahabaleshwar Temple visit" },
          { time: "16:30", activity: "Gokarna town walk - shops, cafes" },
          { time: "18:00", activity: "Sunset at Gokarna Beach" },
          { time: "20:00", activity: "Dinner and rest" }
        ]
      },
      {
        day: 2,
        title: "Beach Trek Day",
        schedule: [
          { time: "06:00", activity: "Early breakfast" },
          { time: "07:00", activity: "Start beach trek from Gokarna Beach" },
          { time: "08:30", activity: "Reach Kudle Beach - short break" },
          { time: "10:00", activity: "Trek to Om Beach" },
          { time: "11:30", activity: "Reach Half Moon Beach - swimming" },
          { time: "13:00", activity: "Trek to Paradise Beach - lunch at shack" },
          { time: "15:00", activity: "Boat ride back to Gokarna/Om Beach" },
          { time: "17:00", activity: "Rest at hotel" },
          { time: "19:00", activity: "Beach bonfire and dinner" }
        ]
      },
      {
        day: 3,
        title: "Leisure & Departure",
        schedule: [
          { time: "07:00", activity: "Sunrise yoga at beach (optional)" },
          { time: "08:30", activity: "Breakfast" },
          { time: "10:00", activity: "Free time - beach activities or cafe hopping" },
          { time: "13:00", activity: "Check-out and departure" }
        ]
      }
    ],
    inclusions: [
      "AC transport from Bangalore/Hubli",
      "Hostel/Guesthouse stay",
      "2 breakfasts, 2 dinners",
      "Trek guide",
      "Boat ride",
      "Bonfire setup",
      "First aid support"
    ],
    exclusions: [
      "Water sports",
      "Personal expenses",
      "Lunches",
      "Beverages"
    ],
    images: ["https://images.unsplash.com/photo-1590766740554-038e9dc9c4d6?w=800&q=80"],
    isActive: true,
    tripStatus: 'upcoming',
    locations: ["Gokarna", "Om Beach", "Kudle Beach", "Paradise Beach", "Half Moon Beach"],
    contact: {
      phone: "+91-9415026522",
      email: "bhramanbyua@gmail.com"
    }
  },
  {
    tripId: "rishikesh-adventure-012",
    tripName: "Rishikesh Adventure & Spirituality",
    price: { default: 9999 },
    duration: "3D/2N",
    summary: "River rafting, bungee jumping, ancient temples, and evening Ganga Aarti in the yoga capital of the world.",
    highlights: [
      "White water rafting on Ganges",
      "Lakshman Jhula & Ram Jhula",
      "Evening Ganga Aarti at Triveni Ghat",
      "Cliff jumping & adventure activities",
      "Beatles Ashram exploration"
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival | Rishikesh Exploration",
        schedule: [
          { time: "10:00", activity: "Arrival in Rishikesh, check-in to camp/hotel" },
          { time: "12:00", activity: "Lunch" },
          { time: "14:00", activity: "Visit Lakshman Jhula & Ram Jhula" },
          { time: "16:00", activity: "Beatles Ashram (Maharishi Mahesh Yogi Ashram)" },
          { time: "18:30", activity: "Evening Ganga Aarti at Triveni Ghat" },
          { time: "20:00", activity: "Dinner at cafe and explore Rishikesh" }
        ]
      },
      {
        day: 2,
        title: "Adventure Day",
        schedule: [
          { time: "06:00", activity: "Sunrise yoga session (optional)" },
          { time: "08:00", activity: "Breakfast" },
          { time: "09:30", activity: "Depart for rafting point (Shivpuri/Marine Drive)" },
          { time: "10:30", activity: "White water rafting - 16km stretch with rapids" },
          { time: "13:30", activity: "Reach Rishikesh, lunch" },
          { time: "15:30", activity: "Cliff jumping, body surfing at rafting beach" },
          { time: "18:00", activity: "Return to camp, rest" },
          { time: "20:00", activity: "Bonfire, music, dinner by the Ganges" }
        ]
      },
      {
        day: 3,
        title: "Temples & Departure",
        schedule: [
          { time: "07:00", activity: "Early morning temple visit - Neelkanth Mahadev" },
          { time: "10:00", activity: "Breakfast" },
          { time: "11:00", activity: "Free time for shopping - handicrafts, yoga gear" },
          { time: "13:00", activity: "Departure from Rishikesh" }
        ]
      }
    ],
    inclusions: [
      "AC transport from Delhi/Haridwar",
      "Camp/hotel stay by river",
      "2 breakfasts, 2 dinners",
      "White water rafting (16km)",
      "Rafting equipment & guide",
      "Bonfire",
      "First aid support"
    ],
    exclusions: [
      "Bungee jumping, flying fox (optional paid)",
      "Personal expenses",
      "Lunches",
      "Camera charges at attractions"
    ],
    images: ["https://images.unsplash.com/photo-1591018653367-2bd4caac9559?w=800&q=80"],
    isActive: true,
    tripStatus: 'upcoming',
    locations: ["Rishikesh", "Lakshman Jhula", "Ram Jhula", "Shivpuri", "Neelkanth Temple"],
    contact: {
      phone: "+91-9415026522",
      email: "bhramanbyua@gmail.com"
    }
  },
  {
    tripId: "udaipur-royal-013",
    tripName: "Udaipur — City of Lakes & Palaces",
    price: { default: 12999 },
    duration: "3D/2N",
    summary: "Explore the Venice of the East - majestic palaces, serene lakes, vibrant bazaars, and royal Rajasthani heritage.",
    highlights: [
      "City Palace guided tour",
      "Lake Pichola boat ride at sunset",
      "Jag Mandir Island visit",
      "Sajjangarh Monsoon Palace",
      "Bagore Ki Haveli folk dance"
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival | City Palace & Lake Pichola",
        schedule: [
          { time: "10:00", activity: "Arrival in Udaipur, check-in to hotel" },
          { time: "12:00", activity: "Lunch at lakeside restaurant" },
          { time: "14:00", activity: "City Palace tour with guide" },
          { time: "17:00", activity: "Boat ride on Lake Pichola - visit Jag Mandir" },
          { time: "19:00", activity: "Sunset views from lake" },
          { time: "20:00", activity: "Dinner at rooftop with palace view" }
        ]
      },
      {
        day: 2,
        title: "Heritage & Culture Day",
        schedule: [
          { time: "08:00", activity: "Breakfast" },
          { time: "09:30", activity: "Visit Jagdish Temple" },
          { time: "11:00", activity: "Explore Saheliyon Ki Bari (Garden of Maids)" },
          { time: "13:00", activity: "Lunch at traditional thali restaurant" },
          { time: "15:00", activity: "Fateh Sagar Lake stroll" },
          { time: "17:00", activity: "Drive to Sajjangarh (Monsoon Palace) for sunset" },
          { time: "19:30", activity: "Bagore Ki Haveli folk dance show" },
          { time: "21:00", activity: "Dinner and leisure" }
        ]
      },
      {
        day: 3,
        title: "Markets & Departure",
        schedule: [
          { time: "08:00", activity: "Breakfast" },
          { time: "09:30", activity: "Shopping at Hathi Pol Bazaar - handicrafts, textiles" },
          { time: "11:30", activity: "Visit Vintage Car Museum" },
          { time: "13:00", activity: "Farewell lunch and departure" }
        ]
      }
    ],
    inclusions: [
      "AC transport",
      "Heritage hotel stay on twin sharing",
      "2 breakfasts, 1 dinner",
      "City Palace entry",
      "Boat ride on Lake Pichola",
      "Bagore Ki Haveli entry",
      "Sightseeing guide",
      "First aid support"
    ],
    exclusions: [
      "Sajjangarh entry (nominal fee)",
      "Personal shopping",
      "Lunches",
      "Tips"
    ],
    images: ["https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=800&q=80"],
    isActive: true,
    tripStatus: 'upcoming',
    locations: ["Udaipur", "City Palace", "Lake Pichola", "Jag Mandir", "Sajjangarh"],
    contact: {
      phone: "+91-9415026522",
      email: "bhramanbyua@gmail.com"
    }
  },
  {
    tripId: "jaipur-pink-city-014",
    tripName: "Jaipur — The Pink City Royal Experience",
    price: { default: 10999 },
    duration: "3D/2N",
    summary: "Discover Rajasthan's capital - magnificent forts, stunning palaces, vibrant markets, and rich Rajput heritage.",
    highlights: [
      "Amber Fort with elephant/jeep ride",
      "Hawa Mahal & City Palace",
      "Jantar Mantar astronomy tour",
      "Nahargarh Fort sunset views",
      "Johari Bazaar shopping"
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival | Pink City Exploration",
        schedule: [
          { time: "10:00", activity: "Arrival in Jaipur, check-in" },
          { time: "12:00", activity: "Lunch at traditional Rajasthani restaurant" },
          { time: "14:00", activity: "Visit Hawa Mahal (Palace of Winds)" },
          { time: "15:30", activity: "City Palace tour" },
          { time: "17:30", activity: "Jantar Mantar - world's largest stone sundial" },
          { time: "19:00", activity: "Albert Hall Museum (exterior view)" },
          { time: "20:00", activity: "Dinner and explore MI Road" }
        ]
      },
      {
        day: 2,
        title: "Forts & Heritage Day",
        schedule: [
          { time: "07:00", activity: "Early breakfast" },
          { time: "08:30", activity: "Depart for Amber Fort" },
          { time: "09:30", activity: "Amber Fort tour with jeep ride up" },
          { time: "12:00", activity: "Visit Jal Mahal (Water Palace) - photo stop" },
          { time: "13:00", activity: "Lunch" },
          { time: "15:00", activity: "Jaigarh Fort & Nahargarh Fort" },
          { time: "17:30", activity: "Sunset at Nahargarh with city views" },
          { time: "20:00", activity: "Chokhi Dhani dinner with folk performances" }
        ]
      },
      {
        day: 3,
        title: "Markets & Departure",
        schedule: [
          { time: "08:00", activity: "Breakfast" },
          { time: "09:30", activity: "Shopping - Johari Bazaar (jewelry), Bapu Bazaar (textiles)" },
          { time: "11:30", activity: "Visit Birla Temple" },
          { time: "13:00", activity: "Farewell lunch and departure" }
        ]
      }
    ],
    inclusions: [
      "AC transport",
      "Heritage hotel stay on twin sharing",
      "2 breakfasts, 1 dinner (Chokhi Dhani)",
      "Amber Fort jeep ride",
      "Entry to all monuments",
      "Sightseeing guide",
      "First aid support"
    ],
    exclusions: [
      "Elephant ride (optional)",
      "Personal shopping",
      "Lunches",
      "Tips",
      "Camera fees"
    ],
    images: ["https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80"],
    isActive: true,
    tripStatus: 'upcoming',
    locations: ["Jaipur", "Amber Fort", "Hawa Mahal", "City Palace", "Nahargarh Fort"],
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
