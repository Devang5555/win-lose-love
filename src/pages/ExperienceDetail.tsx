import { useParams } from "react-router-dom";
import { useTrips } from "@/hooks/useTrips";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, CheckCircle, XCircle, ShieldCheck, Calendar, Phone, Mail, Bell, MessageCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import ExperienceBookingModal from "@/components/ExperienceBookingModal";
import DepartureSelectorModal from "@/components/DepartureSelectorModal";

interface PricingTier { label: string; price: number; description?: string }

const ExperienceDetail = () => {
  const { experienceId } = useParams<{ experienceId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { loading, getTrip, getTripBatches, isTripBookable } = useTrips();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [selectedTierIdx, setSelectedTierIdx] = useState<number>(0);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isDepartureOpen, setIsDepartureOpen] = useState(false);

  const experience = getTrip(experienceId || "");
  const pricingTiers: PricingTier[] = Array.isArray((experience as any)?.pricing_tiers)
    ? ((experience as any).pricing_tiers as PricingTier[]).filter((t) => t.label && t.price > 0)
    : [];
  const effectivePrice = pricingTiers.length > 0 ? pricingTiers[selectedTierIdx]?.price ?? experience?.price_default ?? 0 : experience?.price_default ?? 0;
  const slots = getTripBatches(experienceId || "");
  const bookable = experienceId ? isTripBookable(experienceId) : false;
  const visibleSlots = showAllSlots ? slots : slots.slice(0, 3);
  const allSoldOut = slots.length > 0 && slots.every((s) => s.batch_size - s.seats_booked <= 0);
  const sendWhatsApp = (msg: string) =>
    window.open(`https://wa.me/919415026522?text=${encodeURIComponent(msg)}`, "_blank");

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <Skeleton className="h-72 w-full rounded-2xl mb-6" />
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Experience not found</h1>
        </div>
        <Footer />
      </div>
    );
  }

  const handleBooking = () => {
    if (!user) {
      toast({ title: "Please sign in to book", description: "Create an account or sign in to continue.", variant: "destructive" });
      return;
    }
    if (!selectedSlot) {
      toast({ title: "Select a date", description: "Please pick a slot before booking.", variant: "destructive" });
      return;
    }
    setIsBookingOpen(true);
  };

  const slotForBooking = slots.find((s) => s.id === selectedSlot);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
        <img
          src={experience.images?.[0] || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200"}
          alt={experience.trip_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 z-20 container mx-auto px-4 pb-6 md:pb-10">
          <div className="flex flex-wrap gap-2 mb-3">
            {experience.tags?.map((tag) => (
              <Badge key={tag} className="bg-primary/90 text-primary-foreground font-bold">{tag}</Badge>
            ))}
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground">{experience.trip_name}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-muted-foreground">
            {experience.locations?.[0] && (
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-accent" />{experience.locations[0]}</span>
            )}
            <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-primary" />{experience.duration}</span>
            {experience.event_time && <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-forest" />{experience.event_time}</span>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {experience.summary && (
              <Card>
                <CardHeader><CardTitle className="font-serif">About This Experience</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground leading-relaxed">{experience.summary}</p></CardContent>
              </Card>
            )}

            {experience.highlights?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="font-serif">✨ Highlights</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {experience.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent flex-shrink-0" />
                        {h}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {experience.inclusions?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="font-serif text-lg">✅ Inclusions</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {experience.inclusions.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
                        {item}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {experience.exclusions?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="font-serif text-lg">❌ Exclusions</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {experience.exclusions.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                        {item}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {experience.safety_info?.length > 0 && (
              <Card className="border-forest/30 bg-forest/5">
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-forest" />
                    Safety First
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {experience.safety_info.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar — Booking */}
          <div className="space-y-6">
            <Card className="sticky top-24 border-2 border-primary/30 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 pb-4">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <span>✨</span> Early Access Offer
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-bold text-primary leading-none">
                      ₹{effectivePrice.toLocaleString("en-IN")}
                    </span>
                    {effectivePrice < 599 && (
                      <span className="text-sm text-muted-foreground line-through">₹599</span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    per person • Available Every Weekend
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {pricingTiers.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">💰 Choose Your Option</p>
                    <div className="space-y-2">
                      {pricingTiers.map((tier, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedTierIdx(i)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-all",
                            selectedTierIdx === i
                              ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                              : "border-border hover:border-primary/40"
                          )}
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">{tier.label}</span>
                            <span className="text-sm font-bold text-primary">₹{tier.price.toLocaleString("en-IN")}</span>
                          </div>
                          {tier.description && (
                            <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-foreground">📅 Available Slots</p>
                    {slots.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsDepartureOpen(true)}
                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        View all departures →
                      </button>
                    )}
                  </div>
                  {slots.length > 0 ? (
                    <div className="space-y-2">
                      {visibleSlots.map((slot) => {
                        const seatsLeft = Math.max(0, slot.batch_size - slot.seats_booked);
                        const isSoldOut = seatsLeft <= 0;
                        return (
                          <button
                            key={slot.id}
                            onClick={() => !isSoldOut && setSelectedSlot(slot.id)}
                            disabled={isSoldOut}
                            className={cn(
                              "w-full text-left p-3 rounded-lg border transition-all text-sm",
                              isSoldOut
                                ? "opacity-60 cursor-not-allowed border-border bg-muted"
                                : selectedSlot === slot.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/40"
                            )}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-foreground">
                                {new Date(slot.start_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                              </span>
                              <Badge variant={seatsLeft <= 5 ? "destructive" : "secondary"} className="text-xs">
                                {isSoldOut ? "Sold Out" : seatsLeft <= 5 ? `Only ${seatsLeft} left` : `${seatsLeft} seats`}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{slot.batch_name}</p>
                          </button>
                        );
                      })}
                      {!showAllSlots && slots.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setShowAllSlots(true)}
                          className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:underline py-1"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                          Show {slots.length - 3} more
                        </button>
                      )}
                      {allSoldOut && (
                        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-2">
                          <p className="text-xs font-semibold text-destructive text-center">
                            Sold Out – Next Batch Available Soon
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button size="sm" variant="outline" className="h-9 text-xs"
                              onClick={() => sendWhatsApp(`Hi GoBhraman 👋\n\nPlease *Notify Me* when new dates open for *${experience.trip_name}*.`)}>
                              <Bell className="w-3.5 h-3.5 mr-1" /> Notify Me
                            </Button>
                            <Button size="sm" className="h-9 text-xs bg-[#25D366] hover:bg-[#25D366]/90 text-white"
                              onClick={() => sendWhatsApp(`Hi GoBhraman 👋\n\nAdd me to the *Waitlist* for *${experience.trip_name}*.`)}>
                              <MessageCircle className="w-3.5 h-3.5 mr-1" /> Waitlist
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg text-center">
                      No upcoming slots yet. Check back soon!
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleBooking}
                  className="w-full font-bold text-lg py-6"
                  disabled={!bookable || slots.length === 0 || allSoldOut}
                >
                  {!bookable ? "Coming Soon" : allSoldOut ? "Sold Out" : "Reserve Your Spot"}
                </Button>

                

                <div className="text-center space-y-1 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">Need help?</p>
                  {experience.contact_phone && (
                    <a href={`tel:${experience.contact_phone}`} className="flex items-center justify-center gap-1 text-sm text-primary hover:underline">
                      <Phone className="w-3.5 h-3.5" />{experience.contact_phone}
                    </a>
                  )}
                  {experience.contact_email && (
                    <a href={`mailto:${experience.contact_email}`} className="flex items-center justify-center gap-1 text-sm text-primary hover:underline">
                      <Mail className="w-3.5 h-3.5" />{experience.contact_email}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />

      {experience && (
        <ExperienceBookingModal
          experienceId={experience.trip_id}
          experienceName={experience.trip_name}
          duration={experience.duration}
          pricePerPerson={effectivePrice}
          selectedTier={pricingTiers.length > 0 ? pricingTiers[selectedTierIdx] : null}
          selectedSlot={
            slotForBooking
              ? {
                  id: slotForBooking.id,
                  batch_name: slotForBooking.batch_name,
                  start_date: slotForBooking.start_date,
                  end_date: slotForBooking.end_date,
                  batch_size: slotForBooking.batch_size,
                  available_seats: Math.max(0, slotForBooking.batch_size - slotForBooking.seats_booked),
                }
              : null
          }
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      )}

      {experience && (
        <DepartureSelectorModal
          isOpen={isDepartureOpen}
          onClose={() => setIsDepartureOpen(false)}
          tripName={experience.trip_name}
          image={experience.images?.[0]}
          duration={experience.duration}
          pickup={experience.locations?.[0]}
          price={effectivePrice}
          difficulty={(experience as any).difficulty}
          slots={slots.map((s) => ({
            id: s.id,
            batch_name: s.batch_name,
            start_date: s.start_date,
            end_date: s.end_date,
            batch_size: s.batch_size,
            seats_booked: s.seats_booked,
            price: (s as any).price_override ?? effectivePrice,
          }))}
          selectedSlotId={selectedSlot}
          onSelectSlot={(id) => setSelectedSlot(id)}
          onContinue={() => {
            setIsDepartureOpen(false);
            handleBooking();
          }}
          timeline={
            experience.duration?.toLowerCase().includes("night")
              ? ["Late Night Departure", "Night Experience", "Dawn Return"]
              : ["Friday Departure", "Saturday Experience", "Sunday Return"]
          }
        />
      )}
    </div>
  );
};

export default ExperienceDetail;
