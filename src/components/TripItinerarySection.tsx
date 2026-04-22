import { ChevronRight, Home, MapPin, Car, Hotel, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import ScrollReveal from "@/components/ScrollReveal";
import type { TripItineraryData } from "@/data/tripItineraries";

interface TripItinerarySectionProps {
  data: TripItineraryData;
}

const SectionDivider = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <ScrollReveal>
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
    </div>
  </ScrollReveal>
);

const TripItinerarySection = ({ data }: TripItinerarySectionProps) => {
  const totalDistance = data.distanceSummary
    ? "~" + data.distanceSummary.reduce((sum, r) => {
        const num = parseInt(r.distance.replace(/[^0-9]/g, ""), 10);
        return sum + (isNaN(num) ? 0 : num);
      }, 0) + " km"
    : null;

  return (
    <div className="space-y-12">
      {/* Overview Cards */}
      <div>
        <SectionDivider icon={Calendar} title="Trip Overview" />
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
        <SectionDivider icon={MapPin} title="Day-Wise Itinerary" />
        <Accordion type="single" collapsible defaultValue="day-1" className="space-y-3">
          {data.itinerary.map((day) => (
            <ScrollReveal key={day.day} delay={day.day * 0.06}>
              <AccordionItem value={`day-${day.day}`} className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden px-0">
                <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/40 transition-colors [&[data-state=open]]:bg-primary/5">
                  <div className="flex items-center gap-3 text-left">
                    <span className="flex items-center justify-center h-9 w-9 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                      {day.day}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-sm md:text-base">{day.title}</p>
                      {day.stay && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Home className="h-3 w-3" /> {day.stay}
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

      {/* Stay Summary Table */}
      {data.staySummary && data.staySummary.length > 0 && (
        <div>
          <SectionDivider icon={Home} title="Stay Summary" />
          <ScrollReveal>
            <Card className="border-border/50 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/5">
                      <TableHead className="font-bold text-foreground">Destination</TableHead>
                      <TableHead className="font-bold text-foreground">Dates</TableHead>
                      <TableHead className="font-bold text-foreground text-right">Nights</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.staySummary.map((row, i) => (
                      <TableRow key={i} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{row.destination}</TableCell>
                        <TableCell className="text-muted-foreground">{row.dates}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold">
                            {row.nights}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell className="font-bold text-foreground">Total</TableCell>
                      <TableCell className="font-bold text-foreground">
                        {data.staySummary[0]?.dates.split(" → ")[0]} → {data.staySummary[data.staySummary.length - 1]?.dates.split(" → ")[1]}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-primary text-primary-foreground font-bold">
                          {data.staySummary.reduce((sum, r) => {
                            const num = parseInt(r.nights, 10);
                            return sum + (isNaN(num) ? 0 : num);
                          }, 0)} Nights / {data.itinerary.length} Days
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>
          </ScrollReveal>
        </div>
      )}

      {/* Distance Summary Table */}
      {data.distanceSummary && data.distanceSummary.length > 0 && (
        <div>
          <SectionDivider icon={Car} title="Distance Summary" />
          <ScrollReveal>
            <Card className="border-border/50 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/5">
                      <TableHead className="font-bold text-foreground">Route</TableHead>
                      <TableHead className="font-bold text-foreground text-right">Distance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.distanceSummary.map((row, i) => (
                      <TableRow key={i} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{row.route}</TableCell>
                        <TableCell className="text-right text-muted-foreground font-medium">{row.distance}</TableCell>
                      </TableRow>
                    ))}
                    {totalDistance && (
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell className="font-bold text-foreground">Total</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-primary text-primary-foreground font-bold">{totalDistance}</Badge>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </ScrollReveal>
        </div>
      )}

      {/* Hotels Section */}
      {data.hotels && data.hotels.length > 0 && (
        <div>
          <SectionDivider icon={Hotel} title="Hotels (Indicative)" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.hotels.map((group, i) => (
              <ScrollReveal key={group.city} delay={i * 0.1}>
                <Card className="border-border/50 shadow-card hover:shadow-card-hover transition-shadow duration-300 h-full">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-primary" />
                      <h3 className="font-serif font-bold text-foreground text-lg">{group.city}</h3>
                    </div>
                    <ul className="space-y-2">
                      {group.hotels.map((hotel, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-foreground/85">
                          <Hotel className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                          <span className="font-medium">{hotel}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}

      {/* Places Grid */}
      {data.places && data.places.length > 0 && (
        <div>
          <SectionDivider icon={MapPin} title="Places You'll Explore" />
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
          <SectionDivider icon={Calendar} title="Important Travel Notes" />
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
