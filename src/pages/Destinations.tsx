import { Link } from "react-router-dom";
import { MapPin, ArrowRight, Mountain } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDestinations } from "@/hooks/useDestinations";

const Destinations = () => {
  const { destinations, loading, error, getDestinationsByState } = useDestinations();
  const byState = getDestinationsByState();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-16 bg-gradient-to-r from-primary via-ocean-dark to-accent">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">
            Explore Destinations
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            From Konkan shores to Himalayan peaks — discover India's most extraordinary places
          </p>
        </div>
      </section>

      {/* All Destinations Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-destructive mb-2">Failed to load destinations</p>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          ) : (
            <>
              {/* Grouped by State */}
              {Object.entries(byState)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([state, stateDestinations]) => (
                  <div key={state} className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Mountain className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-serif text-2xl font-bold text-foreground">{state}</h2>
                        <p className="text-sm text-muted-foreground">
                          {stateDestinations.length} destination{stateDestinations.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {stateDestinations.map((dest) => (
                        <Link
                          key={dest.id}
                          to={`/destinations/${dest.slug}`}
                          className="group block bg-card rounded-2xl overflow-hidden border border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                        >
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={dest.hero_image || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80"}
                              alt={dest.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                            {(dest.trip_count ?? 0) > 0 && (
                              <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground font-semibold">
                                {dest.trip_count} trip{dest.trip_count !== 1 ? "s" : ""}
                              </Badge>
                            )}
                            <div className="absolute bottom-3 left-3">
                              <Badge variant="secondary" className="bg-background/30 text-white border-0 backdrop-blur-sm text-xs">
                                <MapPin className="w-3 h-3 mr-1" />
                                {dest.state}
                              </Badge>
                            </div>
                          </div>

                          <div className="p-5">
                            <h3 className="font-serif text-xl font-bold text-card-foreground group-hover:text-primary transition-colors mb-2">
                              {dest.name}
                            </h3>
                            {dest.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {dest.description}
                              </p>
                            )}
                            <span className="text-sm font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                              Explore
                              <ArrowRight className="w-4 h-4" />
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

              <p className="text-sm text-muted-foreground text-center mt-8">
                Showing {destinations.length} destinations across India
              </p>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Destinations;
