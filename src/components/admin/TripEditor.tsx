import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, Image, MapPin, DollarSign, List, FileText, ShieldCheck, Tag, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BatchManagement from "./BatchManagement";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import TripItineraryEditor from "./TripItineraryEditor";
import type { RawItineraryJson } from "@/lib/tripItineraryAdapter";
import ImageUpload from "./ImageUpload";
import SmartImageManager from "./SmartImageManager";
import SeoSection, { SeoData } from "./SeoSection";
import { FEATURED_TAG_LABELS, FEATURED_TAGS, FeaturedTagKey, hasFeaturedTag, toggleFeaturedTag, ALL_FEATURED_TAGS } from "@/lib/featuredTags";

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
  type: string;
  event_time: string;
  short_duration: string;
  experience_category: string;
  tags: string[];
  safety_info: string[];
  itinerary_data: RawItineraryJson | null;
  policies: string[];
  seo: SeoData;
  pricing_tiers: { label: string; price: number; description?: string }[];
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
  type: "trip",
  event_time: "",
  short_duration: "",
  experience_category: "",
  tags: [],
  safety_info: [],
  itinerary_data: null,
  policies: [],
  seo: {},
  pricing_tiers: [],
};

const TripEditor = ({ tripId, onClose, onSave }: TripEditorProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<TripFormData>(emptyForm);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchesForTrip, setBatchesForTrip] = useState<any[]>([]);

  const refreshBatches = async () => {
    if (!tripId) return;
    const { data } = await supabase.from("batches").select("*").eq("trip_id", tripId).order("start_date");
    setBatchesForTrip(data || []);
  };
  useEffect(() => { if (tripId && showBatchModal) refreshBatches(); }, [tripId, showBatchModal]);
  
  const [newHighlight, setNewHighlight] = useState("");
  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newSafetyItem, setNewSafetyItem] = useState("");
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (tripId) {
      fetchTrip();
    }
  }, [tripId]);

  const fetchTrip = async () => {
    if (!tripId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("trip_id", tripId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          trip_id: data.trip_id || "",
          trip_name: data.trip_name || "",
          duration: data.duration || "",
          summary: data.summary || "",
          price_default: data.price_default || 0,
          price_from_pune: data.price_from_pune,
          price_from_mumbai: data.price_from_mumbai,
          advance_amount: data.advance_amount || 2000,
          highlights: data.highlights || [],
          inclusions: data.inclusions || [],
          exclusions: data.exclusions || [],
          locations: data.locations || [],
          images: data.images || [],
          is_active: data.is_active ?? true,
          booking_live: data.booking_live ?? false,
          capacity: data.capacity || 30,
          contact_phone: data.contact_phone || "+91-9415026522",
          contact_email: data.contact_email || "bhramanbyua@gmail.com",
          notes: data.notes || "",
          type: (data as any).type || "trip",
          event_time: (data as any).event_time || "",
          short_duration: (data as any).short_duration || "",
          experience_category: (data as any).experience_category || "",
          tags: (data as any).tags || [],
          safety_info: (data as any).safety_info || [],
          itinerary_data: ((data as any).itinerary_data ?? null) as RawItineraryJson | null,
          policies: Array.isArray((data as any).policies?.items)
            ? ((data as any).policies.items as string[])
            : [],
          seo: ((data as any).seo as SeoData) || {},
        });
      }
    } catch (error) {
      console.error("Error loading trip:", error);
      toast({ title: "Error", description: "Failed to load trip details", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.trip_id || !formData.trip_name || !formData.duration) {
      toast({ title: "Validation Error", description: "Please fill in Trip ID, Name, and Duration", variant: "destructive" });
      return;
    }

    setSaving(true);

    // Build the complete update payload — replace arrays entirely
    const tripData: Record<string, any> = {
      trip_id: formData.trip_id,
      trip_name: formData.trip_name,
      duration: formData.duration,
      summary: formData.summary,
      price_default: formData.price_default,
      price_from_pune: formData.price_from_pune,
      price_from_mumbai: formData.price_from_mumbai,
      advance_amount: formData.advance_amount,
      highlights: [...formData.highlights],
      inclusions: [...formData.inclusions],
      exclusions: [...formData.exclusions],
      locations: [...formData.locations],
      images: [...formData.images],
      is_active: formData.is_active,
      booking_live: formData.booking_live,
      capacity: formData.capacity,
      contact_phone: formData.contact_phone,
      contact_email: formData.contact_email,
      notes: formData.notes,
      type: formData.type,
      event_time: formData.event_time || null,
      short_duration: formData.short_duration || null,
      experience_category: formData.experience_category || null,
      tags: [...formData.tags],
      safety_info: [...formData.safety_info],
      itinerary_data: formData.itinerary_data ?? null,
      policies: formData.policies.length > 0 ? { items: formData.policies.filter((p) => p.trim()) } : null,
      seo: formData.seo && Object.values(formData.seo).some((v) => v && (typeof v !== "object" || Object.keys(v).length)) ? formData.seo : null,
    };

    try {
      if (tripId) {
        // Update existing trip using supabase client with auth
        const { data, error } = await supabase
          .from("trips")
          .update(tripData)
          .eq("trip_id", tripId)
          .select()
          .single();

        if (error) throw error;

        console.log("[TripEditor] Update response:", data);
        toast({ title: "Success", description: "Trip updated successfully" });
      } else {
        // Create new trip
        const { data, error } = await supabase
          .from("trips")
          .insert(tripData as any)
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            toast({ title: "Error", description: "A trip with this ID already exists", variant: "destructive" });
            setSaving(false);
            return;
          }
          throw error;
        }

        console.log("[TripEditor] Create response:", data);
        toast({ title: "Success", description: "Trip created successfully" });
      }

      // Invalidate all relevant React Query caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trip", tripId] }),
        queryClient.invalidateQueries({ queryKey: ["trips"] }),
        queryClient.invalidateQueries({ queryKey: ["destinationTrips"] }),
      ]);

      onSave();
    } catch (error: any) {
      console.error("[TripEditor] Save error:", error);
      toast({ title: "Error", description: error?.message || "Something went wrong", variant: "destructive" });
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
              {tripId ? `Edit ${formData.type === 'experience' ? 'Experience' : 'Trip'}` : `Create New ${formData.type === 'experience' ? 'Experience' : 'Trip'}`}
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
                  <Label className="mb-2 block">Type *</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trip">Trip</SelectItem>
                      <SelectItem value="experience">Experience</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">{formData.type === 'experience' ? 'Experience' : 'Trip'} ID *</Label>
                  <Input
                    value={formData.trip_id}
                    onChange={(e) => setFormData({ ...formData, trip_id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder={formData.type === 'experience' ? "e.g., night-cycling-pune" : "e.g., malvan-escape-001"}
                    disabled={!!tripId}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Unique identifier (lowercase, no spaces)</p>
                </div>
                <div>
                  <Label className="mb-2 block">{formData.type === 'experience' ? 'Experience' : 'Trip'} Name *</Label>
                  <Input
                    value={formData.trip_name}
                    onChange={(e) => setFormData({ ...formData, trip_name: e.target.value })}
                    placeholder={formData.type === 'experience' ? "e.g., Late Night Cycling" : "e.g., Malvan Beach Escape"}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Duration *</Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder={formData.type === 'experience' ? "e.g., 3–4 Hours" : "e.g., 3N/2D"}
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

                {/* Experience-specific fields */}
                {formData.type === 'experience' && (
                  <>
                    <div>
                      <Label className="mb-2 block">Event Time</Label>
                      <Input
                        value={formData.event_time}
                        onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                        placeholder="e.g., 10 PM – 2 AM"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Category</Label>
                      <Select value={formData.experience_category} onValueChange={(v) => setFormData({ ...formData, experience_category: v })}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cycling">🚴 Cycling</SelectItem>
                          <SelectItem value="trek">🌄 Trek</SelectItem>
                          <SelectItem value="walk">🌌 Walk</SelectItem>
                          <SelectItem value="camping">🏕️ Camping</SelectItem>
                          <SelectItem value="day_trip">🏞️ Day Trip</SelectItem>
                          <SelectItem value="activity">🚀 Activity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <Label className="mb-2 block">Summary</Label>
                  <Textarea
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Brief description..."
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

            {/* Smart Image Manager: reorder, set hero, alt text */}
            <section>
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                Images
              </h3>
              <SmartImageManager
                images={formData.images}
                alt={formData.seo.image_alt}
                onImagesChange={(imgs) => setFormData({ ...formData, images: imgs })}
                onAltChange={(alt) => setFormData({ ...formData, seo: { ...formData.seo, image_alt: alt } })}
              />
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

            {/* Safety Info (for experiences) */}
            {formData.type === 'experience' && (
              <section>
                <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Safety Information
                </h3>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newSafetyItem}
                    onChange={(e) => setNewSafetyItem(e.target.value)}
                    placeholder="Add safety info..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("safety_info", newSafetyItem, setNewSafetyItem))}
                  />
                  <Button type="button" onClick={() => addToArray("safety_info", newSafetyItem, setNewSafetyItem)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <ul className="space-y-1">
                  {formData.safety_info.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ShieldCheck className="w-3 h-3 text-forest" /> {item}
                      <button onClick={() => removeFromArray("safety_info", i)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Tags */}
            <section>
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Tags
              </h3>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="e.g., 🔥 This Weekend, Popular..."
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("tags", newTag, setNewTag))}
                />
                <Button type="button" onClick={() => addToArray("tags", newTag, setNewTag)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((item, i) => (
                  <span key={i} className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {item}
                    <button onClick={() => removeFromArray("tags", i)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              {/* Featured / homepage curation toggles (stored as tags) */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-foreground mb-2">Homepage curation</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(FEATURED_TAG_LABELS) as FeaturedTagKey[]).map((key) => {
                    const active = hasFeaturedTag(formData.tags, key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, tags: toggleFeaturedTag(formData.tags, key) })}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-muted-foreground border-border hover:border-primary/40"
                        }`}
                      >
                        {FEATURED_TAG_LABELS[key]}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Toggles add/remove curation tags. Frontend filters use these to surface trips on the homepage.
                </p>
              </div>
            </section>

            {/* SEO & Social */}
            <SeoSection
              value={formData.seo}
              onChange={(v) => setFormData({ ...formData, seo: v })}
              fallbackImage={formData.images[0]}
            />
            <section>
              <Label className="mb-2 block">Additional Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes or terms..."
                rows={2}
              />
            </section>

            {/* Itinerary + Policies (admin-managed per trip) */}
            {formData.type !== "experience" && (
              <section className="border-t border-border pt-6">
                <TripItineraryEditor
                  tripName={formData.trip_name}
                  locations={formData.locations}
                  itinerary={formData.itinerary_data}
                  setItinerary={(v) => setFormData({ ...formData, itinerary_data: v })}
                  policies={formData.policies}
                  setPolicies={(v) => setFormData({ ...formData, policies: v })}
                />
              </section>
            )}

            {/* Status Toggles */}
            <section className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>{formData.type === 'experience' ? 'Experience' : 'Trip'} Active (Visible on site)</Label>
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
          <div className="flex justify-between items-center gap-3 p-6 border-t border-border flex-wrap">
            {tripId ? (
              <Button variant="outline" type="button" onClick={() => setShowBatchModal(true)}>
                <Calendar className="w-4 h-4 mr-2" />
                Manage Batches
              </Button>
            ) : <span className="text-xs text-muted-foreground">Save first to add batches</span>}
            <div className="flex gap-3 ml-auto">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : tripId ? "Update Trip" : "Create Trip"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {tripId && (
        <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Batches for {formData.trip_name || tripId}</DialogTitle>
            </DialogHeader>
            <BatchManagement
              batches={batchesForTrip}
              onRefresh={refreshBatches}
              defaultTripId={tripId}
              compact
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TripEditor;
