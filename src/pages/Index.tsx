import { Link } from "react-router-dom";
import { ArrowRight, Star, Shield, Users, Headphones, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import TripCard from "@/components/TripCard";
import { Button } from "@/components/ui/button";
import { useTrips } from "@/hooks/useTrips";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { loading, getBookableTrips, getUpcomingTrips, isTripBookable } = useTrips();

  const bookableTrips = getBookableTrips();
  const upcomingTrips = getUpcomingTrips().slice(0, 4);
  const featuredTrip = bookableTrips[0];

  const features = [
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "All trips include first-aid support and verified accommodations"
    },
    {
      icon: Users,
      title: "Small Groups",
      description: "Maximum 40 travelers for a more intimate experience"
    },
    {
      icon: Star,
      title: "Expert Guides",
      description: "Local guides with deep knowledge of Konkan culture"
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Round-the-clock assistance during your entire trip"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero */}
      <HeroSection />

      {/* Featured Trip - Bookable Trips */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-primary font-bold text-sm uppercase tracking-wider">Live & Bookable</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
                Book Your Adventure Now
              </h2>
              <p className="text-muted-foreground mt-2">Limited slots available — reserve your spot today!</p>
            </div>
          </div>
          
          {loading ? (
            <Skeleton className="h-64 w-full rounded-2xl" />
          ) : featuredTrip ? (
            <TripCard trip={featuredTrip} featured isBookable={isTripBookable(featuredTrip.trip_id)} />
          ) : (
            <div className="text-center py-12 bg-muted rounded-2xl">
              <p className="text-muted-foreground">No trips available for booking at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-secondary via-muted to-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary font-bold text-sm uppercase tracking-wider">Why GoBhraman</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2">
              Travel with Confidence
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-6 text-center shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-border"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-card-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Trips */}
      {!loading && upcomingTrips.length > 0 && (
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-sunset font-bold text-sm uppercase tracking-wider">Coming Soon</span>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2">
                  Upcoming Adventures
                </h2>
                <p className="text-muted-foreground mt-2">Get notified when these exciting trips launch!</p>
              </div>
              <Button asChild variant="outline" className="font-semibold">
                <Link to="/trips">
                  View All Trips
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingTrips.map((trip) => (
                <TripCard key={trip.trip_id} trip={trip} isBookable={false} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary via-ocean-dark to-accent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
            Ready for Your Konkan Adventure?
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-xl mx-auto mb-8">
            Join our next group trip and create unforgettable memories along the beautiful Konkan coast.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8 font-bold shadow-lg">
              <Link to="/trips">
                <Sparkles className="w-5 h-5 mr-2" />
                Book Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 bg-transparent border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground font-semibold">
              <Link to="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Preview */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary font-bold text-sm uppercase tracking-wider">Testimonials</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2">
              What Travelers Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Priya Sharma",
                location: "Mumbai",
                text: "The Malvan trip was incredible! The scuba diving experience and authentic Malvani food made it unforgettable.",
                rating: 5
              },
              {
                name: "Rahul Deshmukh",
                location: "Pune",
                text: "Well-organized trip with a fantastic guide. Sindhudurg Fort at sunset was magical. Highly recommend!",
                rating: 5
              },
              {
                name: "Anjali Patil",
                location: "Nashik",
                text: "Perfect weekend getaway! The team took care of everything. Already planning my next trip with GoBhraman.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-sunset text-sunset" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <p className="font-semibold text-card-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
