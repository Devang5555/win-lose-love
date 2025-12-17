import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { trips as staticTrips, Trip, getBookableTrips as staticGetBookableTrips, getUpcomingTrips as staticGetUpcomingTrips } from '@/data/trips';

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

// Trip booking status stored in localStorage as fallback (until DB table is created)
const BOOKING_LIVE_KEY = 'gobhraman_booking_live';

const getBookingLiveStatus = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem(BOOKING_LIVE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const setBookingLiveStatus = (tripId: string, status: boolean) => {
  const current = getBookingLiveStatus();
  current[tripId] = status;
  localStorage.setItem(BOOKING_LIVE_KEY, JSON.stringify(current));
};

// Convert static trip to database format
const convertStaticToDbTrip = (trip: Trip): DatabaseTrip => {
  const bookingStatus = getBookingLiveStatus();
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
    booking_live: bookingStatus[trip.tripId] ?? false,
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

  const fetchTrips = async () => {
    try {
      // Fetch batches from database
      const { data: dbBatches, error: batchesError } = await supabase
        .from('batches')
        .select('*')
        .order('start_date');

      if (!batchesError && dbBatches) {
        setBatches(dbBatches as Batch[]);
      }

      // Use static trips with booking_live from localStorage
      setTrips(staticTrips.filter(t => t.isActive).map(convertStaticToDbTrip));
    } catch (err: any) {
      setTrips(staticTrips.filter(t => t.isActive).map(convertStaticToDbTrip));
      setError(err.message);
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  // Check if a trip is bookable (booking_live + has active batch with seats)
  const isTripBookable = (tripId: string): boolean => {
    const trip = trips.find(t => t.trip_id === tripId);
    if (!trip) return false;
    
    // booking_live must be true AND must have active batch with seats
    if (!trip.booking_live) return false;

    const tripBatches = batches.filter(b => b.trip_id === tripId && b.status === 'active');
    return tripBatches.some(b => b.batch_size - b.seats_booked > 0);
  };

  // Toggle booking live status
  const toggleBookingLive = (tripId: string, status: boolean) => {
    setBookingLiveStatus(tripId, status);
    // Refresh trips to reflect the change
    setTrips(staticTrips.filter(t => t.isActive).map(convertStaticToDbTrip));
  };

  // Get bookable trips
  const getBookableTrips = (): DatabaseTrip[] => {
    return trips.filter(trip => isTripBookable(trip.trip_id));
  };

  // Get upcoming trips (not bookable)
  const getUpcomingTrips = (): DatabaseTrip[] => {
    return trips.filter(trip => !isTripBookable(trip.trip_id));
  };

  // Get trip by ID
  const getTrip = (tripId: string): DatabaseTrip | undefined => {
    return trips.find(t => t.trip_id === tripId);
  };

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
  const getTripBatches = (tripId: string): Batch[] => {
    return batches.filter(b => b.trip_id === tripId && b.status === 'active');
  };

  // Check if trip has any batches
  const hasBatches = (tripId: string): boolean => {
    return batches.some(b => b.trip_id === tripId);
  };

  // Get available seats for a trip
  const getAvailableSeats = (tripId: string): number => {
    const tripBatches = getTripBatches(tripId);
    return tripBatches.reduce((total, b) => total + (b.batch_size - b.seats_booked), 0);
  };

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
