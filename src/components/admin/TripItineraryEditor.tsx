import { Plus, Trash2, ChevronUp, ChevronDown, MapPin, Calendar } from "lucide-react";
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

  const update = (patch: Partial<RawItineraryJson>) => setItinerary({ ...data, ...patch });

  // ——— Days ———
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Day-wise Itinerary
          </h3>
          <Button type="button" size="sm" variant="outline" onClick={addDay}>
            <Plus className="w-4 h-4 mr-1" /> Add Day
          </Button>
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

        <div className="space-y-4">
          {(data.itinerary ?? []).map((day, idx) => (
            <div key={idx} className="border border-border rounded-xl p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-foreground">Day {day.day}</span>
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
          ))}
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
