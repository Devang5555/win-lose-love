import { Sparkles, Minus, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { AddonCatalogItem, SelectedAddon } from "@/lib/addons";

interface Props {
  catalog: AddonCatalogItem[];
  selected: SelectedAddon[];
  maxQtyHint?: number; // e.g. number of travelers, used as soft cap
  onChange: (next: SelectedAddon[]) => void;
}

const AddonSelector = ({ catalog, selected, maxQtyHint, onChange }: Props) => {
  if (!catalog.length) return null;

  const getSelected = (id: string) => selected.find((s) => s.id === id);

  const toggle = (item: AddonCatalogItem, on: boolean) => {
    if (on) {
      const qty = item.default_qty ?? 1;
      onChange([
        ...selected.filter((s) => s.id !== item.id),
        { id: item.id, name: item.name, price: item.price, qty },
      ]);
    } else {
      onChange(selected.filter((s) => s.id !== item.id));
    }
  };

  const setQty = (item: AddonCatalogItem, qty: number) => {
    const cap = Math.min(item.max_qty ?? 99, maxQtyHint ?? 99);
    const clamped = Math.max(1, Math.min(cap, qty));
    onChange(
      selected.map((s) => (s.id === item.id ? { ...s, qty: clamped } : s))
    );
  };

  const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-card-foreground">
          Adventure Add-ons
        </h4>
        <span className="text-[11px] text-muted-foreground">Optional</span>
      </div>

      <div className="space-y-2">
        {catalog.map((item) => {
          const sel = getSelected(item.id);
          const on = !!sel;
          const cap = Math.min(item.max_qty ?? 99, maxQtyHint ?? 99);
          return (
            <div
              key={item.id}
              className={`rounded-xl border p-3 transition-all ${
                on
                  ? "border-primary/40 bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/20"
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={on}
                  onCheckedChange={(c) => toggle(item, !!c)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-card-foreground">
                      {item.name}
                    </p>
                    <span className="text-sm font-semibold text-primary whitespace-nowrap">
                      +{formatPrice(item.price)}
                      <span className="text-[11px] text-muted-foreground font-normal">
                        /qty
                      </span>
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                      {item.description}
                    </p>
                  )}

                  {on && sel && (
                    <div className="mt-2.5 flex items-center justify-between gap-3 animate-fade-in">
                      <div className="inline-flex items-center rounded-lg border border-border bg-background overflow-hidden">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none"
                          onClick={(e) => {
                            e.preventDefault();
                            setQty(item, sel.qty - 1);
                          }}
                          disabled={sel.qty <= 1}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="px-3 text-sm font-semibold tabular-nums min-w-[2rem] text-center">
                          {sel.qty}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none"
                          onClick={(e) => {
                            e.preventDefault();
                            setQty(item, sel.qty + 1);
                          }}
                          disabled={sel.qty >= cap}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <span className="text-sm font-semibold text-primary tabular-nums">
                        {formatPrice(item.price * sel.qty)}
                      </span>
                    </div>
                  )}
                </div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AddonSelector;
