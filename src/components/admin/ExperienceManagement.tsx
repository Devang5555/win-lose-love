import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useExperiences, useExperienceSlots, type Experience } from "@/hooks/useExperiences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Calendar, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const defaultExperience = {
  experience_id: "",
  name: "",
  summary: "",
  description: "",
  location: "Pune",
  duration: "",
  time_info: "",
  price: 0,
  category: "activity",
  inclusions: "",
  exclusions: "",
  safety_info: "",
  highlights: "",
  tags: "",
  is_active: true,
  booking_live: false,
};

const ExperienceManagement = () => {
  const { experiences, loading, refetch } = useExperiences();
  const { toast } = useToast();
  const [editingExp, setEditingExp] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slotModal, setSlotModal] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editingExp.experience_id || !editingExp.name || !editingExp.duration) {
      toast({ title: "Missing fields", description: "ID, name, and duration are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        experience_id: editingExp.experience_id,
        name: editingExp.name,
        summary: editingExp.summary || null,
        description: editingExp.description || null,
        location: editingExp.location || "Pune",
        duration: editingExp.duration,
        time_info: editingExp.time_info || null,
        price: Number(editingExp.price) || 0,
        category: editingExp.category || "activity",
        inclusions: editingExp.inclusions ? editingExp.inclusions.split("\n").filter(Boolean) : [],
        exclusions: editingExp.exclusions ? editingExp.exclusions.split("\n").filter(Boolean) : [],
        safety_info: editingExp.safety_info ? editingExp.safety_info.split("\n").filter(Boolean) : [],
        highlights: editingExp.highlights ? editingExp.highlights.split("\n").filter(Boolean) : [],
        tags: editingExp.tags ? editingExp.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        is_active: editingExp.is_active,
        booking_live: editingExp.booking_live,
        slug: editingExp.experience_id,
      };

      if (editingExp.id) {
        const { error } = await supabase.from("experiences").update(payload).eq("id", editingExp.id);
        if (error) throw error;
        toast({ title: "Experience updated" });
      } else {
        const { error } = await supabase.from("experiences").insert(payload);
        if (error) throw error;
        toast({ title: "Experience created" });
      }
      setShowForm(false);
      setEditingExp(null);
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (exp: Experience) => {
    setEditingExp({
      ...exp,
      inclusions: exp.inclusions?.join("\n") || "",
      exclusions: exp.exclusions?.join("\n") || "",
      safety_info: exp.safety_info?.join("\n") || "",
      highlights: exp.highlights?.join("\n") || "",
      tags: exp.tags?.join(", ") || "",
    });
    setShowForm(true);
  };

  const handleToggle = async (exp: Experience, field: "is_active" | "booking_live") => {
    const { error } = await supabase.from("experiences").update({ [field]: !exp[field] }).eq("id", exp.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Experiences</h2>
        <Button onClick={() => { setEditingExp({ ...defaultExperience }); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New Experience
        </Button>
      </div>

      <div className="grid gap-4">
        {experiences.map((exp) => (
          <Card key={exp.id} className="border-border">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-foreground truncate">{exp.name}</h3>
                    <Badge variant={exp.is_active ? "default" : "secondary"}>{exp.is_active ? "Active" : "Hidden"}</Badge>
                    <Badge variant={exp.booking_live ? "default" : "outline"} className={exp.booking_live ? "bg-forest text-white" : ""}>
                      {exp.booking_live ? "Bookable" : "Not Live"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {exp.location} • {exp.duration} • ₹{exp.price.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setSlotModal(exp.experience_id)}>
                    <Calendar className="w-3.5 h-3.5 mr-1" /> Slots
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(exp)}>
                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleToggle(exp, "is_active")}>
                    {exp.is_active ? "Hide" : "Show"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleToggle(exp, "booking_live")}>
                    {exp.booking_live ? "Disable Booking" : "Enable Booking"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setEditingExp(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExp?.id ? "Edit Experience" : "Create Experience"}</DialogTitle>
          </DialogHeader>
          {editingExp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Experience ID (unique slug)</Label>
                  <Input value={editingExp.experience_id} onChange={(e) => setEditingExp({ ...editingExp, experience_id: e.target.value })} disabled={!!editingExp.id} />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={editingExp.name} onChange={(e) => setEditingExp({ ...editingExp, name: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Location</Label>
                  <Input value={editingExp.location} onChange={(e) => setEditingExp({ ...editingExp, location: e.target.value })} />
                </div>
                <div>
                  <Label>Duration</Label>
                  <Input value={editingExp.duration} onChange={(e) => setEditingExp({ ...editingExp, duration: e.target.value })} />
                </div>
                <div>
                  <Label>Time Info</Label>
                  <Input value={editingExp.time_info} onChange={(e) => setEditingExp({ ...editingExp, time_info: e.target.value })} placeholder="e.g. 10 PM – 2 AM" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (₹)</Label>
                  <Input type="number" value={editingExp.price} onChange={(e) => setEditingExp({ ...editingExp, price: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={editingExp.category} onValueChange={(v) => setEditingExp({ ...editingExp, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cycling">Cycling</SelectItem>
                      <SelectItem value="trek">Trek</SelectItem>
                      <SelectItem value="walk">Walk</SelectItem>
                      <SelectItem value="camping">Camping</SelectItem>
                      <SelectItem value="day_trip">Day Trip</SelectItem>
                      <SelectItem value="activity">Activity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Summary (short)</Label>
                <Input value={editingExp.summary} onChange={(e) => setEditingExp({ ...editingExp, summary: e.target.value })} />
              </div>
              <div>
                <Label>Description (detailed)</Label>
                <Textarea rows={4} value={editingExp.description} onChange={(e) => setEditingExp({ ...editingExp, description: e.target.value })} />
              </div>
              <div>
                <Label>Highlights (one per line)</Label>
                <Textarea rows={3} value={editingExp.highlights} onChange={(e) => setEditingExp({ ...editingExp, highlights: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Inclusions (one per line)</Label>
                  <Textarea rows={4} value={editingExp.inclusions} onChange={(e) => setEditingExp({ ...editingExp, inclusions: e.target.value })} />
                </div>
                <div>
                  <Label>Exclusions (one per line)</Label>
                  <Textarea rows={4} value={editingExp.exclusions} onChange={(e) => setEditingExp({ ...editingExp, exclusions: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Safety Info (one per line)</Label>
                <Textarea rows={3} value={editingExp.safety_info} onChange={(e) => setEditingExp({ ...editingExp, safety_info: e.target.value })} />
              </div>
              <div>
                <Label>Tags (comma separated, e.g. "🔥 This Weekend, Popular")</Label>
                <Input value={editingExp.tags} onChange={(e) => setEditingExp({ ...editingExp, tags: e.target.value })} />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={editingExp.is_active} onCheckedChange={(v) => setEditingExp({ ...editingExp, is_active: v })} />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editingExp.booking_live} onCheckedChange={(v) => setEditingExp({ ...editingExp, booking_live: v })} />
                  <Label>Booking Live</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setShowForm(false); setEditingExp(null); }}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {slotModal && (
        <SlotManagementDialog experienceId={slotModal} onClose={() => setSlotModal(null)} />
      )}
    </div>
  );
};

const SlotManagementDialog = ({ experienceId, onClose }: { experienceId: string; onClose: () => void }) => {
  const { slots, refetch } = useExperienceSlots(experienceId);
  const { toast } = useToast();
  const [newSlot, setNewSlot] = useState({ slot_date: "", start_time: "", end_time: "", seat_limit: "30" });
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newSlot.slot_date) { toast({ title: "Date required", variant: "destructive" }); return; }
    setAdding(true);
    try {
      const seatLimit = Number(newSlot.seat_limit) || 30;
      const { error } = await supabase.from("experience_slots").insert({
        experience_id: experienceId,
        slot_date: newSlot.slot_date,
        start_time: newSlot.start_time || null,
        end_time: newSlot.end_time || null,
        seat_limit: seatLimit,
        available_seats: seatLimit,
      });
      if (error) throw error;
      toast({ title: "Slot added" });
      setNewSlot({ slot_date: "", start_time: "", end_time: "", seat_limit: "30" });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("experience_slots").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Slot removed" }); refetch(); }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Slots — {experienceId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold text-sm">Add New Slot</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={newSlot.slot_date} onChange={(e) => setNewSlot({ ...newSlot, slot_date: e.target.value })} />
                </div>
                <div>
                  <Label>Seats</Label>
                  <Input type="number" value={newSlot.seat_limit} onChange={(e) => setNewSlot({ ...newSlot, seat_limit: e.target.value })} />
                </div>
                <div>
                  <Label>Start Time</Label>
                  <Input value={newSlot.start_time} onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })} placeholder="10 PM" />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input value={newSlot.end_time} onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })} placeholder="2 AM" />
                </div>
              </div>
              <Button onClick={handleAdd} disabled={adding} className="w-full">
                <Plus className="w-4 h-4 mr-1" /> {adding ? "Adding..." : "Add Slot"}
              </Button>
            </CardContent>
          </Card>

          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No slots yet.</p>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {new Date(slot.slot_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {slot.start_time || "–"} → {slot.end_time || "–"} • {slot.seats_booked}/{slot.seat_limit} booked
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(slot.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExperienceManagement;
