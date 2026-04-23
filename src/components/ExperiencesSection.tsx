import { Link } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ExperienceCard from "@/components/ExperienceCard";
import { useTrips } from "@/hooks/useTrips";

const ExperiencesSection = () => {
  const { loading, getExperiences } = useTrips();
  const experiences = getExperiences();

  if (!loading && experiences.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-secondary via-background to-muted">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-accent" />
              <span className="text-accent font-bold text-sm uppercase tracking-wider">Short & Sweet</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              🚀 Experiences Near You
            </h2>
            <p className="text-muted-foreground mt-2">
              Cycling, treks, stargazing & more — weekend adventures that don't need a leave!
            </p>
          </div>
          <Button asChild variant="outline" className="font-semibold">
            <Link to="/experiences">
              All Experiences
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.slice(0, 6).map((exp) => (
              <ExperienceCard key={exp.trip_id} experience={exp} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ExperiencesSection;
