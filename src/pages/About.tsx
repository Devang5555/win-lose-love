import { Link } from "react-router-dom";
import { ArrowRight, Heart, Map, Shield, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative py-32 md:py-40 gradient-ocean">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            About GoBhraman
          </h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Crafting authentic Konkan experiences since 2020
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-primary font-medium text-sm uppercase tracking-wider">Our Story</span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2 mb-6">
                Born from a Love for the Konkan Coast
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  GoBhraman was born from countless road trips along the Konkan coast, where every winding turn revealed 
                  a new beach, every village shared stories of ancient forts, and every meal was a celebration of 
                  authentic Malvani flavors.
                </p>
                <p>
                  We realized that while the Konkan region holds some of India's most stunning coastal landscapes, 
                  many travelers struggle to experience its true essence. Generic tours miss the hidden gems, 
                  and solo travel can be challenging on unfamiliar terrain.
                </p>
                <p>
                  That's why we created GoBhraman — to share our deep knowledge of this region through carefully 
                  curated group trips that combine adventure, culture, and authentic local experiences.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80"
                alt="Konkan coastline"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 w-48 h-48 rounded-2xl overflow-hidden shadow-lg hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=400&q=80"
                  alt="Water sports"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">Our Values</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2">
              What Drives Us
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Heart,
                title: "Passion for Travel",
                description: "We don't just organize trips — we live for the thrill of discovery and sharing new experiences."
              },
              {
                icon: Map,
                title: "Local Expertise",
                description: "Our guides are locals who know every hidden beach, every historic tale, and every secret food spot."
              },
              {
                icon: Shield,
                title: "Safety First",
                description: "Your safety is paramount. All activities are conducted with proper equipment and trained professionals."
              },
              {
                icon: Users,
                title: "Community Focus",
                description: "We support local communities by partnering with family-run homestays and local guides."
              }
            ].map((value, index) => (
              <div 
                key={index}
                className="bg-card rounded-xl p-6 text-center shadow-card"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-card-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "50+", label: "Trips Completed" },
              { number: "1000+", label: "Happy Travelers" },
              { number: "15+", label: "Destinations" },
              { number: "4.9", label: "Average Rating" }
            ].map((stat, index) => (
              <div key={index}>
                <p className="font-serif text-4xl md:text-5xl font-bold text-primary mb-2">
                  {stat.number}
                </p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 gradient-sunset">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-accent-foreground mb-4">
            Ready to Explore?
          </h2>
          <p className="text-lg text-accent-foreground/90 max-w-xl mx-auto mb-8">
            Join us on our next adventure and discover the magic of the Konkan coast.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link to="/trips">
              View Upcoming Trips
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
