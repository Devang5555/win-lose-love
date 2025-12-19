import { Link } from "react-router-dom";
import { ArrowRight, Compass, Mountain, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"
          alt="Explore India with GoBhraman"
          className="w-full h-full object-cover"
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

        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-background mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Discover India
          <span className="block text-primary mt-2">Beyond the Map</span>
        </h1>

        <p className="text-lg md:text-xl text-background/90 max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Curated journeys across India for explorers who seek culture, adventure, and real connections — not tourist checklists.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Button asChild size="lg" className="text-lg px-8 shadow-lg hover:shadow-xl transition-shadow">
            <Link to="/trips">
              Start Your Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-background/10 border-background/30 text-background hover:bg-background/20 hover:text-background backdrop-blur-sm">
            <Link to="/about">
              Get Trip Updates
            </Link>
          </Button>
        </div>

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
