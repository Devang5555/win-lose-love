/**
 * Premium vertical timeline for short trips / experiences.
 * Replaces the accordion when the journey fits within ≤2 days.
 */
import { Home } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

export interface TimelineDay {
  day: number;
  title: string;
  stay?: string;
  items: string[];
}

interface Props {
  days: TimelineDay[];
  title?: string;
}

// Pick a contextual emoji for a bullet based on simple keywords
const itemEmoji = (text: string): string => {
  const t = text.toLowerCase();
  if (/(depart|leave|start)/.test(t)) return "🌃";
  if (/(tea|coffee|chai|break)/.test(t)) return "☕";
  if (/(breakfast)/.test(t)) return "🥞";
  if (/(lunch)/.test(t)) return "🍱";
  if (/(dinner)/.test(t)) return "🍽️";
  if (/(trek|hike|climb)/.test(t)) return "🥾";
  if (/(rappell|adventure|zip)/.test(t)) return "🧗";
  if (/(sunrise)/.test(t)) return "🌄";
  if (/(sunset)/.test(t)) return "🌅";
  if (/(photo|view|stop)/.test(t)) return "📸";
  if (/(camp|tent|bonfire)/.test(t)) return "🏕️";
  if (/(return|back|drop)/.test(t)) return "🚌";
  if (/(arriv|reach)/.test(t)) return "📍";
  if (/(swim|beach|water)/.test(t)) return "🌊";
  return "•";
};

const ItineraryTimeline = ({ days, title = "Journey Timeline" }: Props) => {
  // Flatten into a single timeline if just one day; otherwise group by day
  return (
    <div>
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <span className="text-lg" aria-hidden>🗺️</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
            {title}
          </h2>
        </div>
      </ScrollReveal>

      <div className="relative">
        {/* vertical line */}
        <div
          className="absolute left-[18px] sm:left-[22px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent"
          aria-hidden
        />

        <ol className="space-y-5">
          {days.map((day) =>
            day.items.map((item, idx) => {
              const key = `${day.day}-${idx}`;
              return (
                <ScrollReveal key={key} delay={idx * 0.04}>
                  <li className="relative pl-12 sm:pl-14">
                    <span
                      className="absolute left-0 top-0.5 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-card border border-primary/30 shadow-sm text-base sm:text-lg"
                      aria-hidden
                    >
                      {itemEmoji(item)}
                    </span>

                    <div className="bg-card rounded-xl border border-border/60 shadow-sm px-4 py-3 hover:border-primary/30 transition-colors">
                      {idx === 0 && (
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1">
                          {days.length > 1 ? `Day ${day.day} • ${day.title}` : day.title}
                        </p>
                      )}
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {item}
                      </p>
                    </div>
                  </li>
                </ScrollReveal>
              );
            })
          )}
        </ol>

        {/* Stay strip if any */}
        {days.some((d) => d.stay) && (
          <div className="mt-5 pl-12 sm:pl-14 space-y-2">
            {days
              .filter((d) => d.stay)
              .map((d) => (
                <p
                  key={`stay-${d.day}`}
                  className="text-xs text-muted-foreground flex items-center gap-1.5"
                >
                  <Home className="h-3 w-3" />
                  {d.stay}
                </p>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItineraryTimeline;
