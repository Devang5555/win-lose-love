import { useState, useEffect } from "react";
import { Power, PowerOff, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTrips } from "@/hooks/useTrips";

interface TripManagementProps {
  onRefresh: () => void;
}

const TripManagement = ({ onRefresh }: TripManagementProps) => {
  const { toast } = useToast();
  const { trips, batches, loading, hasBatches, getAvailableSeats, toggleBookingLive, refetch } = useTrips();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleToggleBookingLive = async (tripId: string, tripName: string, currentStatus: boolean) => {
    // Check if trip has batches before enabling
    const tripBatches = batches.filter(b => b.trip_id === tripId && b.status === 'active');
    const availableSeats = getAvailableSeats(tripId);

    if (!currentStatus && tripBatches.length === 0) {
      toast({
        title: "Cannot Enable Booking",
        description: "Please add at least one batch before launching this trip.",
        variant: "destructive",
      });
      return;
    }

    if (!currentStatus && availableSeats === 0) {
      toast({
        title: "Cannot Enable Booking",
        description: "No available seats in any batch. Please add more seats or create a new batch.",
        variant: "destructive",
      });
      return;
    }

    setUpdating(tripId);

    const success = await toggleBookingLive(tripId, !currentStatus);

    if (success) {
      toast({
        title: "Trip booking status updated successfully",
        description: `Booking ${!currentStatus ? 'enabled' : 'disabled'} for ${tripName}`,
      });
      onRefresh();
    } else {
      toast({
        title: "Error",
        description: "Failed to update booking status. Please try again.",
        variant: "destructive",
      });
    }

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
                    onCheckedChange={() => handleToggleBookingLive(trip.trip_id, trip.trip_name, trip.booking_live)}
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
