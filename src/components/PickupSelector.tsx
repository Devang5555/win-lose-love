import { MapPin, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/data/trips";

export interface PickupOption {
  id: string;
  city: string;
  /** Short address line, e.g. "Dadar East" */
  meetingPoint?: string;
  /** Departure time hint, e.g. "Fri · 9:00 PM" */
  departureTime?: string;
  /** Total price per person from this pickup */
  price: number;
  /** Optional small tag e.g. "Popular" */
  tag?: string;
}

interface PickupSelectorProps {
  options: PickupOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * Premium card-style pickup point selector.
 * Replaces the basic city dropdown — shows meeting point, departure time and price per option.
 */
const PickupSelector = ({ options, value, onChange, className }: PickupSelectorProps) => {
  if (!options || options.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Choose your pickup point
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const selected = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              aria-pressed={selected}
              className={cn(
                "relative text-left rounded-xl border p-3 transition-all duration-200 group",
                "hover:border-primary/60 hover:shadow-sm",
                selected
                  ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className={cn("w-4 h-4 flex-shrink-0", selected ? "text-primary" : "text-accent")} />
                  <span className="font-semibold text-sm text-card-foreground truncate">
                    {opt.city}
                  </span>
                </div>
                {selected && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground flex-shrink-0">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                )}
              </div>

              {opt.meetingPoint && (
                <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                  {opt.meetingPoint}
                </p>
              )}

              {opt.departureTime && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-2">
                  <Clock className="w-3 h-3" />
                  {opt.departureTime}
                </p>
              )}

              <div className="flex items-end justify-between gap-2 pt-1.5 border-t border-border/60">
                <span className={cn("text-sm font-bold", selected ? "text-primary" : "text-card-foreground")}>
                  {formatPrice(opt.price)}
                </span>
                {opt.tag && (
                  <span className="text-[10px] font-semibold text-accent uppercase tracking-wide">
                    {opt.tag}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PickupSelector;
