import { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, Users, Calendar, Save, X, TrendingUp, Sparkles, Copy, Ban, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/data/trips";
import { calculateDynamicPrice } from "@/lib/dynamicPricing";
import MarketingTagPicker from "@/components/MarketingTagPicker";
import MarketingTagBadge from "@/components/MarketingTagBadge";

interface Batch {
  id: string;
  trip_id: string;
  batch_name: string;
  start_date: string;
  end_date: string;
  batch_size: number;
  seats_booked: number;
  status: string;
  auto_shift?: boolean;
  auto_duplicate?: boolean;
  marketing_tags?: string[] | null;
}

interface ParentOption {
  trip_id: string;
  name: string;
  type: "trip" | "experience";
  destination_name?: string | null;
  category?: string | null;
  price_default: number;
}

interface BatchManagementProps {
  batches: Batch[];
  onRefresh: () => void;
  /** Pre-fill & lock parent (used inside Trip/Experience editor modal) */
  defaultTripId?: string;
  /** Compact mode: hide the per-trip group headers (already inside editor) */
  compact?: boolean;
}

const BatchManagement = ({ batches, onRefresh, defaultTripId, compact }: BatchManagementProps) => {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [reassigning, setReassigning] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    trip_id: defaultTripId || "",
    batch_name: "",
    start_date: "",
    end_date: "",
    batch_size: "20",
    status: "active",
    auto_shift: true,
    auto_duplicate: true,
    marketing_tags: [] as string[],
  });

  // Load DB trips + experiences as parent options (source of truth)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [tripsRes, expRes, destRes] = await Promise.all([
        supabase.from("trips").select("trip_id, trip_name, type, experience_category, destination_id, price_default").eq("is_active", true),
        supabase.from("experiences").select("experience_id, name, category, price").eq("is_active", true),
        supabase.from("destinations").select("id, name"),
      ]);
      if (cancelled) return;
      const destMap = new Map((destRes.data || []).map((d: any) => [d.id, d.name]));
      const opts: ParentOption[] = [];
      (tripsRes.data || []).forEach((t: any) => {
        opts.push({
          trip_id: t.trip_id,
          name: t.trip_name,
          type: t.type === "experience" ? "experience" : "trip",
          destination_name: t.destination_id ? destMap.get(t.destination_id) ?? null : null,
          category: t.experience_category ?? null,
          price_default: t.price_default || 0,
        });
      });
      (expRes.data || []).forEach((e: any) => {
        if (opts.some((o) => o.trip_id === e.experience_id)) return;
        opts.push({
          trip_id: e.experience_id,
          name: e.name,
          type: "experience",
          destination_name: null,
          category: e.category ?? null,
          price_default: e.price || 0,
        });
      });
      opts.sort((a, b) => a.name.localeCompare(b.name));
      setParents(opts);
    })();
    return () => { cancelled = true; };
  }, []);

  const parentMap = useMemo(() => {
    const m = new Map<string, ParentOption>();
    parents.forEach((p) => m.set(p.trip_id, p));
    return m;
  }, [parents]);

  const resetForm = () => {
    setFormData({
      trip_id: defaultTripId || "",
      batch_name: "",
      start_date: "",
      end_date: "",
      batch_size: "20",
      status: "active",
      auto_shift: true,
      auto_duplicate: true,
      marketing_tags: [],
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.trip_id || !formData.batch_name || !formData.start_date || !formData.end_date) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (editingId) {
      const originalBatch = batches.find((b) => b.id === editingId);
      const newBatchSize = parseInt(formData.batch_size);
      const seatsBooked = originalBatch?.seats_booked || 0;
      const newAvailableSeats = Math.max(0, newBatchSize - seatsBooked);

      const { error } = await supabase
        .from("batches")
        .update({
          trip_id: formData.trip_id,
          batch_name: formData.batch_name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          batch_size: newBatchSize,
          available_seats: newAvailableSeats,
          status: formData.status,
          auto_shift: formData.auto_shift,
          auto_duplicate: formData.auto_duplicate,
          marketing_tags: formData.marketing_tags,
        } as any)
        .eq("id", editingId);

      if (error) {
        toast({ title: "Error", description: "Failed to update batch", variant: "destructive" });
      } else {
        toast({ title: "Batch updated", description: "Linked to " + (parentMap.get(formData.trip_id)?.name || formData.trip_id) });
        resetForm();
        onRefresh();
      }
    } else {
      const { error } = await supabase.from("batches").insert({
        trip_id: formData.trip_id,
        batch_name: formData.batch_name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        batch_size: parseInt(formData.batch_size),
        status: formData.status,
        auto_shift: formData.auto_shift,
        auto_duplicate: formData.auto_duplicate,
        marketing_tags: formData.marketing_tags,
      } as any);

      if (error) {
        toast({ title: "Error", description: "Failed to create batch", variant: "destructive" });
      } else {
        toast({ title: "Batch created", description: "Auto-linked to " + (parentMap.get(formData.trip_id)?.name || formData.trip_id) });
        resetForm();
        onRefresh();
      }
    }
  };

  const handleEdit = (batch: Batch) => {
    setEditingId(batch.id);
    setFormData({
      trip_id: batch.trip_id,
      batch_name: batch.batch_name,
      start_date: batch.start_date,
      end_date: batch.end_date,
      batch_size: batch.batch_size.toString(),
      status: batch.status,
      auto_shift: batch.auto_shift ?? true,
      auto_duplicate: batch.auto_duplicate ?? true,
      marketing_tags: batch.marketing_tags ?? [],
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;
    const { error } = await supabase.from("batches").delete().eq("id", id);
    if (error) toast({ title: "Error", description: "Failed to delete batch", variant: "destructive" });
    else { toast({ title: "Batch deleted" }); onRefresh(); }
  };

  const handleDuplicate = async (batch: Batch) => {
    const shift = (d: string) => {
      const dt = new Date(d);
      dt.setDate(dt.getDate() + 7);
      return dt.toISOString().slice(0, 10);
    };
    const { error } = await supabase.from("batches").insert({
      trip_id: batch.trip_id,
      batch_name: `${batch.batch_name} (Next)`,
      start_date: shift(batch.start_date),
      end_date: shift(batch.end_date),
      batch_size: batch.batch_size,
      status: "active",
      auto_shift: batch.auto_shift ?? true,
      auto_duplicate: batch.auto_duplicate ?? true,
    });
    if (error) toast({ title: "Error", description: "Failed to duplicate batch", variant: "destructive" });
    else { toast({ title: "Batch duplicated", description: "Edit dates if needed" }); onRefresh(); }
  };

  const handleToggleSoldOut = async (batch: Batch) => {
    const isSoldOut = batch.status === "closed" || batch.batch_size - batch.seats_booked <= 0;
    if (isSoldOut) {
      const available = Math.max(0, batch.batch_size - batch.seats_booked);
      const { error } = await supabase.from("batches").update({ status: "active", available_seats: available }).eq("id", batch.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Batch reopened" }); onRefresh(); }
    } else {
      const { error } = await supabase.from("batches").update({ status: "closed", available_seats: 0 }).eq("id", batch.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Marked sold out" }); onRefresh(); }
    }
  };

  const handleReassign = async (batchId: string, newTripId: string) => {
    if (!newTripId) return;
    const { error } = await supabase.from("batches").update({ trip_id: newTripId }).eq("id", batchId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Batch reassigned", description: "Now linked to " + (parentMap.get(newTripId)?.name || newTripId) });
      setReassigning(null);
      onRefresh();
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  // Filter to defaultTripId when embedded in editor
  const visibleBatches = defaultTripId ? batches.filter((b) => b.trip_id === defaultTripId) : batches;

  // Group by parent
  const batchesByTrip = visibleBatches.reduce((acc, batch) => {
    if (!acc[batch.trip_id]) acc[batch.trip_id] = [];
    acc[batch.trip_id].push(batch);
    return acc;
  }, {} as Record<string, Batch[]>);

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-muted/50 rounded-xl p-6 border border-border">
          <h3 className="font-medium text-foreground mb-4">
            {editingId ? "Edit Batch" : "Create New Batch"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="mb-2 block">Trip / Experience</Label>
              <Select
                value={formData.trip_id}
                onValueChange={(value) => setFormData({ ...formData, trip_id: value })}
                disabled={!!defaultTripId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {parents.map((p) => (
                    <SelectItem key={p.trip_id} value={p.trip_id}>
                      <span className="inline-flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {p.type === "experience" ? "EXP" : "TRIP"}
                        </Badge>
                        {p.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {defaultTripId && (
                <p className="text-xs text-muted-foreground mt-1">Auto-linked to current {parentMap.get(defaultTripId)?.type || "trip"}</p>
              )}
            </div>
            <div>
              <Label className="mb-2 block">Batch Name</Label>
              <Input value={formData.batch_name} onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })} placeholder="e.g., January Batch 2025" />
            </div>
            <div>
              <Label className="mb-2 block">Batch Size</Label>
              <Input type="number" value={formData.batch_size} onChange={(e) => setFormData({ ...formData, batch_size: e.target.value })} min="1" />
            </div>
            <div>
              <Label className="mb-2 block">Start Date</Label>
              <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
            </div>
            <div>
              <Label className="mb-2 block">End Date</Label>
              <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
            </div>
            <div>
              <Label className="mb-2 block">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 mt-4 cursor-pointer select-none">
            <input type="checkbox" checked={formData.auto_shift} onChange={(e) => setFormData({ ...formData, auto_shift: e.target.checked })} className="h-4 w-4 rounded border-border" />
            <span className="text-sm text-foreground">Auto-shift if no bookings <span className="text-muted-foreground">(rolls dates +7 days when start date passes with zero bookings)</span></span>
          </label>
          <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
            <input type="checkbox" checked={formData.auto_duplicate} onChange={(e) => setFormData({ ...formData, auto_duplicate: e.target.checked })} className="h-4 w-4 rounded border-border" />
            <span className="text-sm text-foreground">Auto-create next batch <span className="text-muted-foreground">(creates a new +7-day batch when this one is sold out or its date passes)</span></span>
          </label>
          <div className="mt-4">
            <MarketingTagPicker
              value={formData.marketing_tags}
              onChange={(next) => setFormData({ ...formData, marketing_tags: next })}
              title="Departure-level urgency chips (optional)"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSubmit}><Save className="w-4 h-4 mr-2" />{editingId ? "Update Batch" : "Create Batch"}</Button>
            <Button variant="outline" onClick={resetForm}><X className="w-4 h-4 mr-2" />Cancel</Button>
          </div>
        </div>
      )}

      {!isAdding && (
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" />Create New Batch
        </Button>
      )}

      {Object.entries(batchesByTrip).map(([tripId, tripBatches]) => {
        const parent = parentMap.get(tripId);
        const isOrphan = !parent;
        return (
          <div key={tripId} className="bg-card border border-border rounded-xl overflow-hidden">
            {!compact && (
              <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center gap-2 flex-wrap">
                <Badge variant={parent?.type === "experience" ? "secondary" : "default"} className="text-[10px]">
                  {parent?.type === "experience" ? "EXPERIENCE" : "TRIP"}
                </Badge>
                <h3 className="font-medium text-foreground">{parent?.name || tripId}</h3>
                {parent?.destination_name && (
                  <Badge variant="outline" className="text-xs">📍 {parent.destination_name}</Badge>
                )}
                {parent?.category && (
                  <Badge variant="outline" className="text-xs">{parent.category}</Badge>
                )}
                {isOrphan && (
                  <Badge className="bg-red-500/20 text-red-600 text-xs">⚠ Orphan — parent missing</Badge>
                )}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Batch</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Dates</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Seats</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Effective Price</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tripBatches.map((batch) => {
                    const remainingSeats = batch.batch_size - batch.seats_booked;
                    const isFull = remainingSeats <= 0;
                    const basePrice = parent?.price_default || 0;
                    const dp = calculateDynamicPrice(basePrice, batch.batch_size, remainingSeats, batch.start_date);

                    return (
                      <tr key={batch.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">
                          <div className="flex flex-col gap-1">
                            <span>{batch.batch_name}</span>
                            <MarketingTagBadge tags={batch.marketing_tags} size="xs" single />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(batch.start_date)} - {formatDate(batch.end_date)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className={isFull ? "text-red-600" : "text-foreground"}>
                              {batch.seats_booked}/{batch.batch_size}
                            </span>
                            {isFull && <Badge className="bg-red-500/20 text-red-600 text-xs">Full</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{formatPrice(dp.effectivePrice)}</span>
                            {dp.adjustmentPercent !== 0 && (
                              <>
                                <span className="text-xs text-muted-foreground line-through">{formatPrice(dp.basePrice)}</span>
                                {dp.adjustmentPercent > 0 ? (
                                  <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5 text-green-500" />
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={
                            batch.status === "active" ? "bg-green-500/20 text-green-600"
                              : batch.status === "closed" ? "bg-red-500/20 text-red-600"
                              : "bg-yellow-500/20 text-yellow-600"
                          }>
                            {batch.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 items-center flex-wrap">
                            <Button variant="ghost" size="sm" title="Edit" onClick={() => handleEdit(batch)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" title="Duplicate (+7 days)" onClick={() => handleDuplicate(batch)}><Copy className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" title={batch.status === "closed" ? "Reopen" : "Mark Sold Out"} className="text-orange-600 hover:text-orange-700" onClick={() => handleToggleSoldOut(batch)}><Ban className="w-4 h-4" /></Button>
                            {!defaultTripId && (
                              reassigning === batch.id ? (
                                <Select value={batch.trip_id} onValueChange={(v) => handleReassign(batch.id, v)}>
                                  <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent className="max-h-72">
                                    {parents.map((p) => (
                                      <SelectItem key={p.trip_id} value={p.trip_id}>
                                        <span className="text-xs">[{p.type === "experience" ? "EXP" : "TRIP"}] {p.name}</span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Button variant="ghost" size="sm" title="Reassign to another trip/experience" onClick={() => setReassigning(batch.id)}>
                                  <ArrowRightLeft className="w-4 h-4" />
                                </Button>
                              )
                            )}
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(batch.id)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {visibleBatches.length === 0 && !isAdding && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No batches yet</p>
          <p className="text-sm">Create your first batch to start accepting bookings</p>
        </div>
      )}
    </div>
  );
};

export default BatchManagement;
