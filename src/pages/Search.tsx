import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, MapPin, ArrowUpDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TripCard from "@/components/TripCard";
import SeoMeta from "@/components/SeoMeta";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useTrips, DatabaseTrip } from "@/hooks/useTrips";
import { useDestinations, Destination } from "@/hooks/useDestinations";
import { useReviews } from "@/hooks/useReviews";
import { useWishlist } from "@/hooks/useWishlist";
import { formatPrice } from "@/data/trips";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const DURATION_OPTIONS = [
  { value: "all", label: "Any Duration" },
  { value: "1-3", label: "1–3 Days" },
  { value: "4-6", label: "4–6 Days" },
  { value: "7+", label: "7+ Days" },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

const parseDurationDays = (duration: string): number => {
  // Parse patterns like "3N/2D", "2D/1N", "4D/3N", "5D/4N"
  const dayMatch = duration.match(/(\d+)\s*D/i);
  const nightMatch = duration.match(/(\d+)\s*N/i);
  if (dayMatch) return parseInt(dayMatch[1]);
  if (nightMatch) return parseInt(nightMatch[1]) + 1;
  return 0;
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { trips, loading: tripsLoading, isTripBookable } = useTrips();
  const { destinations, loading: destsLoading } = useDestinations();
  const { isInWishlist, isToggling, toggleWishlist } = useWishlist();

  // Filters from URL
  const query = searchParams.get("q") || "";
  const stateFilter = searchParams.get("state") || "all";
  const durationFilter = searchParams.get("duration") || "all";
  const sortBy = searchParams.get("sort") || "relevance";
  const minRating = parseInt(searchParams.get("rating") || "0");
  const priceMin = parseInt(searchParams.get("price_min") || "0");
  const priceMax = parseInt(searchParams.get("price_max") || "100000");

  const [localQuery, setLocalQuery] = useState(query);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [localPriceRange, setLocalPriceRange] = useState([priceMin, priceMax]);

  // Sync URL query to local state
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    setLocalPriceRange([priceMin, priceMax]);
  }, [priceMin, priceMax]);

  const updateFilter = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === "all" || value === "0" || value === "relevance" || value === "100000") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    });
  }, [setSearchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("q", localQuery.trim());
  };

  const clearAllFilters = () => {
    setSearchParams(query ? { q: query } : {});
    setLocalPriceRange([0, 100000]);
  };

  // Get unique states from destinations
  const states = useMemo(() => {
    const s = new Set<string>();
    destinations.forEach((d) => s.add(d.state));
    return Array.from(s).sort();
  }, [destinations]);

  // Price range
  const priceExtent = useMemo(() => {
    if (trips.length === 0) return [0, 100000];
    const prices = trips.map((t) => t.price_default);
    return [Math.min(...prices), Math.max(...prices)];
  }, [trips]);

  // Build destination→state lookup
  const destStateMap = useMemo(() => {
    const m: Record<string, string> = {};
    destinations.forEach((d) => { m[d.id] = d.state; });
    return m;
  }, [destinations]);

  // Filter trips
  const filteredTrips = useMemo(() => {
    let result = [...trips];

    // Text search
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (t) =>
          t.trip_name.toLowerCase().includes(q) ||
          (t.summary || "").toLowerCase().includes(q) ||
          t.locations.some((l) => l.toLowerCase().includes(q))
      );
    }

    // State filter
    if (stateFilter !== "all") {
      // Find destination IDs for this state
      const destIds = destinations
        .filter((d) => d.state === stateFilter)
        .map((d) => d.id);
      // We need to check trip's destination_id - but DatabaseTrip doesn't have it
      // Filter by locations or trip names matching destinations in that state
      const destNames = destinations
        .filter((d) => d.state === stateFilter)
        .map((d) => d.name.toLowerCase());
      result = result.filter((t) =>
        t.locations.some((l) => destNames.some((dn) => l.toLowerCase().includes(dn)))
      );
    }

    // Duration filter
    if (durationFilter !== "all") {
      result = result.filter((t) => {
        const days = parseDurationDays(t.duration);
        if (durationFilter === "1-3") return days >= 1 && days <= 3;
        if (durationFilter === "4-6") return days >= 4 && days <= 6;
        if (durationFilter === "7+") return days >= 7;
        return true;
      });
    }

    // Price filter
    if (priceMin > 0 || priceMax < 100000) {
      result = result.filter((t) => t.price_default >= priceMin && t.price_default <= priceMax);
    }

    // Sorting
    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => a.price_default - b.price_default);
        break;
      case "price_desc":
        result.sort((a, b) => b.price_default - a.price_default);
        break;
      case "rating":
        // Sort bookable first, then by price desc as proxy
        result.sort((a, b) => {
          const aBook = isTripBookable(a.trip_id) ? 1 : 0;
          const bBook = isTripBookable(b.trip_id) ? 1 : 0;
          return bBook - aBook || b.price_default - a.price_default;
        });
        break;
    }

    return result;
  }, [trips, query, stateFilter, durationFilter, sortBy, priceMin, priceMax, destinations, isTripBookable]);

  // Matching destinations
  const matchingDestinations = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return destinations.filter(
      (d) => d.name.toLowerCase().includes(q) || d.state.toLowerCase().includes(q)
    );
  }, [destinations, query]);

  const loading = tripsLoading || destsLoading;
  const hasActiveFilters = stateFilter !== "all" || durationFilter !== "all" || sortBy !== "relevance" || priceMin > 0 || priceMax < 100000;

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
        </h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs text-muted-foreground">
            Clear All
          </Button>
        )}
      </div>

      <Separator />

      {/* State */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">State</label>
        <Select value={stateFilter} onValueChange={(v) => updateFilter("state", v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {states.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duration */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Duration</label>
        <Select value={durationFilter} onValueChange={(v) => updateFilter("duration", v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any Duration" />
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((d) => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Price Range
        </label>
        <div className="px-1">
          <Slider
            min={priceExtent[0]}
            max={priceExtent[1]}
            step={500}
            value={localPriceRange}
            onValueChange={setLocalPriceRange}
            onValueCommit={(v) => {
              updateFilter("price_min", String(v[0]));
              updateFilter("price_max", String(v[1]));
            }}
            className="my-4"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatPrice(localPriceRange[0])}</span>
          <span>{formatPrice(localPriceRange[1])}</span>
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Sort By</label>
        <Select value={sortBy} onValueChange={(v) => updateFilter("sort", v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SeoMeta
        title={query ? `Search: ${query} | GoBhraman` : "Search Trips & Destinations | GoBhraman"}
        description="Search and filter trips across India. Find your perfect adventure by destination, duration, price, and more."
      />
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Search Header */}
          <div className="mb-8">
            <form onSubmit={handleSearch} className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Search destinations, trips, states..."
                className="pl-12 pr-24 h-14 text-base rounded-2xl border-2 border-border focus:border-primary"
              />
              <Button type="submit" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl">
                Search
              </Button>
            </form>

            {/* Active filter badges */}
            {(query || hasActiveFilters) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {query && (
                  <Badge variant="secondary" className="gap-1">
                    "{query}"
                    <button onClick={() => { setLocalQuery(""); updateFilter("q", ""); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {stateFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {stateFilter}
                    <button onClick={() => updateFilter("state", "all")}><X className="w-3 h-3" /></button>
                  </Badge>
                )}
                {durationFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {DURATION_OPTIONS.find((d) => d.value === durationFilter)?.label}
                    <button onClick={() => updateFilter("duration", "all")}><X className="w-3 h-3" /></button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-8">
            {/* Desktop Filters */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-28 bg-card border border-border rounded-2xl p-6">
                <FilterSidebar />
              </div>
            </aside>

            {/* Mobile filter toggle */}
            <div className="lg:hidden fixed bottom-20 right-4 z-40">
              <Button
                onClick={() => setShowMobileFilters(true)}
                size="lg"
                className="rounded-full shadow-xl gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Mobile filter drawer */}
            {showMobileFilters && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-foreground/50" onClick={() => setShowMobileFilters(false)} />
                <div className="absolute right-0 top-0 bottom-0 w-80 bg-card p-6 overflow-y-auto shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Filters</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowMobileFilters(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <FilterSidebar />
                  <Button className="w-full mt-6" onClick={() => setShowMobileFilters(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            )}

            {/* Results */}
            <div className="flex-1 min-w-0">
              {/* Matching Destinations */}
              {matchingDestinations.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Destinations
                  </h2>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {matchingDestinations.map((d) => (
                      <Link
                        key={d.id}
                        to={`/destinations/${d.slug}`}
                        className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:border-primary/40 transition-colors"
                      >
                        {d.hero_image && (
                          <img src={d.hero_image} alt={d.name} className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="font-medium text-sm text-foreground">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.state}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Trip Results */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {loading ? "Searching..." : `${filteredTrips.length} Trip${filteredTrips.length !== 1 ? "s" : ""} Found`}
                </h2>
                <div className="hidden lg:flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  <Select value={sortBy} onValueChange={(v) => updateFilter("sort", v)}>
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border border-border">
                      <Skeleton className="h-56 w-full" />
                      <div className="p-6 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredTrips.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredTrips.map((trip) => (
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
              ) : (
                <div className="text-center py-16">
                  <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No trips found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search with different keywords.
                  </p>
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
