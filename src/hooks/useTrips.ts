import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trips as staticTrips, Trip } from "@/data/trips";

export interface DatabaseTrip {
  id: string;
  trip_id: string;
  trip_name: string;
  price_default: number;
  price_from_pune: number | null;
  price_from_mumbai: number | null;
  duration: string;
  summary: string | null;
  highlights: string[];
  locations: string[];
  images: string[];
  is_active: boolean;
  booking_live: boolean;
  capacity: number;
  advance_amount: number;
  inclusions: string[];
  exclusions: string[];
  contact_phone: string | null;
  contact_email: string | null;
  notes: string | null;
}

interface Batch {
  id: string;
  trip_id: string;
  status: string;
  batch_size: number;
  seats_booked: number;
  start_date: string;
  end_date: string;
  batch_name: string;
}

interface TripDbRecord {
  trip_id: string;
  booking_live: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const convertStaticToDbTrip = (trip: Trip, bookingLive: boolean = false): DatabaseTrip => {
  return {
    id: trip.tripId,
    trip_id: trip.tripId,
    trip_name: trip.tripName,
    price_default: typeof trip.price === "number" ? trip.price : trip.price.default,
    price_from_pune: typeof trip.price === "object" ? (trip.price.fromPune || null) : null,
    price_from_mumbai: typeof trip.price === "object" ? (trip.price.fromMumbai || null) : null,
    duration: trip.duration,
    summary: trip.summary,
    highlights: trip.highlights || [],
    locations: trip.locations || [],
    images: trip.images,
    is_active: trip.isActive,
    booking_live: bookingLive,
    capacity: trip.capacity || 40,
    advance_amount: trip.booking?.advance || 2000,
    inclusions: trip.inclusions || [],
    exclusions: trip.exclusions || [],
    contact_phone: trip.contact?.phone || null,
    contact_email: trip.contact?.email || null,
    notes: trip.notes || null,
  };
};

export const useTrips = () => {
  const [trips, setTrips] = useState<DatabaseTrip[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripsTableMissing, setTripsTableMissing] = useState(false);

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch batches from database (source of truth for availability)
      const { data: dbBatches, error: batchesError } = await supabase
        .from("batches")
        .select("*")
        .order("start_date");

      if (batchesError) throw batchesError;
      setBatches((dbBatches || []) as Batch[]);

      // Try to fetch full trips from database first
      let dbTrips: DatabaseTrip[] = [];
      let bookingStatusMap: Record<string, boolean> = {};

      if (SUPABASE_URL && SUPABASE_KEY) {
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/trips?select=*`, {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
          });

          if (response.ok) {
            setTripsTableMissing(false);
            const tripData = await response.json();
            if (tripData && tripData.length > 0) {
              dbTrips = tripData.map((t: any) => ({
                id: t.id || t.trip_id,
                trip_id: t.trip_id,
                trip_name: t.trip_name,
                price_default: t.price_default || 0,
                price_from_pune: t.price_from_pune,
                price_from_mumbai: t.price_from_mumbai,
                duration: t.duration || "",
                summary: t.summary || "",
                highlights: t.highlights || [],
                locations: t.locations || [],
                images: t.images || [],
                is_active: t.is_active ?? true,
                booking_live: t.booking_live ?? false,
                capacity: t.capacity || 30,
                advance_amount: t.advance_amount || 2000,
                inclusions: t.inclusions || [],
                exclusions: t.exclusions || [],
                contact_phone: t.contact_phone,
                contact_email: t.contact_email,
                notes: t.notes,
              }));
            }
            tripData.forEach((t: any) => {
              bookingStatusMap[t.trip_id] = !!t.booking_live;
            });
          } else {
            setTripsTableMissing(true);
          }
        } catch {
          setTripsTableMissing(true);
        }
      } else {
        setTripsTableMissing(true);
      }

      // Use DB trips if available, otherwise fall back to static
      if (dbTrips.length > 0) {
        setTrips(dbTrips);
      } else {
        const convertedTrips = staticTrips
          .filter((t) => t.isActive)
          .map((trip) => convertStaticToDbTrip(trip, bookingStatusMap[trip.tripId] ?? false));
        setTrips(convertedTrips);
      }
    } catch (err: any) {
      setTrips(staticTrips.filter((t) => t.isActive).map((t) => convertStaticToDbTrip(t, false)));
      setError(err?.message || "Failed to load trips");
      console.error("Error fetching trips:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const seatsRemaining = useCallback((batch: Batch) => {
    return Math.max(0, batch.batch_size - batch.seats_booked);
  }, []);

  // FINAL bookable logic:
  // booking_live === true AND at least one active batch exists AND batch has seats_remaining > 0
  const isTripBookable = useCallback(
    (tripId: string): boolean => {
      const trip = trips.find((t) => t.trip_id === tripId);
      if (!trip?.booking_live) return false;

      const tripBatches = batches.filter((b) => b.trip_id === tripId && b.status === "active");
      if (tripBatches.length === 0) return false;

      return tripBatches.some((b) => seatsRemaining(b) > 0);
    },
    [trips, batches, seatsRemaining]
  );

  const toggleBookingLive = async (tripId: string, status: boolean): Promise<boolean> => {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      setTripsTableMissing(true);
      return false;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${SUPABASE_KEY}`;

      // Check if record exists
      const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/trips?trip_id=eq.${tripId}&select=trip_id`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: authHeader,
        },
      });

      if (!checkResponse.ok) {
        setTripsTableMissing(true);
        return false;
      }

      const existingRows: Array<{ trip_id: string }> = await checkResponse.json();

      if (existingRows.length > 0) {
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/trips?trip_id=eq.${tripId}`, {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: authHeader,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ booking_live: status }),
        });

        if (!updateResponse.ok) throw new Error("Failed to update trip booking status");
      } else {
        const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/trips`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ trip_id: tripId, booking_live: status }),
        });

        if (!insertResponse.ok) throw new Error("Failed to create trip booking status");
      }

      await fetchTrips();
      return true;
    } catch (err) {
      console.error("Error toggling booking live:", err);
      setTripsTableMissing(true);
      return false;
    }
  };

  const getBookableTrips = useCallback((): DatabaseTrip[] => {
    return trips.filter((trip) => isTripBookable(trip.trip_id));
  }, [trips, isTripBookable]);

  const getUpcomingTrips = useCallback((): DatabaseTrip[] => {
    return trips.filter((trip) => !isTripBookable(trip.trip_id));
  }, [trips, isTripBookable]);

  const getPopularDestinations = useCallback((limit: number = 6): DatabaseTrip[] => {
    return trips.slice(0, limit);
  }, [trips]);

  const getTrip = useCallback(
    (tripId: string): DatabaseTrip | undefined => {
      return trips.find((t) => t.trip_id === tripId);
    },
    [trips]
  );

  const getTripPrice = (trip: DatabaseTrip): number => {
    return trip.price_default;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getTripBatches = useCallback(
    (tripId: string): Batch[] => {
      return batches.filter((b) => b.trip_id === tripId && b.status === "active");
    },
    [batches]
  );

  const hasBatches = useCallback(
    (tripId: string): boolean => {
      return batches.some((b) => b.trip_id === tripId && b.status === "active");
    },
    [batches]
  );

  const getAvailableSeats = useCallback(
    (tripId: string): number => {
      const tripBatches = getTripBatches(tripId);
      return tripBatches.reduce((total, b) => total + seatsRemaining(b), 0);
    },
    [getTripBatches, seatsRemaining]
  );

  return {
    trips,
    batches,
    loading,
    error,
    tripsTableMissing,
    isTripBookable,
    getBookableTrips,
    getUpcomingTrips,
    getPopularDestinations,
    getTrip,
    getTripPrice,
    formatPrice,
    getTripBatches,
    hasBatches,
    getAvailableSeats,
    toggleBookingLive,
    refetch: fetchTrips,
  };
};

export default useTrips;

