import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExperienceSlots, type Experience } from "@/hooks/useExperiences";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, CheckCircle, XCircle, ShieldCheck, Calendar, Users, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const ExperienceDetail = () => {
  const { experienceId } = useParams<{ experienceId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { data: experience, isLoading } = useQuery({
    queryKey: ["experience", experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("experience_id", experienceId!)
        .single();
      if (error) throw error;
      return data as Experience;
    },
    enabled: !!experienceId,
  });

  const { upcomingSlots, loading: slotsLoading } = useExperienceSlots(experienceId);

  if (isLoading) {
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
    const slot = upcomingSlots.find((s) => s.id === selectedSlot);
    const whatsappMsg = `Hi! I'd like to book *${experience.name}* on ${slot?.slot_date}. Price: ₹${experience.price}. My name: ${user.email}`;
    window.open(`https://wa.me/919415026522?text=${encodeURIComponent(whatsappMsg)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
        <img
          src={experience.images?.[0] || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200"}
          alt={experience.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 z-20 container mx-auto px-4 pb-6 md:pb-10">
          <div className="flex flex-wrap gap-2 mb-3">
            {experience.tags?.map((tag) => (
              <Badge key={tag} className="bg-primary/90 text-primary-foreground font-bold">{tag}</Badge>
            ))}
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground">{experience.name}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-accent" />{experience.location}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-primary" />{experience.duration}</span>
            {experience.time_info && <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-forest" />{experience.time_info}</span>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {experience.description && (
              <Card>
                <CardHeader><CardTitle className="font-serif">About This Experience</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground leading-relaxed">{experience.description}</p></CardContent>
              </Card>
            )}

            {/* Highlights */}
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

            {/* Inclusions & Exclusions */}
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

            {/* Safety */}
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
            <Card className="sticky top-24 border-2 border-primary/30 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                <CardTitle className="font-serif text-center">
                  <span className="text-3xl font-bold text-primary">₹{experience.price.toLocaleString("en-IN")}</span>
                  <span className="text-sm text-muted-foreground ml-2">per person</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Date Slots */}
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">📅 Available Dates</p>
                  {slotsLoading ? (
                    <Skeleton className="h-20 w-full rounded-lg" />
                  ) : upcomingSlots.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {upcomingSlots.map((slot) => {
                        const seatsLeft = slot.available_seats ?? (slot.seat_limit - slot.seats_booked);
                        return (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot.id)}
                            className={cn(
                              "w-full text-left p-3 rounded-lg border transition-all text-sm",
                              selectedSlot === slot.id
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/40"
                            )}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-foreground">
                                {new Date(slot.slot_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                              </span>
                              <Badge variant={seatsLeft <= 5 ? "destructive" : "secondary"} className="text-xs">
                                {seatsLeft <= 0 ? "Full" : `${seatsLeft} seats left`}
                              </Badge>
                            </div>
                            {slot.start_time && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {slot.start_time}{slot.end_time ? ` – ${slot.end_time}` : ""}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg text-center">
                      No upcoming dates yet. Check back soon!
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleBooking}
                  className="w-full font-bold text-lg py-6"
                  disabled={!experience.booking_live || upcomingSlots.length === 0}
                >
                  {experience.booking_live ? "Book Now via WhatsApp" : "Coming Soon"}
                </Button>

                {/* Contact */}
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
    </div>
  );
};

export default ExperienceDetail;
