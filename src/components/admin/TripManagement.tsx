import { useState } from "react";
import { Power, PowerOff, AlertCircle, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTrips } from "@/hooks/useTrips";
import { supabase } from "@/integrations/supabase/client";
import TripEditor from "./TripEditor";

interface TripManagementProps {
  onRefresh: () => void;
}

const TripManagement = ({ onRefresh }: TripManagementProps) => {
  const { toast } = useToast();
  const { trips, batches, loading, tripsTableMissing, getAvailableSeats, toggleBookingLive, refetch } = useTrips();
  const [updating, setUpdating] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);

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

  const handleToggleActive = async (tripId: string, tripName: string, currentStatus: boolean) => {
    setUpdating(tripId);

    try {
      const { error } = await supabase
        .from("trips")
        .update({ is_active: !currentStatus })
        .eq("trip_id", tripId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${tripName} is now ${!currentStatus ? 'visible' : 'hidden'}`,
      });
      refetch();
      onRefresh();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update trip visibility", variant: "destructive" });
    }

    setUpdating(null);
  };

  const handleDelete = async (tripId: string, tripName: string) => {
    if (!confirm(`Are you sure you want to delete "${tripName}"? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("trip_id", tripId);

      if (error) throw error;

      toast({ title: "Success", description: "Trip deleted successfully" });
      refetch();
      onRefresh();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete trip", variant: "destructive" });
    }
  };

  const handleCreateTrip = () => {
    setEditingTripId(null);
    setEditorOpen(true);
  };

  const handleEditTrip = (tripId: string) => {
    setEditingTripId(tripId);
    setEditorOpen(true);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setEditingTripId(null);
  };

  const handleEditorSave = () => {
    setEditorOpen(false);
    setEditingTripId(null);
    refetch();
    onRefresh();
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
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Trip Management</h3>
          <p className="text-sm text-muted-foreground">Create, edit, and manage your trips</p>
        </div>
        <Button onClick={handleCreateTrip}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Trip
        </Button>
      </div>

      {/* Important Notice */}
      {tripsTableMissing ? (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-destructive">Trip table is missing</p>
            <p className="text-muted-foreground mt-1">
              The "trips" table needs to be created in your database to manage trips. Please create the table with all required columns.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-700">Booking Live Logic</p>
            <p className="text-amber-600 mt-1">
              A trip is bookable ONLY when: Booking Live is ON + At least one active batch exists + Batch has available seats.
            </p>
          </div>
        </div>
      )}

      {/* Trips List */}
      <div className="grid gap-4">
        {trips.map((trip) => {
          const stats = getBatchStats(trip.trip_id);
          const availableSeats = getAvailableSeats(trip.trip_id);
          const canBook = trip.booking_live && stats.active > 0 && availableSeats > 0;
          const isUpdating = updating === trip.trip_id;

          return (
            <div
              key={trip.trip_id}
              className={`bg-card border border-border rounded-xl p-4 ${!trip.is_active ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Trip Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h4 className="font-semibold text-foreground">{trip.trip_name}</h4>
                    {canBook ? (
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                        🟢 Booking Open
                      </Badge>
                    ) : trip.booking_live ? (
                      <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                        ⚠️ No Seats
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                        🟡 Launching Soon
                      </Badge>
                    )}
                    {!trip.is_active && (
                      <Badge className="bg-muted text-muted-foreground">Hidden</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>{trip.duration}</span>
                    <span>₹{trip.price_default.toLocaleString()}</span>
                    <span>{stats.total} batches ({stats.active} active)</span>
                    <span>{stats.bookedSeats}/{stats.totalSeats} seats booked</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Visibility Toggle */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${trip.trip_id}`} className="text-sm font-medium flex items-center gap-1">
                      {trip.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      Visible
                    </Label>
                    <Switch
                      id={`active-${trip.trip_id}`}
                      checked={trip.is_active}
                      onCheckedChange={() => handleToggleActive(trip.trip_id, trip.trip_name, trip.is_active)}
                      disabled={isUpdating}
                    />
                  </div>

                  {/* Booking Live Toggle */}
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
                    {trip.booking_live ? (
                      <Power className="w-5 h-5 text-green-600" />
                    ) : (
                      <PowerOff className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Edit/Delete */}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditTrip(trip.trip_id)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(trip.trip_id, trip.trip_name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {trips.length === 0 && !tripsTableMissing && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No trips found</p>
          <p className="text-sm mt-1">Create your first trip to get started</p>
        </div>
      )}

      {/* Trip Editor Modal */}
      {editorOpen && (
        <TripEditor
          tripId={editingTripId}
          onClose={handleEditorClose}
          onSave={handleEditorSave}
        />
      )}
    </div>
  );
};

export default TripManagement;
