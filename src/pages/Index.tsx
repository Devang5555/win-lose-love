import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Shield, Users, Headphones, Sparkles, Compass, Calendar, MapPin, Mountain } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import TripCard from "@/components/TripCard";
import InterestPopup from "@/components/InterestPopup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTrips } from "@/hooks/useTrips";
import { useDestinations } from "@/hooks/useDestinations";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { loading, getBookableTrips, getUpcomingTrips } = useTrips();
  const { destinations, loading: destLoading, getDestinationsByState, getFeaturedDestinations } = useDestinations();
  const [showInterestPopup, setShowInterestPopup] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const bookableTrips = getBookableTrips();
  const upcomingTrips = getUpcomingTrips();
  const featuredDestinations = getFeaturedDestinations(8);
  const byState = getDestinationsByState();

  const handleRegisterInterest = (tripId: string) => {
    setSelectedTripId(tripId);
    setShowInterestPopup(true);
  };

  const features = [
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "All journeys include safety support and verified local stays"
    },
    {
      icon: Users,
      title: "Small Groups",
      description: "Intimate groups for authentic connections and experiences"
    },
    {
      icon: Compass,
      title: "Local Experts",
      description: "Guides who know the hidden stories and secret spots"
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Round-the-clock assistance throughout your journey"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <HeroSection />

      {/* Featured Trip - Bookable Trips */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-primary font-bold text-sm uppercase tracking-wider">Live & Bookable</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                Start Your Journey Now
              </h2>
              <p className="text-muted-foreground mt-2">Limited seats • Handpicked experiences — reserve your spot today!</p>
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 gap-6">
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          ) : bookableTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bookableTrips.map((trip) => (
                <TripCard 
                  key={trip.trip_id} 
                  trip={trip} 
                  featured={false} 
                  isBookable={true} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted rounded-2xl">
              <p className="text-muted-foreground">No journeys available for booking at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-secondary via-muted to-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary font-bold text-sm uppercase tracking-wider">Why GoBhraman</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2">
              Travel with Purpose
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-6 text-center shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-border"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-card-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-sunset font-bold text-sm uppercase tracking-wider">Explore India</span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2">
                Popular Destinations
              </h2>
              <p className="text-muted-foreground mt-2">Discover trips across India's most extraordinary places</p>
            </div>
            <Button asChild variant="outline" className="font-semibold">
              <Link to="/destinations">
                All Destinations
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>

          {destLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
              ))}
            </div>
          ) : featuredDestinations.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredDestinations.map((dest) => (
                <Link
                  key={dest.id}
                  to={`/destinations/${dest.slug}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                >
                  <img
                    src={dest.hero_image || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {(dest.trip_count ?? 0) > 0 && (
                    <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground text-xs font-semibold">
                      {dest.trip_count} trip{dest.trip_count !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-serif text-lg font-bold text-white">{dest.name}</h3>
                    <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {dest.state}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted rounded-2xl">
              <p className="text-muted-foreground">Destinations coming soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Explore by State */}
      {Object.keys(byState).length > 0 && (
        <section className="py-16 md:py-24 bg-gradient-to-br from-secondary via-background to-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-primary font-bold text-sm uppercase tracking-wider">PAN India</span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2">
                Explore by State
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(byState).sort(([a], [b]) => a.localeCompare(b)).map(([state, dests]) => (
                <Link
                  key={state}
                  to={`/destinations?state=${encodeURIComponent(state)}`}
                  className="group bg-card rounded-2xl p-6 text-center border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 hover:border-primary/30"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-3">
                    <Mountain className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-card-foreground group-hover:text-primary transition-colors">
                    {state}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {dests.length} destination{dests.length !== 1 ? "s" : ""}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Trips Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-secondary via-background to-muted">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-sunset" />
                <span className="text-sunset font-bold text-sm uppercase tracking-wider">Coming Soon</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                Upcoming Trips
              </h2>
              <p className="text-muted-foreground mt-2">Register your interest — be the first to know when bookings open!</p>
            </div>
            <Button asChild variant="outline" className="font-semibold">
              <Link to="/trips">
                View All Trips
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-2xl" />
              ))}
            </div>
          ) : upcomingTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTrips.slice(0, 6).map((trip) => (
                <TripCard 
                  key={trip.trip_id} 
                  trip={trip} 
                  featured={false} 
                  isBookable={false}
                  onRegisterInterest={handleRegisterInterest}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted rounded-2xl">
              <p className="text-muted-foreground">More exciting trips coming soon! Stay tuned.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary via-ocean-dark to-accent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
            Ready to Discover India?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-xl mx-auto mb-8">
            Join our community of explorers and experience India beyond the map — with meaning, clarity, and connection.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8 font-bold shadow-lg">
              <Link to="/trips">
                <Sparkles className="w-5 h-5 mr-2" />
                Explore Journeys
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 bg-transparent border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground font-semibold">
              <Link to="/contact">
                Chat on WhatsApp
              </Link>
            </Button>
          </div>
        </div>
      </section>


      <Footer />

      {/* Interest Popup */}
      <InterestPopup 
        isOpen={showInterestPopup} 
        onClose={() => {
          setShowInterestPopup(false);
          setSelectedTripId(null);
        }}
        preselectedTripId={selectedTripId}
      />
    </div>
  );
};

export default Index;
