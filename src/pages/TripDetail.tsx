import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  MapPin, Clock, Users, Calendar, Phone, Mail, 
  Check, X, ChevronRight, ArrowLeft, Share2, Bell, Sparkles, Tent, Flame, MessageCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import InterestPopup from "@/components/InterestPopup";
import BatchSelector, { BatchInfo } from "@/components/BatchSelector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTrip, getTripPrice, formatPrice } from "@/data/trips";
import { useToast } from "@/hooks/use-toast";
import { useTrips } from "@/hooks/useTrips";
import JsonLd from "@/components/JsonLd";
import SeoMeta from "@/components/SeoMeta";

const TripDetail = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const trip = getTrip(tripId || "");
  const { isTripBookable, loading, getTrip: getDbTrip } = useTrips();
  const dbTrip = tripId ? getDbTrip(tripId) : undefined;
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isInterestOpen, setIsInterestOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchInfo | null>(null);
  const { toast } = useToast();

  // Use database price if available, otherwise fall back to static
  const displayPrice = dbTrip?.price_default ?? (trip ? getTripPrice(trip) : 0);
  const advanceAmount = dbTrip?.advance_amount ?? trip?.booking?.advance ?? 2000;
  const hasPunePrice = dbTrip?.price_from_pune || (typeof trip?.price === 'object' && trip.price.fromPune);
  const punePrice = dbTrip?.price_from_pune ?? (typeof trip?.price === 'object' ? trip.price.fromPune : null);

  const isBookable = !!tripId && !loading && isTripBookable(tripId);

  // JSON-LD structured data
  const tripJsonLd = useMemo(() => {
    if (!trip) return null;
    const schema: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: trip.tripName,
      description: trip.summary || "",
      image: trip.images?.[0] || "",
      touristType: "Adventure",
      provider: {
        "@type": "Organization",
        name: "GoBhraman",
        url: "https://gobhraman.com",
      },
      offers: {
        "@type": "Offer",
        price: displayPrice,
        priceCurrency: "INR",
        availability: isBookable
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
        url: typeof window !== "undefined" ? window.location.href : "",
      },
      duration: trip.duration,
    };

    if (trip.itinerary) {
      schema.itinerary = {
        "@type": "ItemList",
        numberOfItems: trip.itinerary.length,
        itemListElement: trip.itinerary.map((day, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: day.title,
        })),
      };
    }

    return schema;
  }, [trip, displayPrice, isBookable]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <p className="text-muted-foreground">Loading experience…</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Journey Not Found</h1>
          <p className="text-muted-foreground mb-8">The experience you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/trips">Explore Journeys</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }


  const handleShare = async () => {
    try {
      await navigator.share({
        title: trip.tripName,
        text: trip.summary,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Experience link has been copied to clipboard.",
      });
    }
  };

  const handleBookingClick = () => {
    if (!isBookable) {
      toast({
        title: "Coming Soon!",
        description: "This journey is launching soon. Click 'Notify Me' to get updates.",
      });
      return;
    }
    setIsBookingOpen(true);
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(`Hi! I'm interested in the ${trip.tripName} journey. Can you share more details?`);
    window.open(`https://wa.me/919415026522?text=${message}`, '_blank');
  };


  return (
    <div className="min-h-screen bg-background">
      <SeoMeta
        title={`${trip.tripName} - GoBhraman`}
        description={trip.summary || `Explore ${trip.tripName} with GoBhraman`}
        image={trip.images?.[0]}
        url={window.location.href}
        type="product"
      />
      {tripJsonLd && <JsonLd data={tripJsonLd} />}
      <Navbar />

      {/* Hero */}
      <section className="relative h-[50vh] md:h-[65vh]">
        <img
          src={trip.images[0] || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"}
          alt={trip.tripName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
        
        {/* Back Button */}
        <Link 
          to="/trips"
          className="absolute top-24 md:top-28 left-4 md:left-8 flex items-center gap-2 text-primary-foreground/90 hover:text-primary-foreground transition-colors bg-background/20 backdrop-blur-sm px-3 py-2 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden md:inline">Back to Journeys</span>
        </Link>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-12">
          <div className="container mx-auto">
            {/* Status Badge - moved inside content for better mobile layout */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-wrap gap-1.5 md:gap-2 flex-1 pr-2">
                <Badge className="bg-primary text-primary-foreground font-semibold text-xs md:text-sm">{trip.duration}</Badge>
                {trip.locations?.slice(0, 2).map((loc) => (
                  <Badge key={loc} variant="secondary" className="bg-background/30 text-primary-foreground border-0 backdrop-blur-sm text-xs md:text-sm hidden sm:inline-flex">
                    {loc}
                  </Badge>
                ))}
              </div>
              {isBookable ? (
                <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm animate-pulse whitespace-nowrap flex-shrink-0">
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  READY TO JOIN
                </Badge>
              ) : (
                <Badge className="bg-sunset text-primary-foreground font-bold px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                  🚀 Coming Soon
                </Badge>
              )}
            </div>
            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">
              {trip.tripName}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl">
              {trip.summary}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Highlights */}
              {trip.highlights && (
                <div className="mb-8">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6">Experience Highlights</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trip.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start gap-4 p-5 bg-gradient-to-br from-card to-secondary rounded-xl border border-border hover:border-primary/30 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                          <Check className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-card-foreground font-medium">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stay Details for camping trips */}
              {trip.stayDetails && (
                <div className="mb-8">
                  <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                    <Tent className="w-7 h-7 text-primary" />
                    Stay Details
                  </h2>
                  <div className="bg-gradient-to-br from-sunset/10 to-accent/10 rounded-xl p-6 border border-sunset/20">
                    <ul className="space-y-3">
                      {trip.stayDetails.map((detail, index) => (
                        <li key={index} className="flex items-center gap-3 text-card-foreground">
                          <Flame className="w-5 h-5 text-sunset flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Activities for camping trips */}
              {trip.activities && (
                <div className="mb-8">
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Featured Activities</h2>
                  <div className="flex flex-wrap gap-2">
                    {trip.activities.map((activity, index) => (
                      <Badge key={index} variant="outline" className="px-4 py-2 text-sm bg-primary/5 border-primary/20">
                        {activity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <Tabs defaultValue="itinerary" className="w-full">
                <TabsList className="w-full justify-start mb-6 bg-muted h-auto p-1.5 flex-wrap rounded-xl">
                  <TabsTrigger value="itinerary" className="flex-1 md:flex-none rounded-lg font-semibold">Itinerary</TabsTrigger>
                  <TabsTrigger value="inclusions" className="flex-1 md:flex-none rounded-lg font-semibold">What's Included</TabsTrigger>
                  <TabsTrigger value="policy" className="flex-1 md:flex-none rounded-lg font-semibold">Policies</TabsTrigger>
                </TabsList>

                <TabsContent value="itinerary" className="space-y-6">
                  {trip.itinerary ? (
                    trip.itinerary.map((day) => (
                      <div key={day.day} className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
                        <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-5 border-b border-border">
                          <div className="flex items-center gap-4">
                            <span className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg">
                              {day.day}
                            </span>
                            <h3 className="font-serif text-lg md:text-xl font-semibold text-card-foreground">
                              {day.title}
                            </h3>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="space-y-4">
                            {day.schedule.map((item, index) => (
                              <div key={index} className="flex gap-4 items-start">
                                <div className="w-16 flex-shrink-0">
                                  <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded">{item.time}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-card-foreground">{item.activity}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-muted rounded-xl">
                      <p className="text-muted-foreground">Detailed itinerary coming soon. Contact us for more information.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="inclusions" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Inclusions */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                      <h3 className="font-serif text-xl font-semibold text-card-foreground mb-5 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-forest/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-forest" />
                        </div>
                        What's Included
                      </h3>
                      {trip.inclusions ? (
                        <ul className="space-y-3">
                          {trip.inclusions.map((item, index) => (
                            <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-sm">Contact us for inclusion details.</p>
                      )}
                    </div>

                    {/* Exclusions */}
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                      <h3 className="font-serif text-xl font-semibold text-card-foreground mb-5 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                          <X className="w-4 h-4 text-destructive" />
                        </div>
                        Not Included
                      </h3>
                      {trip.exclusions ? (
                        <ul className="space-y-3">
                          {trip.exclusions.map((item, index) => (
                            <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                              <X className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-sm">Contact us for exclusion details.</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="policy" className="space-y-6">
                  {trip.cancellationPolicy && (
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                      <h3 className="font-serif text-xl font-semibold text-card-foreground mb-5">
                        Cancellation Policy
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(trip.cancellationPolicy).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                            <span className="text-sm text-muted-foreground">
                              {key.replace(/_/g, ' ').replace('>=', '≥ ').replace('<=', '≤ ')}
                            </span>
                            <span className="text-sm font-medium text-card-foreground">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {trip.notes && (
                    <div className="bg-gradient-to-br from-accent/10 to-sunset/10 rounded-2xl p-6 border border-accent/20">
                      <h3 className="font-serif text-lg font-semibold text-foreground mb-3">Important Note</h3>
                      <p className="text-muted-foreground">{trip.notes}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                {/* Booking Card */}
                <div className={`bg-card rounded-2xl border-2 p-6 shadow-xl ${isBookable ? 'border-primary/50' : 'border-border'}`}>
                  {/* Status indicator for upcoming */}
                  {!isBookable && (
                    <div className="bg-sunset/10 border border-sunset/30 rounded-xl p-4 mb-6 text-center">
                      <p className="text-sunset font-bold text-lg">🚀 Coming Soon</p>
                      <p className="text-sm text-muted-foreground mt-1">This journey is launching soon!</p>
                    </div>
                  )}

                  <div className="mb-6">
                    {hasPunePrice && punePrice && (
                      <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
                        <span>From Pune</span>
                        <span className="font-medium">{formatPrice(punePrice)}</span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-bold ${isBookable ? 'text-primary' : 'text-muted-foreground'}`}>
                        {formatPrice(selectedBatch?.price_override ?? displayPrice)}
                      </span>
                      <span className="text-muted-foreground">per person</span>
                    </div>
                    {hasPunePrice && (
                      <p className="text-xs text-muted-foreground mt-1">From Mumbai</p>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="text-card-foreground font-medium">{trip.duration}</span>
                    </div>
                    {selectedBatch && (
                      <div className="flex items-center gap-3 text-sm">
                        <Users className="w-5 h-5 text-accent" />
                        <span className="text-card-foreground font-medium">
                          {selectedBatch.available_seats} seat{selectedBatch.available_seats !== 1 ? 's' : ''} remaining
                        </span>
                      </div>
                    )}
                    {!selectedBatch && trip.capacity && (
                      <div className="flex items-center gap-3 text-sm">
                        <Users className="w-5 h-5 text-accent" />
                        <span className="text-card-foreground font-medium">Max {trip.capacity} explorers</span>
                      </div>
                    )}
                  </div>

                  {/* Batch Selector */}
                  {isBookable && tripId && (
                    <div className="mb-6">
                      <BatchSelector
                        tripId={tripId}
                        basePrice={displayPrice}
                        selectedBatchId={selectedBatch?.id ?? null}
                        onSelectBatch={setSelectedBatch}
                      />
                    </div>
                  )}

                  {isBookable && (
                    <p className="text-xs text-accent mb-4 font-medium text-center">
                      Limited seats • Handpicked experiences
                    </p>
                  )}

                  {isBookable && (
                    <div className="bg-primary/10 rounded-xl p-4 mb-6 border border-primary/20">
                      <p className="text-sm text-primary font-semibold">
                        ✨ Reserve with just {formatPrice(advanceAmount)} advance
                      </p>
                    </div>
                  )}

                  {isBookable ? (
                    <Button 
                      className="w-full mb-3 h-12 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity" 
                      size="lg"
                      onClick={handleBookingClick}
                      disabled={!!selectedBatch && selectedBatch.available_seats === 0}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      {selectedBatch && selectedBatch.available_seats === 0 ? "Sold Out" : "Reserve Your Spot"}
                      {!(selectedBatch && selectedBatch.available_seats === 0) && <ChevronRight className="w-5 h-5 ml-1" />}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full mb-3 h-12 text-lg font-bold bg-sunset hover:bg-sunset/90" 
                      size="lg"
                      onClick={() => setIsInterestOpen(true)}
                    >
                      <Bell className="w-5 h-5 mr-2" />
                      Notify Me
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full mb-3"
                    onClick={handleWhatsAppClick}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat on WhatsApp
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Experience
                  </Button>
                </div>

                {/* Contact Card */}
                {trip.contact && (
                  <div className="bg-gradient-to-br from-secondary to-muted rounded-2xl p-6 border border-border">
                    <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
                      Need Help?
                    </h3>
                    <div className="space-y-3">
                      <a 
                        href={`tel:${trip.contact.phone}`}
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {trip.contact.phone}
                      </a>
                      <a 
                        href={`mailto:${trip.contact.email}`}
                        className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        {trip.contact.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Booking Modal - Only for active trips */}
      {isBookable && (
        <BookingModal 
          trip={trip}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      )}

      {/* Interest Popup - For upcoming trips */}
      <InterestPopup 
        isOpen={isInterestOpen}
        onClose={() => setIsInterestOpen(false)}
      />
    </div>
  );
};

export default TripDetail;
