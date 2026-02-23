import { ChevronRight, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ScrollReveal from "@/components/ScrollReveal";
import type { TripItineraryData } from "@/data/tripItineraries";

interface TripItinerarySectionProps {
  data: TripItineraryData;
}

const TripItinerarySection = ({ data }: TripItinerarySectionProps) => {
  return (
    <div className="space-y-12">
      {/* Overview Cards */}
      <div>
        <ScrollReveal>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6">Trip Overview</h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.overview.map((item, i) => (
            <ScrollReveal key={item.label} delay={i * 0.08}>
              <Card className="border-border/50 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium text-foreground leading-relaxed">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
        {data.bestTime && (
          <p className="text-sm text-muted-foreground mt-3">
            🌤 Best time to visit: <span className="font-medium text-foreground">{data.bestTime}</span>
          </p>
        )}
      </div>

      {/* Day-wise Accordion */}
      <div>
        <ScrollReveal>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6">Day-Wise Itinerary</h2>
        </ScrollReveal>
        <Accordion type="single" collapsible defaultValue="day-1" className="space-y-3">
          {data.itinerary.map((day) => (
            <ScrollReveal key={day.day} delay={day.day * 0.08}>
              <AccordionItem value={`day-${day.day}`} className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden px-0">
                <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/40 transition-colors [&[data-state=open]]:bg-primary/5">
                  <div className="flex items-center gap-3 text-left">
                    <span className="flex items-center justify-center h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                      {day.day}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-base">{day.title}</p>
                      {day.stay && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Home className="h-3 w-3" /> Stay: {day.stay}
                        </p>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 pt-2">
                  {day.options && (
                    <div className="grid sm:grid-cols-2 gap-3 mb-4">
                      {day.options.map((opt) => (
                        <div key={opt.label} className="p-3 rounded-lg bg-muted/50 border border-border/30">
                          <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <ul className="space-y-2">
                    {day.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/85">
                        <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </ScrollReveal>
          ))}
        </Accordion>
      </div>

      {/* Places Grid */}
      {data.places && data.places.length > 0 && (
        <div>
          <ScrollReveal>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6">Places You'll Explore</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.places.map((place, i) => (
              <ScrollReveal key={place.name} delay={i * 0.08}>
                <Card className="overflow-hidden border-border/50 shadow-card hover:shadow-card-hover transition-all duration-300 group">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={place.img} alt={place.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-serif font-semibold text-foreground mb-1">{place.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{place.desc}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}

      {/* Travel Notes */}
      {data.travelNotes.length > 0 && (
        <div>
          <ScrollReveal>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6">Important Travel Notes</h2>
          </ScrollReveal>
          <div className="space-y-3">
            {data.travelNotes.map((note, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <div className="flex items-start gap-4 bg-card rounded-xl p-4 border border-border/50 shadow-sm">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
                    <note.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed pt-1">{note.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripItinerarySection;
