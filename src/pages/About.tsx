import { Link } from "react-router-dom";
import { ArrowRight, Heart, Map, Shield, Users, Compass, Sparkles } from "lucide-react";
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
            Our Story
          </h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Travel with meaning, clarity, and connection
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-primary font-medium text-sm uppercase tracking-wider">भ्रमण से मिटे भ्रम</span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2 mb-6">
                Born from a Passion for Real Travel
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  GoBhraman was born from four travellers who believed that travel is not just about going places, 
                  but about removing misconceptions and seeing the world with clarity. The name GoBhraman comes from 
                  "Bhraman"—to travel, explore, and move—and "Go"—a call to step out, experience, and discover.
                </p>
                <p>
                  What began as a passion for road trips and meaningful journeys soon turned into a purpose. 
                  As we explored hidden places, met locals, and lived cultures beyond itineraries, we realized 
                  that true travel changes the way we think, feel, and understand the world.
                </p>
                <p>
                  That belief shaped GoBhraman. Every trip we design is meant to be honest, immersive, and deeply 
                  human—helping travellers connect not just with destinations, but with themselves.
                </p>
                <p className="font-serif text-lg text-primary italic">
                  Because we truly believe — Bhraman se hi mite bhram.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80"
                alt="Exploring India with purpose"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 w-48 h-48 rounded-2xl overflow-hidden shadow-lg hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80"
                  alt="Cultural immersion"
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
                title: "Purpose Over Tourism",
                description: "We don't just organize trips — we create experiences that transform perspectives and build connections."
              },
              {
                icon: Map,
                title: "Local First",
                description: "Our journeys are designed with locals, not around them. Real food, real stories, real culture."
              },
              {
                icon: Compass,
                title: "Explorer Mindset",
                description: "We believe every traveller is an explorer. We just help you find the path less taken."
              },
              {
                icon: Users,
                title: "Community Focus",
                description: "Travel brings people together. Our groups become lifelong communities of like-minded explorers."
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
              { number: "50+", label: "Journeys Completed" },
              { number: "1000+", label: "Happy Explorers" },
              { number: "25+", label: "Destinations" },
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
            Ready to Explore India?
          </h2>
          <p className="text-lg text-accent-foreground/90 max-w-xl mx-auto mb-8">
            Join us on our next adventure and discover India beyond the map — with meaning, clarity, and connection.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link to="/trips">
              <Sparkles className="w-5 h-5 mr-2" />
              Explore Journeys
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
