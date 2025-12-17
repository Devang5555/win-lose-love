import { useState } from "react";
import { Plus, Edit, Trash2, Users, Calendar, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trips } from "@/data/trips";

interface Batch {
  id: string;
  trip_id: string;
  batch_name: string;
  start_date: string;
  end_date: string;
  batch_size: number;
  seats_booked: number;
  status: string;
}

interface BatchManagementProps {
  batches: Batch[];
  onRefresh: () => void;
}

const BatchManagement = ({ batches, onRefresh }: BatchManagementProps) => {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    trip_id: "",
    batch_name: "",
    start_date: "",
    end_date: "",
    batch_size: "20",
    status: "active",
  });

  const resetForm = () => {
    setFormData({
      trip_id: "",
      batch_name: "",
      start_date: "",
      end_date: "",
      batch_size: "20",
      status: "active",
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.trip_id || !formData.batch_name || !formData.start_date || !formData.end_date) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("batches")
        .update({
          trip_id: formData.trip_id,
          batch_name: formData.batch_name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          batch_size: parseInt(formData.batch_size),
          status: formData.status,
        })
        .eq("id", editingId);

      if (error) {
        toast({ title: "Error", description: "Failed to update batch", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Batch updated successfully" });
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
      });

      if (error) {
        toast({ title: "Error", description: "Failed to create batch", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Batch created successfully" });
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
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;

    const { error } = await supabase.from("batches").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete batch", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Batch deleted successfully" });
      onRefresh();
    }
  };

  const getTripName = (tripId: string) => {
    const trip = trips.find((t) => t.tripId === tripId);
    return trip?.tripName || tripId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Group batches by trip
  const batchesByTrip = batches.reduce((acc, batch) => {
    if (!acc[batch.trip_id]) {
      acc[batch.trip_id] = [];
    }
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
              <Label className="mb-2 block">Trip</Label>
              <Select
                value={formData.trip_id}
                onValueChange={(value) => setFormData({ ...formData, trip_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trip" />
                </SelectTrigger>
                <SelectContent>
                  {trips.map((trip) => (
                    <SelectItem key={trip.tripId} value={trip.tripId}>
                      {trip.tripName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Batch Name</Label>
              <Input
                value={formData.batch_name}
                onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                placeholder="e.g., January Batch 2025"
              />
            </div>
            <div>
              <Label className="mb-2 block">Batch Size</Label>
              <Input
                type="number"
                value={formData.batch_size}
                onChange={(e) => setFormData({ ...formData, batch_size: e.target.value })}
                min="1"
              />
            </div>
            <div>
              <Label className="mb-2 block">Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-2 block">End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-2 block">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSubmit}>
              <Save className="w-4 h-4 mr-2" />
              {editingId ? "Update Batch" : "Create Batch"}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Add Button */}
      {!isAdding && (
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Batch
        </Button>
      )}

      {/* Batches by Trip */}
      {Object.entries(batchesByTrip).map(([tripId, tripBatches]) => (
        <div key={tripId} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            <h3 className="font-medium text-foreground">{getTripName(tripId)}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Batch Name</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Dates</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Seats</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tripBatches.map((batch) => {
                  const remainingSeats = batch.batch_size - batch.seats_booked;
                  const isFull = remainingSeats <= 0;

                  return (
                    <tr key={batch.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{batch.batch_name}</td>
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
                          {isFull && (
                            <Badge className="bg-red-500/20 text-red-600 text-xs">Full</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            batch.status === "active"
                              ? "bg-green-500/20 text-green-600"
                              : batch.status === "closed"
                              ? "bg-red-500/20 text-red-600"
                              : "bg-yellow-500/20 text-yellow-600"
                          }
                        >
                          {batch.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(batch)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(batch.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {batches.length === 0 && !isAdding && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No batches created yet</p>
          <p className="text-sm">Create your first batch to start accepting bookings</p>
        </div>
      )}
    </div>
  );
};

export default BatchManagement;
