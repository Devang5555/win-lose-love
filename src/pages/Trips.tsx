import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, Sparkles, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TripCard from "@/components/TripCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrips } from "@/hooks/useTrips";
import { useWishlist } from "@/hooks/useWishlist";

const Trips = () => {
  const { trips, loading, isTripBookable } = useTrips();
  const { isInWishlist, isToggling, toggleWishlist } = useWishlist();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [showBookableOnly, setShowBookableOnly] = useState(false);

  // Sync URL search param with state
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  const durations = ["2D/1N", "3D/2N", "3N/2D", "4D/3N", "5D/4N"];

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch = trip.trip_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trip.summary?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      trip.locations?.some(loc => loc.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDuration = !selectedDuration || trip.duration === selectedDuration;
    const tripIsBookable = isTripBookable(trip.trip_id);
    const matchesBookable = !showBookableOnly || tripIsBookable;
    
    return matchesSearch && matchesDuration && matchesBookable;
  });

  // Separate bookable and upcoming from filtered results
  const filteredBookable = filteredTrips.filter(t => isTripBookable(t.trip_id));
  const filteredUpcoming = filteredTrips.filter(t => !isTripBookable(t.trip_id));

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDuration(null);
    setShowBookableOnly(false);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-16 bg-gradient-to-r from-primary via-ocean-dark to-accent">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">
            Explore Our Journeys
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Curated experiences across India for explorers who seek culture, adventure, and real connections
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 bg-card border-b border-border sticky top-16 md:top-20 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search destinations, experiences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Duration Filter */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground hidden md:block" />
              
              {/* Bookable Only Toggle */}
              <Badge
                variant={showBookableOnly ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors font-semibold"
                onClick={() => setShowBookableOnly(!showBookableOnly)}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Ready to Join
              </Badge>
              
              {durations.map((duration) => (
                <Badge
                  key={duration}
                  variant={selectedDuration === duration ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setSelectedDuration(selectedDuration === duration ? null : duration)}
                >
                  {duration}
                </Badge>
              ))}
              {(searchQuery || selectedDuration || showBookableOnly) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="font-semibold">
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trips Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
              </div>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">No journeys found matching your criteria</p>
              <Button onClick={clearFilters} className="font-semibold">Clear Filters</Button>
            </div>
          ) : (
            <>
              {/* Bookable Trips Section */}
              {filteredBookable.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                        Join Now
                      </h2>
                      <p className="text-sm text-muted-foreground">Limited seats • Reserve your spot today</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                    {filteredBookable.map((trip) => (
                      <TripCard
                        key={trip.trip_id}
                        trip={trip}
                        featured
                        isBookable={isTripBookable(trip.trip_id)}
                        wishlistProps={{
                          isSaved: isInWishlist(trip.trip_id),
                          isToggling: isToggling(trip.trip_id),
                          onToggle: toggleWishlist,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Trips Section */}
              {filteredUpcoming.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-sunset/20 flex items-center justify-center">
                      <span className="text-xl">🚀</span>
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                        Coming Soon
                      </h2>
                      <p className="text-sm text-muted-foreground">Get notified when these experiences launch!</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUpcoming.map((trip) => (
                      <TripCard
                        key={trip.trip_id}
                        trip={trip}
                        isBookable={isTripBookable(trip.trip_id)}
                        wishlistProps={{
                          isSaved: isInWishlist(trip.trip_id),
                          isToggling: isToggling(trip.trip_id),
                          onToggle: toggleWishlist,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground mt-8 text-center">
                Showing {filteredTrips.length} {filteredTrips.length === 1 ? 'journey' : 'journeys'} 
                {filteredBookable.length > 0 && ` (${filteredBookable.length} ready to join)`}
              </p>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Trips;
