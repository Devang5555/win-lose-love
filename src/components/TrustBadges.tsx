import { deriveTrustBadges, TrustBadgeInput } from "@/lib/trustBadges";

interface Props extends TrustBadgeInput {
  className?: string;
}

const TrustBadges = ({ className = "", ...input }: Props) => {
  const badges = deriveTrustBadges(input);
  if (!badges.length) return null;

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 ${className}`}
      aria-label="Trust signals"
    >
      {badges.map(({ key, label, icon: Icon }) => (
        <div
          key={key}
          className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5 shadow-sm hover:border-primary/30 hover:shadow-card-hover transition-all"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-[12px] sm:text-[13px] font-medium text-foreground leading-tight">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default TrustBadges;
