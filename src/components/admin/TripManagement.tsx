import { useState, useMemo } from "react";
import { Power, PowerOff, AlertCircle, Plus, Edit, Trash2, Eye, EyeOff, Copy, Search, Ban, ExternalLink, CalendarPlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

type StatusFilter = "all" | "published" | "draft" | "hidden";

const TripManagement = ({ onRefresh }: TripManagementProps) => {
  const { toast } = useToast();
  const { trips, batches, loading, tripsTableMissing, getAvailableSeats, toggleBookingLive, refetch } = useTrips();
  const [updating, setUpdating] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const handleToggleBookingLive = async (tripId: string, tripName: string, currentStatus: boolean) => {
    const tripBatches = batches.filter(b => b.trip_id === tripId && b.status === 'active');
    const availableSeats = getAvailableSeats(tripId);
    if (!currentStatus && tripBatches.length === 0) {
      toast({ title: "Cannot Enable Booking", description: "Add at least one batch first.", variant: "destructive" });
      return;
    }
    if (!currentStatus && availableSeats === 0) {
      toast({ title: "Cannot Enable Booking", description: "No available seats in any batch.", variant: "destructive" });
      return;
    }
    setUpdating(tripId);
    const success = await toggleBookingLive(tripId, !currentStatus);
    if (success) {
      toast({ title: "Updated", description: `Booking ${!currentStatus ? 'enabled' : 'disabled'} for ${tripName}` });
      onRefresh();
    } else {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
    setUpdating(null);
  };

  const handleToggleActive = async (tripId: string, tripName: string, currentStatus: boolean) => {
    setUpdating(tripId);
    try {
      const { error } = await supabase.from("trips").update({ is_active: !currentStatus }).eq("trip_id", tripId);
      if (error) throw error;
      toast({ title: "Success", description: `${tripName} is now ${!currentStatus ? 'visible' : 'hidden'}` });
      refetch(); onRefresh();
    } catch {
      toast({ title: "Error", description: "Failed to update visibility", variant: "destructive" });
    }
    setUpdating(null);
  };

  const handleDuplicate = async (tripId: string) => {
    setUpdating(tripId);
    try {
      const { data: src, error: fetchErr } = await supabase.from("trips").select("*").eq("trip_id", tripId).maybeSingle();
      if (fetchErr || !src) throw fetchErr || new Error("Trip not found");
      const newId = `${src.trip_id}-copy-${Date.now().toString(36).slice(-4)}`;
      const { id, created_at, updated_at, ...rest } = src as any;
      const payload = {
        ...rest,
        trip_id: newId,
        trip_name: `${src.trip_name} (Copy)`,
        slug: src.slug ? `${src.slug}-copy-${Date.now().toString(36).slice(-4)}` : null,
        is_active: false,
        booking_live: false,
      };
      const { error: insErr } = await supabase.from("trips").insert(payload);
      if (insErr) throw insErr;
      toast({ title: "Trip Duplicated", description: "Created as draft (hidden). Edit and publish when ready." });
      refetch(); onRefresh();
    } catch (e: any) {
      toast({ title: "Duplicate failed", description: e?.message || "Try again", variant: "destructive" });
    }
    setUpdating(null);
  };

  const handleMarkSoldOut = async (tripId: string, tripName: string) => {
    if (!confirm(`Mark all active batches for "${tripName}" as Sold Out? Booking will be disabled.`)) return;
    setUpdating(tripId);
    try {
      const tripBatches = batches.filter(b => b.trip_id === tripId && b.status === 'active');
      for (const b of tripBatches) {
        await supabase.from("batches").update({ available_seats: 0, status: 'closed' }).eq("id", b.id);
      }
      await supabase.from("trips").update({ booking_live: false }).eq("trip_id", tripId);
      toast({ title: "Marked Sold Out", description: `${tripName} closed.` });
      refetch(); onRefresh();
    } catch {
      toast({ title: "Error", description: "Failed to mark sold out", variant: "destructive" });
    }
    setUpdating(null);
  };

  const handleDelete = async (tripId: string, tripName: string) => {
    if (!confirm(`Delete "${tripName}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from("trips").delete().eq("trip_id", tripId);
      if (error) throw error;
      toast({ title: "Deleted", description: "Trip removed" });
      refetch(); onRefresh();
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleCreateTrip = () => { setEditingTripId(null); setEditorOpen(true); };
  const handleEditTrip = (tripId: string) => { setEditingTripId(tripId); setEditorOpen(true); };
  const handleEditorClose = () => { setEditorOpen(false); setEditingTripId(null); };
  const handleEditorSave = () => { setEditorOpen(false); setEditingTripId(null); refetch(); onRefresh(); };

  const getBatchStats = (tripId: string) => {
    const tripBatches = batches.filter(b => b.trip_id === tripId);
    const activeBatches = tripBatches.filter(b => b.status === 'active');
    const totalSeats = activeBatches.reduce((sum, b) => sum + b.batch_size, 0);
    const bookedSeats = activeBatches.reduce((sum, b) => sum + b.seats_booked, 0);
    const nextBatch = [...activeBatches]
      .filter(b => new Date(b.start_date) >= new Date(new Date().toDateString()))
      .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
    return { total: tripBatches.length, active: activeBatches.length, totalSeats, bookedSeats, nextBatch };
  };

  const visibilityStatus = (trip: any): StatusFilter => {
    if (trip.is_active && trip.booking_live) return "published";
    if (!trip.is_active) return "hidden";
    return "draft";
  };

  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (statusFilter !== "all" && visibilityStatus(t) !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${t.trip_name} ${t.locations?.join(" ") || ""} ${t.summary || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [trips, typeFilter, statusFilter, search]);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Control Dashboard</h3>
          <p className="text-sm text-muted-foreground">Manage trips, batches & visibility — inline.</p>
        </div>
        <Button onClick={handleCreateTrip}><Plus className="w-4 h-4 mr-2" />Create New</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2 md:items-center bg-card border border-border rounded-xl p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trip name, destination..." className="pl-9 h-9" />
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {[{ v: "all", l: "All" }, { v: "trip", l: "Trips" }, { v: "experience", l: "Experiences" }].map(o => (
            <button key={o.v} onClick={() => setTypeFilter(o.v)} className={`px-3 py-1.5 text-xs font-semibold ${typeFilter === o.v ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>{o.l}</button>
          ))}
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {[
            { v: "all", l: "All" },
            { v: "published", l: "Live" },
            { v: "draft", l: "Draft" },
            { v: "hidden", l: "Hidden" },
          ].map(o => (
            <button key={o.v} onClick={() => setStatusFilter(o.v as StatusFilter)} className={`px-3 py-1.5 text-xs font-semibold ${statusFilter === o.v ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>{o.l}</button>
          ))}
        </div>
      </div>

      {tripsTableMissing && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm text-destructive">Trips table missing — please contact support.</div>
        </div>
      )}

      {/* Trips List */}
      <div className="grid gap-3">
        {filteredTrips.map((trip) => {
          const stats = getBatchStats(trip.trip_id);
          const availableSeats = getAvailableSeats(trip.trip_id);
          const canBook = trip.booking_live && stats.active > 0 && availableSeats > 0;
          const isUpdating = updating === trip.trip_id;
          const status = visibilityStatus(trip);
          const remaining = stats.totalSeats - stats.bookedSeats;
          const availabilityLabel = stats.totalSeats === 0
            ? "No batches"
            : remaining === 0 ? "Sold Out"
            : remaining / stats.totalSeats <= 0.3 ? "Filling Fast"
            : "Available";
          const availabilityClass = availabilityLabel === "Sold Out" ? "bg-destructive/10 text-destructive"
            : availabilityLabel === "Filling Fast" ? "bg-orange-500/10 text-orange-600"
            : availabilityLabel === "Available" ? "bg-green-500/10 text-green-600"
            : "bg-muted text-muted-foreground";

          return (
            <div key={trip.trip_id} className={`bg-card border border-border rounded-xl p-4 ${!trip.is_active ? 'opacity-70' : ''}`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h4 className="font-semibold text-foreground truncate">{trip.trip_name}</h4>
                    {trip.type === 'experience' && <Badge className="bg-accent/20 text-accent border-accent/30 text-[10px]">Experience</Badge>}
                    <Badge className={
                      status === "published" ? "bg-green-500/15 text-green-600 border-green-500/30 text-[10px]"
                      : status === "draft" ? "bg-yellow-500/15 text-yellow-600 border-yellow-500/30 text-[10px]"
                      : "bg-muted text-muted-foreground text-[10px]"
                    }>
                      {status === "published" ? "🟢 Published" : status === "draft" ? "🟡 Draft" : "⚪ Hidden"}
                    </Badge>
                    <Badge className={`text-[10px] border ${availabilityClass}`}>{availabilityLabel}</Badge>
                    {!canBook && trip.booking_live && (
                      <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">⚠️ No Seats</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{trip.duration}</span>
                    <span>₹{trip.price_default.toLocaleString()}</span>
                    <span>{stats.bookedSeats}/{stats.totalSeats} seats</span>
                    <span>{stats.active} active {trip.type === 'experience' ? 'slots' : 'batches'}</span>
                    {stats.nextBatch && <span>Next: {new Date(stats.nextBatch.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50">
                    <Label htmlFor={`active-${trip.trip_id}`} className="text-xs flex items-center gap-1 cursor-pointer">
                      {trip.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}Visible
                    </Label>
                    <Switch id={`active-${trip.trip_id}`} checked={trip.is_active} onCheckedChange={() => handleToggleActive(trip.trip_id, trip.trip_name, trip.is_active)} disabled={isUpdating} />
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50">
                    <Label htmlFor={`booking-${trip.trip_id}`} className="text-xs cursor-pointer">Live</Label>
                    <Switch id={`booking-${trip.trip_id}`} checked={trip.booking_live} onCheckedChange={() => handleToggleBookingLive(trip.trip_id, trip.trip_name, trip.booking_live)} disabled={isUpdating} />
                    {trip.booking_live ? <Power className="w-4 h-4 text-green-600" /> : <PowerOff className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="sm" title="Edit" onClick={() => handleEditTrip(trip.trip_id)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" title="Duplicate Trip" onClick={() => handleDuplicate(trip.trip_id)} disabled={isUpdating}><Copy className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" title="Preview" asChild>
                      <a href={`/trips/${trip.trip_id}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                    </Button>
                    {stats.active > 0 && (
                      <Button variant="ghost" size="sm" title="Mark Sold Out" className="text-orange-600 hover:text-orange-700" onClick={() => handleMarkSoldOut(trip.trip_id, trip.trip_name)} disabled={isUpdating}>
                        <Ban className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" title="Delete" className="text-destructive hover:text-destructive" onClick={() => handleDelete(trip.trip_id, trip.trip_name)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTrips.length === 0 && !tripsTableMissing && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No trips match the current filters</p>
        </div>
      )}

      {editorOpen && (
        <TripEditor tripId={editingTripId} onClose={handleEditorClose} onSave={handleEditorSave} />
      )}
    </div>
  );
};

export default TripManagement;
