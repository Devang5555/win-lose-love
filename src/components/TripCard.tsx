import { Link } from "react-router-dom";
import { MapPin, Clock, Users, ChevronRight, Bell, Sparkles } from "lucide-react";
import { Trip, getTripPrice, formatPrice } from "@/data/trips";
import { DatabaseTrip } from "@/hooks/useTrips";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TripCardProps {
  trip: Trip | DatabaseTrip;
  featured?: boolean;
  isBookable?: boolean;
  onRegisterInterest?: (tripId: string) => void;
}

// Type guard to check if trip is DatabaseTrip
const isDatabaseTrip = (trip: Trip | DatabaseTrip): trip is DatabaseTrip => {
  return 'trip_id' in trip;
};

const TripCard = ({ trip, featured = false, isBookable: isBookableProp, onRegisterInterest }: TripCardProps) => {
  // Handle both Trip and DatabaseTrip types
  const tripId = isDatabaseTrip(trip) ? trip.trip_id : trip.tripId;
  const tripName = isDatabaseTrip(trip) ? trip.trip_name : trip.tripName;
  const summary = isDatabaseTrip(trip) ? (trip.summary || '') : trip.summary;
  const locations = isDatabaseTrip(trip) ? trip.locations : trip.locations;
  const duration = trip.duration;
  const capacity = isDatabaseTrip(trip) ? trip.capacity : trip.capacity;
  const images = trip.images;
  const highlights = isDatabaseTrip(trip) ? trip.highlights : trip.highlights;
  
  // Price handling
  const price = isDatabaseTrip(trip) ? trip.price_default : getTripPrice(trip);
  const hasMultiplePrices = isDatabaseTrip(trip) 
    ? !!trip.price_from_pune 
    : (typeof trip.price === 'object' && !!trip.price.fromPune);
  const punePrice = isDatabaseTrip(trip) 
    ? trip.price_from_pune 
    : (typeof trip.price === 'object' ? trip.price.fromPune : null);
  
  // Use prop if provided, otherwise fallback to static check
  const isBookable = isBookableProp !== undefined 
    ? isBookableProp 
    : (!isDatabaseTrip(trip) && trip.tripStatus === 'active');

  return (
    <Link
      to={`/trips/${tripId}`}
      className={cn(
        "group block bg-card rounded-2xl overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1",
        featured && "lg:flex",
        isBookable 
          ? "border-primary/30 shadow-lg hover:shadow-2xl hover:border-primary" 
          : "border-border shadow-card hover:shadow-card-hover"
      )}
    >
      {/* Image */}
      <div className={cn(
        "relative overflow-hidden",
        featured ? "lg:w-1/2 h-64 lg:h-auto" : "h-56"
      )}>
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent z-10" />
        <img
          src={images[0] || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"}
          alt={tripName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Status Badge */}
        {isBookable ? (
          <Badge className="absolute top-4 left-4 z-20 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold px-3 py-1 animate-pulse">
            <Sparkles className="w-3 h-3 mr-1" />
            JOIN NOW
          </Badge>
        ) : (
          <Badge className="absolute top-4 left-4 z-20 bg-sunset/90 text-primary-foreground font-bold px-3 py-1">
            🚀 Coming Soon
          </Badge>
        )}
        
        <Badge variant="secondary" className="absolute top-4 right-4 z-20 bg-background/90 text-foreground font-semibold">
          {duration}
        </Badge>
      </div>

      {/* Content */}
      <div className={cn(
        "p-6",
        featured && "lg:w-1/2 lg:p-8 lg:flex lg:flex-col lg:justify-center"
      )}>
        <h3 className={cn(
          "font-serif font-bold text-card-foreground group-hover:text-primary transition-colors",
          featured ? "text-2xl lg:text-3xl mb-3" : "text-xl mb-2"
        )}>
          {tripName}
        </h3>
        
        <p className={cn(
          "text-muted-foreground line-clamp-2 mb-4",
          featured ? "text-base lg:text-lg" : "text-sm"
        )}>
          {summary}
        </p>

        {/* Highlights for featured */}
        {featured && highlights && (
          <ul className="hidden lg:block space-y-2 mb-6">
            {highlights.slice(0, 4).map((highlight, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent" />
                {highlight}
              </li>
            ))}
          </ul>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-muted-foreground">
          {locations && locations.length > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-accent" />
              {locations.slice(0, 2).join(", ")}
              {locations.length > 2 && ` +${locations.length - 2}`}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-primary" />
            {duration}
          </span>
          {capacity && (
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4 text-forest" />
              Max {capacity}
            </span>
          )}
        </div>

        {/* Limited seats micro-text */}
        {isBookable && (
          <p className="text-xs text-accent mb-3 font-medium">
            Limited seats • Handpicked experiences
          </p>
        )}

        {/* Price & CTA */}
        <div className="flex items-end justify-between pt-4 border-t border-border">
          <div>
            {hasMultiplePrices && punePrice && (
              <p className="text-xs text-muted-foreground mb-1">
                From Pune: {formatPrice(punePrice)}
              </p>
            )}
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-2xl font-bold",
                isBookable ? "text-primary" : "text-muted-foreground"
              )}>
                {formatPrice(price)}
              </span>
              <span className="text-sm text-muted-foreground">per person</span>
            </div>
          </div>
          
          {isBookable ? (
            <Button size="sm" className="group-hover:bg-accent group-hover:text-accent-foreground transition-colors font-semibold">
              Join This Trip
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="group-hover:bg-sunset/10 group-hover:text-sunset group-hover:border-sunset transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRegisterInterest?.(tripId);
              }}
            >
              <Bell className="w-4 h-4 mr-1" />
              Register Interest
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default TripCard;
