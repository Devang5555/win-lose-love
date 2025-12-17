import { useState, useEffect } from "react";
import { Power, PowerOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trips as staticTrips } from "@/data/trips";

interface Trip {
  id: string;
  trip_id: string;
  trip_name: string;
  price_default: number;
  duration: string;
  booking_live: boolean;
  is_active: boolean;
  capacity: number;
}

interface Batch {
  id: string;
  trip_id: string;
  status: string;
  batch_size: number;
  seats_booked: number;
}

interface TripManagementProps {
  onRefresh: () => void;
}

// Trip booking status stored in localStorage
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

const TripManagement = ({ onRefresh }: TripManagementProps) => {
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: dbBatches } = await supabase
        .from('batches')
        .select('id, trip_id, status, batch_size, seats_booked');

      if (dbBatches) {
        setBatches(dbBatches as Batch[]);
      }

      // Use static trips with localStorage booking status
      const bookingStatus = getBookingLiveStatus();
      setTrips(staticTrips.map(t => ({
        id: t.tripId,
        trip_id: t.tripId,
        trip_name: t.tripName,
        price_default: typeof t.price === 'number' ? t.price : t.price.default,
        duration: t.duration,
        booking_live: bookingStatus[t.tripId] ?? false,
        is_active: t.isActive,
        capacity: t.capacity || 40
      })));
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookingLive = async (trip: Trip) => {
    // Check if trip has batches before enabling
    const tripBatches = batches.filter(b => b.trip_id === trip.trip_id && b.status === 'active');
    const hasAvailableSeats = tripBatches.some(b => b.batch_size - b.seats_booked > 0);

    if (!trip.booking_live && tripBatches.length === 0) {
      toast({
        title: "Cannot Enable Booking",
        description: "Please add at least one batch before launching this trip.",
        variant: "destructive",
      });
      return;
    }

    if (!trip.booking_live && !hasAvailableSeats) {
      toast({
        title: "Cannot Enable Booking",
        description: "No available seats in any batch. Please add more seats or create a new batch.",
        variant: "destructive",
      });
      return;
    }

    setUpdating(trip.trip_id);

    // Update localStorage
    setBookingLiveStatus(trip.trip_id, !trip.booking_live);

    toast({
      title: "Success",
      description: `Booking ${!trip.booking_live ? 'enabled' : 'disabled'} for ${trip.trip_name}`,
    });

    // Refresh state
    const bookingStatus = getBookingLiveStatus();
    setTrips(prev => prev.map(t => ({
      ...t,
      booking_live: bookingStatus[t.trip_id] ?? false
    })));
    
    onRefresh();
    setUpdating(null);
  };

  const getBatchStats = (tripId: string) => {
    const tripBatches = batches.filter(b => b.trip_id === tripId);
    const activeBatches = tripBatches.filter(b => b.status === 'active');
    const totalSeats = activeBatches.reduce((sum, b) => sum + b.batch_size, 0);
    const bookedSeats = activeBatches.reduce((sum, b) => sum + b.seats_booked, 0);
    return { total: tripBatches.length, active: activeBatches.length, totalSeats, bookedSeats };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Trip Booking Control</h3>
          <p className="text-sm text-muted-foreground">Enable or disable booking for each trip</p>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-amber-700">Booking Live Logic</p>
          <p className="text-amber-600 mt-1">
            A trip is bookable ONLY when: Booking Live is ON + At least one active batch exists + Batch has available seats.
          </p>
        </div>
      </div>

      {/* Trips List */}
      <div className="grid gap-4">
        {trips.filter(t => t.is_active).map((trip) => {
          const stats = getBatchStats(trip.trip_id);
          const canBook = trip.booking_live && stats.active > 0 && stats.bookedSeats < stats.totalSeats;
          const isUpdating = updating === trip.trip_id;

          return (
            <div
              key={trip.trip_id}
              className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-foreground">{trip.trip_name}</h4>
                  {canBook ? (
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                      🟢 Booking Open
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                      🟡 Launching Soon
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>{trip.duration}</span>
                  <span>₹{trip.price_default.toLocaleString()}</span>
                  <span>{stats.total} batches ({stats.active} active)</span>
                  <span>{stats.bookedSeats}/{stats.totalSeats} seats booked</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor={`booking-${trip.trip_id}`} className="text-sm font-medium">
                    Booking Live
                  </Label>
                  <Switch
                    id={`booking-${trip.trip_id}`}
                    checked={trip.booking_live}
                    onCheckedChange={() => toggleBookingLive(trip)}
                    disabled={isUpdating}
                  />
                </div>
                {trip.booking_live ? (
                  <Power className="w-5 h-5 text-green-600" />
                ) : (
                  <PowerOff className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {trips.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No trips found</p>
        </div>
      )}
    </div>
  );
};

export default TripManagement;
