import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, ArrowRight, Users, Quote, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoMeta from "@/components/SeoMeta";
import JsonLd from "@/components/JsonLd";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface ReviewWithTrip {
  id: string;
  rating: number;
  review_text: string | null;
  trip_id: string;
  created_at: string;
  reviewer_name: string;
}

const Stories = () => {
  const [reviews, setReviews] = useState<ReviewWithTrip[]>([]);
  const [topTrips, setTopTrips] = useState<{ trip_id: string; trip_name: string; avg: number; count: number }[]>([]);
  const [totalTravelers, setTotalTravelers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [reviewsRes, bookingsRes, tripsRes] = await Promise.all([
      supabase.from("reviews").select("id, rating, review_text, trip_id, created_at, user_id").eq("is_visible", true).order("rating", { ascending: false }).limit(50),
      supabase.from("bookings").select("num_travelers").eq("booking_status", "confirmed"),
      supabase.from("trips").select("trip_id, trip_name"),
    ]);

    const trips = tripsRes.data || [];
    const tripMap: Record<string, string> = {};
    trips.forEach(t => { tripMap[t.trip_id] = t.trip_name; });

    if (reviewsRes.data) {
      // Fetch profile names
      const userIds = [...new Set(reviewsRes.data.map(r => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name || "Traveler"]) ?? []);

      const enriched = reviewsRes.data.map(r => ({
        ...r,
        reviewer_name: profileMap.get(r.user_id) || "Anonymous Traveler",
      }));
      setReviews(enriched);

      // Calculate top-rated trips
      const tripStats: Record<string, { total: number; count: number }> = {};
      reviewsRes.data.forEach(r => {
        if (!tripStats[r.trip_id]) tripStats[r.trip_id] = { total: 0, count: 0 };
        tripStats[r.trip_id].total += r.rating;
        tripStats[r.trip_id].count++;
      });

      const ranked = Object.entries(tripStats)
        .map(([trip_id, s]) => ({ trip_id, trip_name: tripMap[trip_id] || trip_id, avg: s.total / s.count, count: s.count }))
        .filter(t => t.avg >= 4.5 && t.count >= 1)
        .sort((a, b) => b.avg - a.avg);
      setTopTrips(ranked);
    }

    if (bookingsRes.data) {
      setTotalTravelers(bookingsRes.data.reduce((s, b) => s + b.num_travelers, 0));
    }

    setLoading(false);
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GoBhraman",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: reviews.length,
      bestRating: 5,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoMeta
        title="Traveler Stories & Reviews | GoBhraman"
        description={`Read verified reviews from ${reviews.length}+ travelers. ${avgRating}/5 average rating. Discover why travelers love GoBhraman.`}
      />
      <JsonLd data={jsonLd} />
      <Navbar />

      <section className="relative py-32 md:py-40 gradient-ocean">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-4">Traveler Stories</h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">Real experiences from real explorers</p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="font-serif text-4xl font-bold text-primary">{avgRating}</p>
              <div className="flex justify-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Average Rating</p>
            </div>
            <div>
              <p className="font-serif text-4xl font-bold text-primary">{reviews.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Verified Reviews</p>
            </div>
            <div>
              <p className="font-serif text-4xl font-bold text-primary">{totalTravelers}+</p>
              <p className="text-sm text-muted-foreground mt-1">Happy Travelers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Rated Trips */}
      {topTrips.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-8">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-serif text-2xl font-bold text-foreground">Top Rated Trips</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topTrips.slice(0, 6).map(trip => (
                <Link
                  key={trip.trip_id}
                  to={`/trips/${trip.trip_id}`}
                  className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow group"
                >
                  <h3 className="font-serif font-bold text-foreground group-hover:text-primary transition-colors">{trip.trip_name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(trip.avg) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{trip.avg.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({trip.count} reviews)</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews Grid */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-8">What Travelers Say</h2>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading reviews...</div>
          ) : reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.filter(r => r.review_text).map(review => (
                <div key={review.id} className="bg-card border border-border rounded-xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                    <Badge variant="outline" className="text-xs">Verified</Badge>
                  </div>
                  <div className="relative">
                    <Quote className="w-6 h-6 text-primary/20 absolute -top-1 -left-1" />
                    <p className="text-sm text-muted-foreground pl-5 italic line-clamp-4">{review.review_text}</p>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{review.reviewer_name}</p>
                      <p className="text-xs text-muted-foreground">{review.trip_id}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <p className="text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 gradient-sunset">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl font-bold text-accent-foreground mb-4">Ready to Create Your Story?</h2>
          <p className="text-accent-foreground/90 mb-6">Join our community of happy travelers</p>
          <Link to="/trips" className="inline-flex items-center gap-2 bg-card text-foreground px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow">
            <Sparkles className="w-4 h-4" /> Explore Trips <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Stories;
