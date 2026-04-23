import { memo } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Experience } from "@/hooks/useExperiences";

const categoryEmoji: Record<string, string> = {
  cycling: "🚴",
  trek: "🌄",
  walk: "🌌",
  camping: "🏕️",
  day_trip: "🏞️",
  activity: "🚀",
};

const ExperienceCard = ({ experience }: { experience: Experience }) => {
  const { experience_id, name, summary, location, duration, time_info, price, tags, images, category, booking_live } = experience;
  const emoji = categoryEmoji[category] || "🚀";

  return (
    <Link
      to={`/experiences/${experience_id}`}
      className="group block bg-card rounded-2xl overflow-hidden border-2 border-border shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
    >
      {/* Image */}
      <div className="relative overflow-hidden h-44 sm:h-52">
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent z-10" />
        <img
          src={images?.[0] || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />

        {/* Tags */}
        <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">
          {tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} className="bg-primary/90 text-primary-foreground text-xs font-bold px-2 py-0.5">
              {tag}
            </Badge>
          ))}
        </div>

        <Badge variant="secondary" className="absolute top-3 right-3 z-20 bg-background/90 text-foreground font-semibold text-xs">
          {duration}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        <h3 className="font-serif font-bold text-lg text-card-foreground group-hover:text-primary transition-colors mb-1">
          {emoji} {name}
        </h3>

        {summary && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{summary}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            {location}
          </span>
          {time_info && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {time_info}
            </span>
          )}
        </div>

        {/* Price & CTA */}
        <div className="flex items-end justify-between pt-3 border-t border-border gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-primary">₹{price.toLocaleString("en-IN")}</span>
              <span className="text-xs text-muted-foreground">per person</span>
            </div>
          </div>
          {booking_live ? (
            <Button size="sm" className="font-semibold">
              Book Now
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="font-semibold">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Coming Soon
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default memo(ExperienceCard);
