import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { useDestinations } from "@/hooks/useDestinations";

const Footer = () => {
  const { getFeaturedDestinations } = useDestinations();
  const destinations = getFeaturedDestinations(6);

  return (
    <footer className="bg-foreground text-background pb-16 md:pb-0">
      <div className="container mx-auto px-3 md:px-4 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img 
                src={logo} 
                alt="GoBhraman Logo" 
                className="w-12 h-12 object-contain rounded-lg bg-background p-1"
              />
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold">GoBhraman</span>
                <span className="text-[10px] opacity-70 -mt-1 tracking-wide">भ्रमण से मिटे भ्रम</span>
              </div>
            </Link>
            <p className="text-sm opacity-80 mb-6">
              Curated journeys across India for explorers who seek culture, adventure, and real connections — not tourist checklists.
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/_gobhraman" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/trips" className="text-sm opacity-80 hover:opacity-100 hover:text-primary transition-colors">
                  Explore Journeys
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm opacity-80 hover:opacity-100 hover:text-primary transition-colors">
                  Travel Blog
                </Link>
              </li>
              <li>
                <Link to="/stories" className="text-sm opacity-80 hover:opacity-100 hover:text-primary transition-colors">
                  Traveler Stories
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm opacity-80 hover:opacity-100 hover:text-primary transition-colors">
                  Our Story
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm opacity-80 hover:opacity-100 hover:text-primary transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm opacity-80 hover:opacity-100 hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Destinations */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">Destinations</h4>
            <ul className="space-y-3">
              {destinations.map((dest) => (
                <li key={dest.id}>
                  <Link 
                    to={`/destinations/${dest.slug}`}
                    className="text-sm opacity-80 hover:opacity-100 hover:text-primary transition-colors"
                  >
                    {dest.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link 
                  to="/destinations"
                  className="text-sm opacity-80 hover:opacity-100 hover:text-primary transition-colors font-semibold"
                >
                  View All →
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Call / WhatsApp</p>
                  <a href="tel:+919415026522" className="text-sm opacity-80 hover:opacity-100">
                    +91-9415026522
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email Us</p>
                  <a href="mailto:bhramanbyua@gmail.com" className="text-sm opacity-80 hover:opacity-100">
                    bhramanbyua@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Based In</p>
                  <p className="text-sm opacity-80">Mumbai & Pune, India</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs md:text-sm opacity-70">
              © {new Date().getFullYear()} GoBhraman. Travel with meaning.
            </p>
            <div className="flex gap-3 md:gap-6 flex-wrap justify-center">
              <Link to="/privacy" className="text-xs md:text-sm opacity-70 hover:opacity-100 transition-opacity">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-xs md:text-sm opacity-70 hover:opacity-100 transition-opacity">
                Terms of Service
              </Link>
              <Link to="/cancellation" className="text-xs md:text-sm opacity-70 hover:opacity-100 transition-opacity">
                Cancellation
              </Link>
              <Link to="/faq" className="text-xs md:text-sm opacity-70 hover:opacity-100 transition-opacity">
                FAQs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
