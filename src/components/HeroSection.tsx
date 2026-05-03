import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Compass, Mountain, Utensils, X, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import GlobalSearchBar from "@/components/GlobalSearchBar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const WELCOME_SHOWN_KEY = "gb_welcome_shown";

const HeroSection = () => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);
  const [checkingTrip, setCheckingTrip] = useState(false);
  const prevUserRef = useRef<string | null>(null);

  const handleTripUpdates = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setCheckingTrip(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("trip_id, booking_status, created_at")
      .eq("user_id", user.id)
      .in("booking_status", ["confirmed", "pending_verification", "advance_paid", "fully_paid"])
      .order("created_at", { ascending: false })
      .limit(1);
    setCheckingTrip(false);

    if (error || !data || data.length === 0 || !data[0].trip_id) {
      toast({ title: "No trips booked yet", description: "Browse our trips and book your first adventure!" });
      navigate("/trips");
      return;
    }
    navigate(`/trips/${data[0].trip_id}`);
  };

  useEffect(() => {
    // Show popup only when user transitions from logged-out to logged-in
    if (user && prevUserRef.current === null) {
      const lastShown = sessionStorage.getItem(WELCOME_SHOWN_KEY);
      if (!lastShown) {
        setShowWelcome(true);
        sessionStorage.setItem(WELCOME_SHOWN_KEY, "1");
        const timer = setTimeout(() => setShowWelcome(false), 5000);
        return () => clearTimeout(timer);
      }
    }
    prevUserRef.current = user?.id ?? null;
  }, [user]);

  const renderWelcomeWidget = () => {
    if (user && roles?.includes("super_admin")) {
      return (
        <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white p-4 md:p-6 rounded-2xl shadow-xl backdrop-blur-md max-w-sm">
          <h3 className="text-lg md:text-xl font-semibold">Command Center Activated ⚡</h3>
          <p className="text-sm opacity-90 mt-1">You don't just manage trips — you command growth, revenue, and movement.</p>
        </div>
      );
    }
    if (user && roles?.some(r => ["admin", "operations_manager", "finance_manager"].includes(r)) && !roles?.includes("super_admin")) {
      return (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 md:p-6 rounded-2xl shadow-xl max-w-sm">
          <h3 className="text-lg md:text-xl font-semibold">Welcome back, Admin 🚀</h3>
          <p className="text-sm opacity-90 mt-1">Control the experience. Manage the movement. Scale the adventure.</p>
        </div>
      );
    }
    return (
      <div className="bg-background/80 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-md max-w-sm">
        <h3 className="text-lg font-semibold text-foreground">Welcome back, explorer!</h3>
        <p className="text-sm text-muted-foreground">Ready for your next journey.</p>
      </div>
    );
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"
          alt="Explore India with GoBhraman"
          className="w-full h-full object-cover"
          fetchPriority="high"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/50 to-foreground/80" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 rounded-full bg-primary/20 blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-10 w-32 h-32 rounded-full bg-accent/20 blur-3xl animate-float" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-32 text-center">
        <div className="animate-slide-up">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium mb-6 backdrop-blur-sm border border-primary/30">
            🌍 Travel Differently. Travel Deeper.
          </span>
        </div>

        <h1 className="h1 !text-background mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Curated Trips Across India
          <span className="block text-primary mt-2">Verified Stays. No Hidden Costs.</span>
        </h1>

        <p className="body !text-background/90 max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Curated trips across India with verified stays, no hidden costs, and seamless booking.
        </p>

        {/* Search Bar */}
        <div className="relative z-50 max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <GlobalSearchBar variant="hero" />
        </div>

        {/* Already booked? — moved above CTAs for visibility */}
        <div className="mb-5 animate-slide-up" style={{ animationDelay: '0.28s' }}>
          <button
            onClick={handleTripUpdates}
            disabled={checkingTrip}
            className="text-sm text-background/90 underline-offset-4 hover:underline inline-flex items-center gap-2 disabled:opacity-60"
          >
            {checkingTrip ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking your trips…
              </>
            ) : (
              "Already booked? Get trip updates →"
            )}
          </button>
        </div>

        <div className="relative z-0 flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Button asChild size="lg" className="text-lg px-8 shadow-lg hover:shadow-xl transition-shadow">
            <Link to="/trips">
              Explore Trips
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-lg px-8 bg-[#25D366]/15 border-[#25D366]/40 text-background hover:bg-[#25D366]/25 hover:text-background backdrop-blur-sm min-w-[200px]"
          >
            <a
              href={`https://wa.me/919415026522?text=${encodeURIComponent("Hi GoBhraman! I'd like to know more about your trips.")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat on WhatsApp
            </a>
          </Button>
        </div>

        {/* Skeleton state while checking bookings */}
        {checkingTrip && (
          <div className="max-w-md mx-auto mb-12 animate-fade-in">
            <div className="bg-background/10 backdrop-blur-md border border-background/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full bg-background/20" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4 bg-background/20" />
                  <Skeleton className="h-3 w-1/2 bg-background/20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full bg-background/20" />
              <Skeleton className="h-3 w-5/6 bg-background/20" />
            </div>
          </div>
        )}

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 backdrop-blur-sm border border-background/20">
            <Compass className="w-5 h-5 text-primary" />
            <span className="text-sm text-background font-medium">Real Adventures</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 backdrop-blur-sm border border-background/20">
            <Mountain className="w-5 h-5 text-primary" />
            <span className="text-sm text-background font-medium">Hidden Gems</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 backdrop-blur-sm border border-background/20">
            <Utensils className="w-5 h-5 text-primary" />
            <span className="text-sm text-background font-medium">Local Experiences</span>
          </div>
        </div>
      </div>

      {/* Welcome Popup - shows temporarily after login */}
      {showWelcome && user && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="relative">
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-muted hover:bg-muted/80 transition-colors z-10"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
            {renderWelcomeWidget()}
          </div>
        </div>
      )}

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-background/50 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-background/70 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
