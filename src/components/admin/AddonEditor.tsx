import { Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddonCatalogItem } from "@/lib/addons";

interface Props {
  addons: AddonCatalogItem[];
  onChange: (next: AddonCatalogItem[]) => void;
}

const AddonEditor = ({ addons, onChange }: Props) => {
  const add = () =>
    onChange([
      ...addons,
      { id: crypto.randomUUID(), name: "", price: 0, max_qty: undefined, description: "" },
    ]);

  const update = (idx: number, patch: Partial<AddonCatalogItem>) => {
    const next = [...addons];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const remove = (idx: number) => onChange(addons.filter((_, i) => i !== idx));

  return (
    <section>
      <h3 className="text-lg font-medium text-foreground mb-2 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        Adventure Add-ons
        <span className="text-xs text-muted-foreground font-normal">
          (optional — paid extras shown in booking modal)
        </span>
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        Example: <em>"Rappelling Experience"</em> at ₹250, max pp 10. Travelers can opt in
        and choose quantity. Add-ons don't affect seat counts.
      </p>

      <div className="space-y-2">
        {addons.map((a, idx) => (
          <div
            key={a.id || idx}
            className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-muted/40 p-3 rounded-lg"
          >
            <div className="md:col-span-4">
              <Label className="text-[11px] mb-1 block">Name *</Label>
              <Input
                placeholder="e.g. Rappelling Experience"
                value={a.name}
                onChange={(e) => update(idx, { name: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-[11px] mb-1 block">Price (₹) *</Label>
              <Input
                type="number"
                placeholder="250"
                value={a.price || ""}
                onChange={(e) => update(idx, { price: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-[11px] mb-1 block">Max pp</Label>
              <Input
                type="number"
                placeholder="Optional"
                value={a.max_qty ?? ""}
                onChange={(e) =>
                  update(idx, {
                    max_qty: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div className="md:col-span-3">
              <Label className="text-[11px] mb-1 block">Description</Label>
              <Input
                placeholder="Short note shown under name"
                value={a.description || ""}
                onChange={(e) => update(idx, { description: e.target.value })}
              />
            </div>
            <div className="md:col-span-1 flex md:justify-end pt-5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => remove(idx)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="w-4 h-4 mr-1" /> Add Add-on
        </Button>
      </div>
    </section>
  );
};

export default AddonEditor;
