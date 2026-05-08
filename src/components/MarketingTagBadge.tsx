import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getMarketingTagDefs } from "@/lib/marketingTags";

interface Props {
  tags: string[] | null | undefined;
  /** Show only the first tag (compact slots like cards). Default false (up to 2). */
  single?: boolean;
  className?: string;
  size?: "sm" | "xs";
}

const MarketingTagBadge = ({ tags, single = false, className, size = "sm" }: Props) => {
  const defs = getMarketingTagDefs(tags);
  if (defs.length === 0) return null;
  const visible = single ? defs.slice(0, 1) : defs;
  const sizeCls = size === "xs" ? "text-[10px] px-1.5 py-0 h-4" : "text-xs px-2 py-0.5";

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visible.map((d) => (
        <Badge
          key={d.key}
          className={cn("font-semibold border", sizeCls, d.className)}
        >
          {d.label}
        </Badge>
      ))}
    </div>
  );
};

export default MarketingTagBadge;
