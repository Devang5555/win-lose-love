import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoMeta from "@/components/SeoMeta";
import TripCard from "@/components/TripCard";
import { useTrips } from "@/hooks/useTrips";
import { useWishlist } from "@/hooks/useWishlist";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { COLLECTIONS, getCollection } from "@/lib/collections";

const Collection = () => {
  const { slug } = useParams<{ slug: string }>();
  const collection = slug ? getCollection(slug) : undefined;
  const { trips, loading, isTripBookable, batches } = useTrips();
  const { isInWishlist, isToggling, toggleWishlist } = useWishlist();

  const matched = useMemo(() => {
    if (!collection) return [];
    return trips.filter(collection.match);
  }, [trips, collection]);

  if (!collection) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-28 pb-16">
          <h1 className="font-serif text-3xl font-bold mb-6">Collections</h1>
          <p className="text-muted-foreground mb-8">Discover curated journeys by mood and vibe.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COLLECTIONS.map((c) => (
              <Link
                key={c.slug}
                to={`/collections/${c.slug}`}
                className="group rounded-2xl border border-border bg-card p-6 hover:border-primary transition-all hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div className="text-4xl mb-3">{c.heroEmoji}</div>
                <h3 className="font-serif text-xl font-semibold text-foreground group-hover:text-primary transition">{c.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{c.subtitle}</p>
              </Link>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SeoMeta
        title={`${collection.title} | GoBhraman Collections`}
        description={`${collection.subtitle}. Browse handpicked ${collection.title.toLowerCase()} on GoBhraman.`}
      />
      <Navbar />
      <section className="pt-28 pb-10 bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <Link to="/collections" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> All collections
          </Link>
          <div className="text-5xl mb-3">{collection.heroEmoji}</div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground">{collection.title}</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">{collection.subtitle}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : matched.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No trips in this collection yet. New journeys drop soon.</p>
            <Button asChild variant="outline"><Link to="/trips">Explore all trips</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matched.map((trip) => {
              const tripBatches = batches.filter((b) => b.trip_id === trip.trip_id);
              return (
                <TripCard
                  key={trip.trip_id}
                  trip={trip}
                  isBookable={isTripBookable(trip.trip_id)}
                  batches={tripBatches}
                  wishlistProps={{
                    isSaved: isInWishlist(trip.trip_id),
                    isToggling,
                    onToggle: toggleWishlist,
                  }}
                />
              );
            })}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default Collection;
