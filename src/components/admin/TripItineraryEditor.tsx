import { useState, useRef } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, MapPin, Calendar, GripVertical, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ICON_OPTIONS,
  emptyAdminItinerary,
  type RawItineraryJson,
  type RawItineraryDay,
} from "@/lib/tripItineraryAdapter";
import { getDefaultPolicies } from "@/lib/tripPolicies";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  tripName?: string;
  locations?: string[];
  itinerary: RawItineraryJson | null | undefined;
  setItinerary: (v: RawItineraryJson) => void;
  policies: string[];
  setPolicies: (v: string[]) => void;
}

const TripItineraryEditor = ({
  tripName,
  locations,
  itinerary,
  setItinerary,
  policies,
  setPolicies,
}: Props) => {
  const data: RawItineraryJson = itinerary ?? emptyAdminItinerary();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [ocrBusy, setOcrBusy] = useState(false);

  const update = (patch: Partial<RawItineraryJson>) => setItinerary({ ...data, ...patch });

  const handleOcrFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image (PNG/JPG)", variant: "destructive" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Image too large (max 8MB)", variant: "destructive" });
      return;
    }
    setOcrBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const { data: resp, error } = await supabase.functions.invoke("extract-itinerary-ocr", {
        body: { image: dataUrl },
      });
      if (error) throw error;
      if (!resp?.success || !resp?.data?.itinerary?.length) {
        toast({ title: "Couldn't extract itinerary", description: "Try a clearer image.", variant: "destructive" });
        return;
      }
      const days = (resp.data.itinerary as RawItineraryDay[]).map((d, i) => ({
        day: i + 1,
        title: d.title || `Day ${i + 1}`,
        icon: d.icon || "Sun",
        stay: d.stay || "",
        items: Array.isArray(d.items) ? d.items.filter(Boolean) : [],
      }));
      update({ itinerary: days, bestTime: resp.data.bestTime || data.bestTime });
      toast({ title: `Extracted ${days.length} day(s)`, description: "Review and edit before saving." });
    } catch (e: any) {
      toast({ title: "OCR failed", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setOcrBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const addDay = () => {
    const days = data.itinerary ?? [];
    const next = days.length + 1;
    update({ itinerary: [...days, { day: next, title: `Day ${next}`, icon: "Sun", stay: "", items: [""] }] });
  };

  const updateDay = (idx: number, patch: Partial<RawItineraryDay>) => {
    const days = [...(data.itinerary ?? [])];
    days[idx] = { ...days[idx], ...patch };
    update({ itinerary: days });
  };

  const removeDay = (idx: number) => {
    const days = (data.itinerary ?? []).filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 }));
    update({ itinerary: days });
  };

  const moveDay = (idx: number, dir: -1 | 1) => {
    const days = [...(data.itinerary ?? [])];
    const j = idx + dir;
    if (j < 0 || j >= days.length) return;
    [days[idx], days[j]] = [days[j], days[idx]];
    update({ itinerary: days.map((d, i) => ({ ...d, day: i + 1 })) });
  };

  // ——— Drag & drop reordering ———
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const days = [...(data.itinerary ?? [])];
    const [moved] = days.splice(from, 1);
    days.splice(to, 0, moved);
    update({ itinerary: days.map((d, i) => ({ ...d, day: i + 1 })) });
  };

  const updateDayItem = (dayIdx: number, itemIdx: number, value: string) => {
    const items = [...(data.itinerary?.[dayIdx]?.items ?? [])];
    items[itemIdx] = value;
    updateDay(dayIdx, { items });
  };

  const addDayItem = (dayIdx: number) => {
    const items = [...(data.itinerary?.[dayIdx]?.items ?? []), ""];
    updateDay(dayIdx, { items });
  };

  const removeDayItem = (dayIdx: number, itemIdx: number) => {
    const items = (data.itinerary?.[dayIdx]?.items ?? []).filter((_, i) => i !== itemIdx);
    updateDay(dayIdx, { items });
  };

  // ——— Policies ———
  const addPolicy = () => setPolicies([...policies, ""]);
  const updatePolicy = (i: number, v: string) => {
    const next = [...policies];
    next[i] = v;
    setPolicies(next);
  };
  const removePolicy = (i: number) => setPolicies(policies.filter((_, idx) => idx !== i));

  const loadDefaultPolicies = () => setPolicies(getDefaultPolicies(tripName, locations));

  return (
    <div className="space-y-8">
      {/* ——— Itinerary ——— */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Day-wise Itinerary
          </h3>
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleOcrFile(e.target.files[0])}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={ocrBusy}
              title="Extract itinerary from brochure/screenshot"
            >
              {ocrBusy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              {ocrBusy ? "Extracting…" : "AI Extract"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={addDay}>
              <Plus className="w-4 h-4 mr-1" /> Add Day
            </Button>
          </div>
        </div>

        {/* Best time */}
        <div className="mb-4">
          <Label className="mb-2 block text-xs">Best Time to Visit (optional)</Label>
          <Input
            value={data.bestTime ?? ""}
            onChange={(e) => update({ bestTime: e.target.value })}
            placeholder="e.g., March–June & Sept–Oct"
          />
        </div>

        {(data.itinerary ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground italic">No days added yet. Click "Add Day" to start.</p>
        )}

        {(data.itinerary ?? []).length > 1 && (
          <p className="text-xs text-muted-foreground mb-2">
            Tip: Drag the <GripVertical className="inline w-3 h-3 -mt-0.5" /> handle to reorder days.
          </p>
        )}

        <div className="space-y-4">
          {(data.itinerary ?? []).map((day, idx) => {
            const isDragging = dragIdx === idx;
            const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
            return (
            <div
              key={idx}
              draggable
              onDragStart={(e) => {
                setDragIdx(idx);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overIdx !== idx) setOverIdx(idx);
              }}
              onDragLeave={() => {
                if (overIdx === idx) setOverIdx(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIdx !== null) reorder(dragIdx, idx);
                setDragIdx(null);
                setOverIdx(null);
              }}
              onDragEnd={() => {
                setDragIdx(null);
                setOverIdx(null);
              }}
              className={`border rounded-xl p-4 bg-muted/20 transition-all ${
                isDragging ? "opacity-50 border-primary" : "border-border"
              } ${isOver ? "border-primary ring-2 ring-primary/30 bg-primary/5" : ""}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-foreground flex items-center gap-2">
                  <span
                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-4 h-4" />
                  </span>
                  Day {day.day}
                </span>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => moveDay(idx, -1)} disabled={idx === 0}>
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => moveDay(idx, 1)} disabled={idx === (data.itinerary?.length ?? 0) - 1}>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeDay(idx)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="md:col-span-2">
                  <Label className="mb-1 block text-xs">Title *</Label>
                  <Input
                    value={day.title}
                    onChange={(e) => updateDay(idx, { title: e.target.value })}
                    placeholder="e.g., Chandigarh → Shimla (~120 km | 3.5–4 hrs)"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Icon</Label>
                  <Select value={day.icon ?? "Sun"} onValueChange={(v) => updateDay(idx, { icon: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((o) => (
                        <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mb-3">
                <Label className="mb-1 block text-xs">Stay (optional)</Label>
                <Input
                  value={day.stay ?? ""}
                  onChange={(e) => updateDay(idx, { stay: e.target.value })}
                  placeholder="e.g., Shimla (Night 1 of 2)"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs">Activities / Bullet Points</Label>
                  <Button type="button" size="sm" variant="ghost" onClick={() => addDayItem(idx)}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {day.items.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateDayItem(idx, i, e.target.value)}
                        placeholder="e.g., Depart early morning from Chandigarh"
                      />
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeDayItem(idx, i)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </section>

      {/* ——— Policies ——— */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Trip Policies
          </h3>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={loadDefaultPolicies}>
              Load Smart Defaults
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={addPolicy}>
              <Plus className="w-4 h-4 mr-1" /> Add Policy
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Click <span className="font-medium">Load Smart Defaults</span> to auto-fill policies based on trip name/location, then edit. Leave empty to fall back to system defaults at runtime.
        </p>

        {policies.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No custom policies — system defaults will show on the trip page.</p>
        )}

        <div className="space-y-2">
          {policies.map((p, i) => (
            <div key={i} className="flex gap-2">
              <Textarea
                value={p}
                onChange={(e) => updatePolicy(i, e.target.value)}
                rows={2}
                placeholder="e.g., AMS — consult a doctor before high-altitude travel."
              />
              <Button type="button" size="sm" variant="ghost" onClick={() => removePolicy(i)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default TripItineraryEditor;
