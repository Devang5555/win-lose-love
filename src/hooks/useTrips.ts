import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { trips as staticTrips, Trip } from '@/data/trips';

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

// Database record for trip booking status
interface TripDbRecord {
  trip_id: string;
  booking_live: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Convert static trip to database format
const convertStaticToDbTrip = (trip: Trip, bookingLive: boolean = false): DatabaseTrip => {
  return {
    id: trip.tripId,
    trip_id: trip.tripId,
    trip_name: trip.tripName,
    price_default: typeof trip.price === 'number' ? trip.price : trip.price.default,
    price_from_pune: typeof trip.price === 'object' ? (trip.price.fromPune || null) : null,
    price_from_mumbai: typeof trip.price === 'object' ? (trip.price.fromMumbai || null) : null,
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

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch batches from database
      const { data: dbBatches, error: batchesError } = await supabase
        .from('batches')
        .select('*')
        .order('start_date');

      if (!batchesError && dbBatches) {
        setBatches(dbBatches as Batch[]);
      }

      // Fetch booking_live status from trips table using REST API
      let bookingStatusMap: Record<string, boolean> = {};
      
      if (SUPABASE_URL && SUPABASE_KEY) {
        try {
          const response = await fetch(
            `${SUPABASE_URL}/rest/v1/trips?select=trip_id,booking_live`,
            {
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
              }
            }
          );
          
          if (response.ok) {
            const tripStatus: TripDbRecord[] = await response.json();
            tripStatus.forEach((t) => {
              bookingStatusMap[t.trip_id] = t.booking_live;
            });
          }
        } catch (fetchErr) {
          console.log('Trips table may not exist yet, using defaults');
        }
      }

      // Convert static trips with booking_live from database
      const convertedTrips = staticTrips
        .filter(t => t.isActive)
        .map(trip => convertStaticToDbTrip(trip, bookingStatusMap[trip.tripId] ?? false));
      
      setTrips(convertedTrips);
    } catch (err: any) {
      setTrips(staticTrips.filter(t => t.isActive).map(t => convertStaticToDbTrip(t, false)));
      setError(err.message);
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Check if a trip is bookable (booking_live + has active batch with seats)
  const isTripBookable = useCallback((tripId: string): boolean => {
    const trip = trips.find(t => t.trip_id === tripId);
    if (!trip) return false;
    
    // booking_live must be true AND must have active batch with seats
    if (!trip.booking_live) return false;

    const tripBatches = batches.filter(b => b.trip_id === tripId && b.status === 'active');
    return tripBatches.some(b => b.batch_size - b.seats_booked > 0);
  }, [trips, batches]);

  // Toggle booking live status in database
  const toggleBookingLive = async (tripId: string, status: boolean): Promise<boolean> => {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('Supabase not configured');
      return false;
    }

    try {
      const staticTrip = staticTrips.find(t => t.tripId === tripId);
      if (!staticTrip) throw new Error('Trip not found');

      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      const authHeader = session?.access_token 
        ? `Bearer ${session.access_token}` 
        : `Bearer ${SUPABASE_KEY}`;

      // First check if record exists
      const checkResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/trips?trip_id=eq.${tripId}&select=id`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': authHeader,
          }
        }
      );
      
      const existingRows = await checkResponse.json();
      
      if (existingRows.length > 0) {
        // Update existing record
        await fetch(
          `${SUPABASE_URL}/rest/v1/trips?trip_id=eq.${tripId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': authHeader,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ booking_live: status })
          }
        );
      } else {
        // Insert new record
        await fetch(
          `${SUPABASE_URL}/rest/v1/trips`,
          {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': authHeader,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              trip_id: tripId,
              trip_name: staticTrip.tripName,
              price_default: typeof staticTrip.price === 'number' ? staticTrip.price : staticTrip.price.default,
              duration: staticTrip.duration,
              booking_live: status,
              is_active: true,
              capacity: staticTrip.capacity || 40,
              advance_amount: staticTrip.booking?.advance || 2000,
            })
          }
        );
      }

      // Refresh trips to reflect the change
      await fetchTrips();
      return true;
    } catch (err: any) {
      console.error('Error toggling booking live:', err);
      return false;
    }
  };

  // Get bookable trips
  const getBookableTrips = useCallback((): DatabaseTrip[] => {
    return trips.filter(trip => isTripBookable(trip.trip_id));
  }, [trips, isTripBookable]);

  // Get upcoming trips (not bookable)
  const getUpcomingTrips = useCallback((): DatabaseTrip[] => {
    return trips.filter(trip => !isTripBookable(trip.trip_id));
  }, [trips, isTripBookable]);

  // Get trip by ID
  const getTrip = useCallback((tripId: string): DatabaseTrip | undefined => {
    return trips.find(t => t.trip_id === tripId);
  }, [trips]);

  // Get trip price
  const getTripPrice = (trip: DatabaseTrip): number => {
    return trip.price_default;
  };

  // Format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Get available batches for a trip
  const getTripBatches = useCallback((tripId: string): Batch[] => {
    return batches.filter(b => b.trip_id === tripId && b.status === 'active');
  }, [batches]);

  // Check if trip has any batches
  const hasBatches = useCallback((tripId: string): boolean => {
    return batches.some(b => b.trip_id === tripId && b.status === 'active');
  }, [batches]);

  // Get available seats for a trip
  const getAvailableSeats = useCallback((tripId: string): number => {
    const tripBatches = getTripBatches(tripId);
    return tripBatches.reduce((total, b) => total + (b.batch_size - b.seats_booked), 0);
  }, [getTripBatches]);

  return {
    trips,
    batches,
    loading,
    error,
    isTripBookable,
    getBookableTrips,
    getUpcomingTrips,
    getTrip,
    getTripPrice,
    formatPrice,
    getTripBatches,
    hasBatches,
    getAvailableSeats,
    toggleBookingLive,
    refetch: fetchTrips
  };
};

export default useTrips;
