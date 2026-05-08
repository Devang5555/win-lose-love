import {
  MARKETING_TAGS,
  MAX_ACTIVE_MARKETING_TAGS,
  MarketingTagKey,
  getMarketingTagKeys,
  setMarketingTags,
  toggleMarketingTagKey,
} from "@/lib/marketingTags";

interface MarketingTagPickerProps {
  /** Source of truth — full tag list (for trips/experiences). */
  value: string[] | null | undefined;
  onChange: (next: string[]) => void;
  /** Optional title override. */
  title?: string;
}

/**
 * Quick chip selector for urgency/marketing tags.
 * Stores tags inside the existing tag array using a `mkt:` prefix.
 */
const MarketingTagPicker = ({ value, onChange, title = "Urgency & marketing chips" }: MarketingTagPickerProps) => {
  const active = getMarketingTagKeys(value);

  const handleToggle = (key: MarketingTagKey) => {
    const next = toggleMarketingTagKey(active, key);
    onChange(setMarketingTags(value, next));
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <span className="text-[10px] text-muted-foreground">
          {active.length}/{MAX_ACTIVE_MARKETING_TAGS} active
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {MARKETING_TAGS.map((d) => {
          const isOn = active.includes(d.key);
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => handleToggle(d.key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                isOn
                  ? `${d.className} ring-1 ring-current/30`
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        Visible on cards, booking widgets and departure chips. Marketing only — does not affect seat logic.
      </p>
    </div>
  );
};

export default MarketingTagPicker;
