import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TripCard from "@/components/TripCard";
import InterestPopup from "@/components/InterestPopup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useTrips, DatabaseTrip } from "@/hooks/useTrips";
import JsonLd from "@/components/JsonLd";

interface DestinationData {
  id: string;
  name: string;
  slug: string;
  state: string;
  description: string | null;
  hero_image: string | null;
}

const DestinationDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { trips, loading: tripsLoading, isTripBookable } = useTrips();
  const [destination, setDestination] = useState<DestinationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [showInterestPopup, setShowInterestPopup] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDestination = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const { data, error: fetchErr } = await supabase
          .from("destinations")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (fetchErr) throw fetchErr;
        setDestination(data);
      } catch (err: any) {
        setError(err?.message || "Failed to load destination");
      } finally {
        setLoading(false);
      }
    };
    fetchDestination();
  }, [slug]);

  // Get trips for this destination
  const destinationTrips = destination
    ? trips.filter((t) => {
        // Match by destination_id from the raw fetch — we need to re-check
        // Since useTrips doesn't expose destination_id, we fetch separately
        return true; // will be filtered below
      })
    : [];

  // We need destination trips from DB
  const [destTrips, setDestTrips] = useState<DatabaseTrip[]>([]);
  const [destTripsLoading, setDestTripsLoading] = useState(true);

  useEffect(() => {
    const fetchDestTrips = async () => {
      if (!destination?.id) return;
      try {
        setDestTripsLoading(true);
        const { data, error: err } = await supabase
          .from("trips")
          .select("*")
          .eq("destination_id", destination.id)
          .eq("is_active", true);

        if (err) throw err;

        const mapped: DatabaseTrip[] = (data || []).map((t) => ({
          id: t.id,
          trip_id: t.trip_id,
          trip_name: t.trip_name,
          price_default: t.price_default,
          price_from_pune: t.price_from_pune,
          price_from_mumbai: t.price_from_mumbai,
          duration: t.duration,
          summary: t.summary,
          highlights: t.highlights || [],
          locations: t.locations || [],
          images: t.images || [],
          is_active: t.is_active ?? true,
          booking_live: t.booking_live ?? false,
          capacity: t.capacity || 30,
          advance_amount: t.advance_amount || 2000,
          inclusions: t.inclusions || [],
          exclusions: t.exclusions || [],
          contact_phone: t.contact_phone,
          contact_email: t.contact_email,
          notes: t.notes,
        }));
        setDestTrips(mapped);
      } catch (err) {
        console.error("Error fetching destination trips:", err);
      } finally {
        setDestTripsLoading(false);
      }
    };
    fetchDestTrips();
  }, [destination?.id]);

  // Filters
  const durations = [...new Set(destTrips.map((t) => t.duration))].sort();

  const filteredTrips = destTrips.filter((trip) => {
    const matchesDuration = !selectedDuration || trip.duration === selectedDuration;
    const matchesPrice =
      !priceRange ||
      (priceRange === "under-5000" && trip.price_default < 5000) ||
      (priceRange === "5000-10000" && trip.price_default >= 5000 && trip.price_default <= 10000) ||
      (priceRange === "10000-20000" && trip.price_default >= 10000 && trip.price_default <= 20000) ||
      (priceRange === "above-20000" && trip.price_default > 20000);
    return matchesDuration && matchesPrice;
  });

  const clearFilters = () => {
    setSelectedDuration(null);
    setPriceRange(null);
  };

  const handleRegisterInterest = (tripId: string) => {
    setSelectedTripId(tripId);
    setShowInterestPopup(true);
  };

  // JSON-LD structured data
  const destinationJsonLd = useMemo(() => {
    if (!destination) return null;
    return {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: destination.name,
      description: destination.description || "",
      image: destination.hero_image || "",
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: destination.state,
      },
      touristType: "Adventure Travel",
      includesAttraction: destTrips.map((t) => ({
        "@type": "TouristTrip",
        name: t.trip_name,
        description: t.summary || "",
        offers: {
          "@type": "Offer",
          price: t.price_default,
          priceCurrency: "INR",
        },
      })),
    };
  }, [destination, destTrips]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <Skeleton className="h-[50vh] w-full" />
        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!destination || error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Destination Not Found</h1>
          <p className="text-muted-foreground mb-8">The destination you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/destinations">Browse Destinations</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {destinationJsonLd && <JsonLd data={destinationJsonLd} />}
      <Navbar />

      {/* Hero */}
      <section className="relative h-[45vh] md:h-[55vh]">
        <img
          src={destination.hero_image || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />

        <Link
          to="/destinations"
          className="absolute top-24 md:top-28 left-4 md:left-8 flex items-center gap-2 text-primary-foreground/90 hover:text-primary-foreground transition-colors bg-background/20 backdrop-blur-sm px-3 py-2 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden md:inline">All Destinations</span>
        </Link>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-12">
          <div className="container mx-auto">
            <Badge variant="secondary" className="bg-background/30 text-white border-0 backdrop-blur-sm mb-3">
              <MapPin className="w-3 h-3 mr-1" />
              {destination.state}
            </Badge>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-3">
              {destination.name}
            </h1>
            {destination.description && (
              <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl">
                {destination.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 bg-card border-b border-border sticky top-16 md:top-20 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground mr-2">Filter:</span>

            {/* Duration */}
            {durations.map((d) => (
              <Badge
                key={d}
                variant={selectedDuration === d ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedDuration(selectedDuration === d ? null : d)}
              >
                {d}
              </Badge>
            ))}

            <span className="text-border">|</span>

            {/* Price Range */}
            {[
              { key: "under-5000", label: "Under ₹5K" },
              { key: "5000-10000", label: "₹5K–10K" },
              { key: "10000-20000", label: "₹10K–20K" },
              { key: "above-20000", label: "₹20K+" },
            ].map((p) => (
              <Badge
                key={p.key}
                variant={priceRange === p.key ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setPriceRange(priceRange === p.key ? null : p.key)}
              >
                {p.label}
              </Badge>
            ))}

            {(selectedDuration || priceRange) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="font-semibold">
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Trips */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
              Trips in {destination.name}
            </h2>
            <p className="text-muted-foreground mt-1">
              {filteredTrips.length} trip{filteredTrips.length !== 1 ? "s" : ""} available
            </p>
          </div>

          {destTripsLoading || tripsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : filteredTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map((trip) => (
                <TripCard
                  key={trip.trip_id}
                  trip={trip}
                  isBookable={isTripBookable(trip.trip_id)}
                  onRegisterInterest={handleRegisterInterest}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted rounded-2xl">
              <p className="text-muted-foreground">No trips found matching your filters.</p>
              {(selectedDuration || priceRange) && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />

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

export default DestinationDetail;
