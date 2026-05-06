import { ShieldCheck, BadgeIndianRupee, Headphones, Lock } from "lucide-react";

const items = [
  { icon: ShieldCheck, label: "Verified Stays" },
  { icon: BadgeIndianRupee, label: "Transparent Pricing" },
  { icon: Headphones, label: "Trip Captain Support" },
  { icon: Lock, label: "Secure Booking" },
];

interface TrustIndicatorsProps {
  variant?: "grid" | "row";
  className?: string;
}

const TrustIndicators = ({ variant = "grid", className = "" }: TrustIndicatorsProps) => {
  if (variant === "row") {
    return (
      <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground ${className}`}>
        {items.map(({ icon: Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">{label}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {items.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-2.5 py-2 text-xs"
        >
          <Icon className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="font-medium text-card-foreground leading-tight">{label}</span>
        </div>
      ))}
    </div>
  );
};

export default TrustIndicators;
