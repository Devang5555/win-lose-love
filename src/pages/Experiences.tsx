import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExperienceCard from "@/components/ExperienceCard";
import { useTrips } from "@/hooks/useTrips";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const categories = [
  { value: "all", label: "All" },
  { value: "cycling", label: "🚴 Cycling" },
  { value: "trek", label: "🌄 Treks" },
  { value: "walk", label: "🌌 Walks" },
  { value: "camping", label: "🏕️ Camping" },
  { value: "day_trip", label: "🏞️ Day Trips" },
];

const Experiences = () => {
  const { loading, getExperiences } = useTrips();
  const [filter, setFilter] = useState("all");
  const experiences = getExperiences();
  const filtered = filter === "all" ? experiences : experiences.filter((e) => e.experience_category === filter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-accent" />
              <span className="text-accent font-bold text-sm uppercase tracking-wider">Weekend Adventures</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground">
              🚀 Experiences
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Short-duration events — cycling, treks, stargazing, camping and more. No long leaves needed!
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilter(cat.value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                  filter === cat.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-72 w-full rounded-2xl" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((exp) => (
                <ExperienceCard key={exp.trip_id} experience={exp} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted rounded-2xl">
              <p className="text-muted-foreground text-lg">No experiences found in this category yet.</p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Experiences;
