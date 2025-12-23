import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, Image, MapPin, DollarSign, List, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface TripFormData {
  trip_id: string;
  trip_name: string;
  duration: string;
  summary: string;
  price_default: number;
  price_from_pune: number | null;
  price_from_mumbai: number | null;
  advance_amount: number;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  locations: string[];
  images: string[];
  is_active: boolean;
  booking_live: boolean;
  capacity: number;
  contact_phone: string;
  contact_email: string;
  notes: string;
}

interface TripEditorProps {
  tripId?: string | null;
  onClose: () => void;
  onSave: () => void;
}

const emptyForm: TripFormData = {
  trip_id: "",
  trip_name: "",
  duration: "",
  summary: "",
  price_default: 0,
  price_from_pune: null,
  price_from_mumbai: null,
  advance_amount: 2000,
  highlights: [],
  inclusions: [],
  exclusions: [],
  locations: [],
  images: [],
  is_active: true,
  booking_live: false,
  capacity: 30,
  contact_phone: "+91-9415026522",
  contact_email: "bhramanbyua@gmail.com",
  notes: "",
};

const TripEditor = ({ tripId, onClose, onSave }: TripEditorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<TripFormData>(emptyForm);
  
  // Temp inputs for array fields
  const [newHighlight, setNewHighlight] = useState("");
  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newImage, setNewImage] = useState("");

  useEffect(() => {
    if (tripId) {
      fetchTrip();
    }
  }, [tripId]);

  const fetchTrip = async () => {
    if (!tripId || !SUPABASE_URL || !SUPABASE_KEY) return;
    setLoading(true);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/trips?trip_id=eq.${tripId}&select=*`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const trip = data[0];
          setFormData({
            trip_id: trip.trip_id || "",
            trip_name: trip.trip_name || "",
            duration: trip.duration || "",
            summary: trip.summary || "",
            price_default: trip.price_default || 0,
            price_from_pune: trip.price_from_pune,
            price_from_mumbai: trip.price_from_mumbai,
            advance_amount: trip.advance_amount || 2000,
            highlights: trip.highlights || [],
            inclusions: trip.inclusions || [],
            exclusions: trip.exclusions || [],
            locations: trip.locations || [],
            images: trip.images || [],
            is_active: trip.is_active ?? true,
            booking_live: trip.booking_live ?? false,
            capacity: trip.capacity || 30,
            contact_phone: trip.contact_phone || "+91-9415026522",
            contact_email: trip.contact_email || "bhramanbyua@gmail.com",
            notes: trip.notes || "",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load trip details",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load trip details",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.trip_id || !formData.trip_name || !formData.duration) {
      toast({
        title: "Validation Error",
        description: "Please fill in Trip ID, Name, and Duration",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const tripData = {
      trip_id: formData.trip_id,
      trip_name: formData.trip_name,
      duration: formData.duration,
      summary: formData.summary,
      price_default: formData.price_default,
      price_from_pune: formData.price_from_pune,
      price_from_mumbai: formData.price_from_mumbai,
      advance_amount: formData.advance_amount,
      highlights: formData.highlights,
      inclusions: formData.inclusions,
      exclusions: formData.exclusions,
      locations: formData.locations,
      images: formData.images,
      is_active: formData.is_active,
      booking_live: formData.booking_live,
      capacity: formData.capacity,
      contact_phone: formData.contact_phone,
      contact_email: formData.contact_email,
      notes: formData.notes,
    };

    try {
      if (tripId) {
        // Update existing trip
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/trips?trip_id=eq.${tripId}`,
          {
            method: "PATCH",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify(tripData),
          }
        );

        if (response.ok) {
          toast({ title: "Success", description: "Trip updated successfully" });
          onSave();
        } else {
          toast({ title: "Error", description: "Failed to update trip", variant: "destructive" });
        }
      } else {
        // Create new trip
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/trips`,
          {
            method: "POST",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify(tripData),
          }
        );

        if (response.ok) {
          toast({ title: "Success", description: "Trip created successfully" });
          onSave();
        } else if (response.status === 409) {
          toast({ title: "Error", description: "A trip with this ID already exists", variant: "destructive" });
        } else {
          toast({ title: "Error", description: "Failed to create trip", variant: "destructive" });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }

    setSaving(false);
  };

  const addToArray = (field: keyof TripFormData, value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    const arr = formData[field] as string[];
    if (!arr.includes(value.trim())) {
      setFormData({ ...formData, [field]: [...arr, value.trim()] });
    }
    setter("");
  };

  const removeFromArray = (field: keyof TripFormData, index: number) => {
    const arr = formData[field] as string[];
    setFormData({ ...formData, [field]: arr.filter((_, i) => i !== index) });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-full py-8 px-4">
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">
              {tripId ? "Edit Trip" : "Create New Trip"}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-8">
            {/* Basic Info */}
            <section>
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Trip ID *</Label>
                  <Input
                    value={formData.trip_id}
                    onChange={(e) => setFormData({ ...formData, trip_id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="e.g., malvan-escape-001"
                    disabled={!!tripId}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Unique identifier (lowercase, no spaces)</p>
                </div>
                <div>
                  <Label className="mb-2 block">Trip Name *</Label>
                  <Input
                    value={formData.trip_name}
                    onChange={(e) => setFormData({ ...formData, trip_name: e.target.value })}
                    placeholder="e.g., Malvan Beach Escape"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Duration *</Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 3N/2D"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Capacity</Label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    min="1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="mb-2 block">Summary</Label>
                  <Textarea
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Brief description of the trip..."
                    rows={3}
                  />
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section>
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Pricing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="mb-2 block">Default Price (₹) *</Label>
                  <Input
                    type="number"
                    value={formData.price_default}
                    onChange={(e) => setFormData({ ...formData, price_default: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Price from Pune (₹)</Label>
                  <Input
                    type="number"
                    value={formData.price_from_pune || ""}
                    onChange={(e) => setFormData({ ...formData, price_from_pune: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Price from Mumbai (₹)</Label>
                  <Input
                    type="number"
                    value={formData.price_from_mumbai || ""}
                    onChange={(e) => setFormData({ ...formData, price_from_mumbai: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Advance Amount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.advance_amount}
                    onChange={(e) => setFormData({ ...formData, advance_amount: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>
            </section>

            {/* Highlights */}
            <section>
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                <List className="w-5 h-5 text-primary" />
                Highlights
              </h3>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  placeholder="Add a highlight..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("highlights", newHighlight, setNewHighlight))}
                />
                <Button type="button" onClick={() => addToArray("highlights", newHighlight, setNewHighlight)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.highlights.map((item, i) => (
                  <span key={i} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {item}
                    <button onClick={() => removeFromArray("highlights", i)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </section>

            {/* Inclusions */}
            <section>
              <h3 className="text-lg font-medium text-foreground mb-4">Inclusions</h3>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newInclusion}
                  onChange={(e) => setNewInclusion(e.target.value)}
                  placeholder="Add an inclusion..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("inclusions", newInclusion, setNewInclusion))}
                />
                <Button type="button" onClick={() => addToArray("inclusions", newInclusion, setNewInclusion)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <ul className="space-y-1">
                {formData.inclusions.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-green-600">✓</span> {item}
                    <button onClick={() => removeFromArray("inclusions", i)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {/* Exclusions */}
            <section>
              <h3 className="text-lg font-medium text-foreground mb-4">Exclusions</h3>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newExclusion}
                  onChange={(e) => setNewExclusion(e.target.value)}
                  placeholder="Add an exclusion..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("exclusions", newExclusion, setNewExclusion))}
                />
                <Button type="button" onClick={() => addToArray("exclusions", newExclusion, setNewExclusion)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <ul className="space-y-1">
                {formData.exclusions.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-red-600">✗</span> {item}
                    <button onClick={() => removeFromArray("exclusions", i)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {/* Locations */}
            <section>
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Locations
              </h3>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Add a location..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("locations", newLocation, setNewLocation))}
                />
                <Button type="button" onClick={() => addToArray("locations", newLocation, setNewLocation)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.locations.map((item, i) => (
                  <span key={i} className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> {item}
                    <button onClick={() => removeFromArray("locations", i)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </section>

            {/* Images */}
            <section>
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                Images (URLs)
              </h3>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  placeholder="Paste image URL..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("images", newImage, setNewImage))}
                />
                <Button type="button" onClick={() => addToArray("images", newImage, setNewImage)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {formData.images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt={`Trip image ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
                    <button
                      onClick={() => removeFromArray("images", i)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact */}
            <section>
              <h3 className="text-lg font-medium text-foreground mb-4">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Phone</Label>
                  <Input
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+91-XXXXXXXXXX"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Email</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </section>

            {/* Notes */}
            <section>
              <Label className="mb-2 block">Additional Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes or terms..."
                rows={2}
              />
            </section>

            {/* Status Toggles */}
            <section className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Trip Active (Visible on site)</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.booking_live}
                  onCheckedChange={(checked) => setFormData({ ...formData, booking_live: checked })}
                />
                <Label>Booking Live (Accepting bookings)</Label>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : tripId ? "Update Trip" : "Create Trip"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripEditor;
