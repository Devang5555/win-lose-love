import { useState, useMemo } from "react";
import {
  Power, PowerOff, AlertCircle, Plus, Edit, Trash2, Eye, EyeOff, Copy, Search, Ban,
  ExternalLink, Archive, RotateCcw, CheckSquare, Square, Star, Sparkles, Flame, Wind,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTrips } from "@/hooks/useTrips";
import { supabase } from "@/integrations/supabase/client";
import TripEditor from "./TripEditor";
import {
  FEATURED_TAGS, FEATURED_TAG_LABELS, FeaturedTagKey,
  hasFeaturedTag, toggleFeaturedTag, ALL_FEATURED_TAGS,
} from "@/lib/featuredTags";

interface TripManagementProps {
  onRefresh: () => void;
}

type StatusFilter = "all" | "published" | "draft" | "hidden";

const FEATURED_KEYS: FeaturedTagKey[] = ["featured", "trending", "womenOnly", "weekend"];
const FEATURED_ICONS: Record<FeaturedTagKey, React.ComponentType<{ className?: string }>> = {
  featured: Star, trending: Flame, womenOnly: Sparkles, weekend: Wind,
};

const TripManagement = ({ onRefresh }: TripManagementProps) => {
  const { toast } = useToast();
  const { trips, batches, loading, tripsTableMissing, getAvailableSeats, toggleBookingLive, refetch } = useTrips();
  const [updating, setUpdating] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedTagKey | "all">("all");
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState("");

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

  const handleSavePrice = async (tripId: string) => {
    const newPrice = parseInt(priceDraft, 10);
    if (isNaN(newPrice) || newPrice < 0) {
      toast({ title: "Invalid price", variant: "destructive" });
      return;
    }
    setUpdating(tripId);
    const { error } = await supabase.from("trips").update({ price_default: newPrice }).eq("trip_id", tripId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Price updated" }); refetch(); onRefresh(); }
    setEditingPrice(null);
    setUpdating(null);
  };

  const handleToggleFeatured = async (trip: any, key: FeaturedTagKey) => {
    setUpdating(trip.trip_id);
    const nextTags = toggleFeaturedTag(trip.tags, key);
    const { error } = await supabase.from("trips").update({ tags: nextTags }).eq("trip_id", trip.trip_id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { refetch(); onRefresh(); }
    setUpdating(null);
  };

  const handleDuplicate = async (tripId: string) => {
    setUpdating(tripId);
    try {
      const { data: src, error: fetchErr } = await supabase.from("trips").select("*").eq("trip_id", tripId).maybeSingle();
      if (fetchErr || !src) throw fetchErr || new Error("Trip not found");
      const newId = `${src.trip_id}-copy-${Date.now().toString(36).slice(-4)}`;
      const { id, created_at, updated_at, ...rest } = src as any;
      // Strip homepage curation tags so duplicates start un-featured
      const cleanedTags = ((rest.tags || []) as string[]).filter((t) => !ALL_FEATURED_TAGS.includes(t));
      const payload = {
        ...rest,
        trip_id: newId,
        trip_name: `${src.trip_name} (Copy)`,
        slug: src.slug ? `${src.slug}-copy-${Date.now().toString(36).slice(-4)}` : null,
        is_active: false,
        booking_live: false,
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
        tags: cleanedTags,
      };
      const { error: insErr } = await supabase.from("trips").insert(payload);
      if (insErr) throw insErr;
      toast({ title: "Duplicated", description: "Created as draft (hidden). Edit and publish when ready." });
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

  const handleSoftDelete = async (tripId: string, tripName: string) => {
    if (!confirm(`Move "${tripName}" to Deleted? You can restore it any time.`)) return;
    const { error } = await supabase
      .from("trips")
      .update({ is_deleted: true, is_active: false, booking_live: false, deleted_at: new Date().toISOString() })
      .eq("trip_id", tripId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Moved to Deleted", description: `Restore from “Show Deleted”.` }); refetch(); onRefresh(); }
  };

  const handleRestore = async (tripId: string) => {
    const { error } = await supabase
      .from("trips")
      .update({ is_deleted: false, deleted_at: null, deleted_by: null })
      .eq("trip_id", tripId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Restored" }); refetch(); onRefresh(); }
  };

  const handleAutoArchive = async () => {
    const { data, error } = await supabase.rpc("auto_archive_expired_batches");
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Auto-archive complete", description: `${data ?? 0} expired batch(es) archived.` });
    refetch(); onRefresh();
  };

  // --- Bulk actions ---
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const bulkUpdate = async (patch: Record<string, any>, label: string) => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from("trips").update(patch).in("trip_id", ids);
    if (error) toast({ title: "Bulk failed", description: error.message, variant: "destructive" });
    else { toast({ title: label, description: `${ids.length} item(s) updated.` }); refetch(); onRefresh(); clearSelection(); }
  };

  const bulkDuplicate = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Duplicate ${selected.size} item(s) as drafts?`)) return;
    for (const id of Array.from(selected)) await handleDuplicate(id);
    clearSelection();
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
    return trips.filter((t: any) => {
      const isDeleted = !!t.is_deleted;
      if (showDeleted ? !isDeleted : isDeleted) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (statusFilter !== "all" && visibilityStatus(t) !== statusFilter) return false;
      if (featuredFilter !== "all" && !hasFeaturedTag(t.tags, featuredFilter)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${t.trip_name} ${t.locations?.join(" ") || ""} ${t.summary || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [trips, typeFilter, statusFilter, featuredFilter, search, showDeleted]);

  const allOnPageSelected = filteredTrips.length > 0 && filteredTrips.every((t) => selected.has(t.trip_id));
  const togglePageSelection = () => {
    if (allOnPageSelected) {
      const next = new Set(selected);
      filteredTrips.forEach((t) => next.delete(t.trip_id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filteredTrips.forEach((t) => next.add(t.trip_id));
      setSelected(next);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Control Dashboard</h3>
          <p className="text-sm text-muted-foreground">Manage trips, experiences, batches & visibility — inline.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAutoArchive} title="Archive batches whose end date has passed">
            <Archive className="w-4 h-4 mr-2" />Auto-archive expired
          </Button>
          <Button onClick={handleCreateTrip}><Plus className="w-4 h-4 mr-2" />Create New</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2 md:items-center bg-card border border-border rounded-xl p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trip name, destination..." className="pl-9 h-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {[{ v: "all", l: "All" }, { v: "trip", l: "Trips" }, { v: "experience", l: "Experiences" }].map(o => (
              <button key={o.v} onClick={() => setTypeFilter(o.v)} className={`px-3 py-1.5 text-xs font-semibold ${typeFilter === o.v ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>{o.l}</button>
            ))}
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {[
              { v: "all", l: "All" }, { v: "published", l: "Live" },
              { v: "draft", l: "Draft" }, { v: "hidden", l: "Hidden" },
            ].map(o => (
              <button key={o.v} onClick={() => setStatusFilter(o.v as StatusFilter)} className={`px-3 py-1.5 text-xs font-semibold ${statusFilter === o.v ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>{o.l}</button>
            ))}
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setFeaturedFilter("all")} className={`px-3 py-1.5 text-xs font-semibold ${featuredFilter === "all" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>Any</button>
            {FEATURED_KEYS.map((k) => (
              <button key={k} onClick={() => setFeaturedFilter(k)} className={`px-3 py-1.5 text-xs font-semibold ${featuredFilter === k ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>{FEATURED_TAG_LABELS[k]}</button>
            ))}
          </div>
          <button
            onClick={() => setShowDeleted((v) => !v)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border border-border ${showDeleted ? "bg-destructive/10 text-destructive" : "bg-card text-muted-foreground hover:bg-muted"}`}
          >
            {showDeleted ? "Showing Deleted" : "Show Deleted"}
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-primary/5 border border-primary/30 rounded-xl p-3 flex flex-wrap items-center gap-2 sticky top-0 z-10">
          <span className="text-sm font-semibold text-primary">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ is_active: true, booking_live: true }, "Published")}>
              Publish
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ booking_live: false }, "Unpublished")}>
              Unpublish
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ is_active: false, booking_live: false }, "Hidden")}>
              Hide
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ booking_live: false }, "Marked Sold Out")}>
              <Ban className="w-3.5 h-3.5 mr-1" />Sold Out
            </Button>
            <Button size="sm" variant="outline" onClick={bulkDuplicate}>
              <Copy className="w-3.5 h-3.5 mr-1" />Duplicate
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate({ is_deleted: true, is_active: false, booking_live: false, deleted_at: new Date().toISOString() }, "Archived")}>
              <Archive className="w-3.5 h-3.5 mr-1" />Archive
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>Clear</Button>
          </div>
        </div>
      )}

      {tripsTableMissing && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm text-destructive">Trips table missing — please contact support.</div>
        </div>
      )}

      {/* Page select-all */}
      {filteredTrips.length > 0 && (
        <button
          type="button"
          onClick={togglePageSelection}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {allOnPageSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          {allOnPageSelected ? "Unselect all" : "Select all on page"}
        </button>
      )}

      {/* Trips List */}
      <div className="grid gap-3">
        {filteredTrips.map((trip: any) => {
          const stats = getBatchStats(trip.trip_id);
          const availableSeats = getAvailableSeats(trip.trip_id);
          const canBook = trip.booking_live && stats.active > 0 && availableSeats > 0;
          const isUpdating = updating === trip.trip_id;
          const status = visibilityStatus(trip);
          const isSelected = selected.has(trip.trip_id);
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
            <div key={trip.trip_id} className={`bg-card border rounded-xl p-4 ${isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"} ${!trip.is_active && !trip.is_deleted ? 'opacity-80' : ''} ${trip.is_deleted ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                {/* Bulk select */}
                <button
                  type="button"
                  onClick={() => toggleSelect(trip.trip_id)}
                  className="mt-0.5 text-muted-foreground hover:text-primary"
                  title="Select"
                >
                  {isSelected ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h4 className="font-semibold text-foreground truncate">{trip.trip_name}</h4>
                        {trip.type === 'experience' && <Badge className="bg-accent/20 text-accent border-accent/30 text-[10px]">Experience</Badge>}
                        {trip.is_deleted ? (
                          <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">🗑 Deleted</Badge>
                        ) : (
                          <Badge className={
                            status === "published" ? "bg-green-500/15 text-green-600 border-green-500/30 text-[10px]"
                            : status === "draft" ? "bg-yellow-500/15 text-yellow-600 border-yellow-500/30 text-[10px]"
                            : "bg-muted text-muted-foreground text-[10px]"
                          }>
                            {status === "published" ? "🟢 Published" : status === "draft" ? "🟡 Draft" : "⚪ Hidden"}
                          </Badge>
                        )}
                        <Badge className={`text-[10px] border ${availabilityClass}`}>{availabilityLabel}</Badge>
                        {!canBook && trip.booking_live && (
                          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">⚠️ No Seats</Badge>
                        )}
                        {/* Featured chips */}
                        {FEATURED_KEYS.filter((k) => hasFeaturedTag(trip.tags, k)).map((k) => (
                          <Badge key={k} className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                            {FEATURED_TAG_LABELS[k]}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground items-center">
                        <span>{trip.duration}</span>
                        {/* Inline price edit */}
                        {editingPrice === trip.trip_id ? (
                          <span className="inline-flex items-center gap-1">
                            ₹
                            <Input
                              type="number"
                              autoFocus
                              value={priceDraft}
                              onChange={(e) => setPriceDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSavePrice(trip.trip_id);
                                if (e.key === "Escape") setEditingPrice(null);
                              }}
                              className="h-6 w-24 text-xs"
                            />
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={() => handleSavePrice(trip.trip_id)}>Save</Button>
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={() => setEditingPrice(null)}>×</Button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setEditingPrice(trip.trip_id); setPriceDraft(String(trip.price_default || 0)); }}
                            className="inline-flex items-center gap-1 hover:text-primary group"
                            title="Click to edit price"
                          >
                            ₹{trip.price_default.toLocaleString()}
                            <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                          </button>
                        )}
                        <span>{stats.bookedSeats}/{stats.totalSeats} seats</span>
                        <span>{stats.active} active {trip.type === 'experience' ? 'slots' : 'batches'}</span>
                        {stats.nextBatch && <span>Next: {new Date(stats.nextBatch.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                      </div>

                      {/* Featured toggles row */}
                      {!trip.is_deleted && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {FEATURED_KEYS.map((k) => {
                            const Icon = FEATURED_ICONS[k];
                            const active = hasFeaturedTag(trip.tags, k);
                            return (
                              <button
                                key={k}
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleToggleFeatured(trip, k)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                                  active
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                                }`}
                                title={`Toggle ${FEATURED_TAG_LABELS[k]}`}
                              >
                                <Icon className="w-3 h-3" />
                                {FEATURED_TAG_LABELS[k]}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {trip.is_deleted ? (
                        <Button size="sm" variant="outline" onClick={() => handleRestore(trip.trip_id)}>
                          <RotateCcw className="w-4 h-4 mr-1" />Restore
                        </Button>
                      ) : (
                        <>
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
                            <Button variant="ghost" size="sm" title="Duplicate" onClick={() => handleDuplicate(trip.trip_id)} disabled={isUpdating}><Copy className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" title="Preview" asChild>
                              <a href={trip.type === 'experience' ? `/experiences/${trip.trip_id}` : `/trips/${trip.trip_id}`} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                            </Button>
                            {stats.active > 0 && (
                              <Button variant="ghost" size="sm" title="Mark Sold Out" className="text-orange-600 hover:text-orange-700" onClick={() => handleMarkSoldOut(trip.trip_id, trip.trip_name)} disabled={isUpdating}>
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" title="Move to Deleted" className="text-destructive hover:text-destructive" onClick={() => handleSoftDelete(trip.trip_id, trip.trip_name)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTrips.length === 0 && !tripsTableMissing && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No {showDeleted ? "deleted" : ""} trips match the current filters</p>
        </div>
      )}

      {editorOpen && (
        <TripEditor tripId={editingTripId} onClose={handleEditorClose} onSave={handleEditorSave} />
      )}
    </div>
  );
};

export default TripManagement;
