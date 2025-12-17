import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Phone, User, LogOut, Calendar, Shield } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/trips", label: "Explore Trips" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo - Now Circular */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 group-hover:border-primary transition-colors shadow-lg">
              <img 
                src={logo} 
                alt="GoBhraman Logo" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold text-foreground">GoBhraman</span>
              <span className="text-[10px] text-primary font-semibold -mt-1 tracking-wide">भ्रमण से मिटे भ्रम</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                  isActive(link.href)
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a href="tel:+919415026522" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Phone className="w-4 h-4" />
              <span className="font-medium">+91-9415026522</span>
            </a>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 font-semibold">
                    <User className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">{user.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/my-bookings" className="flex items-center gap-2 cursor-pointer">
                      <Calendar className="w-4 h-4" />
                      My Bookings
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                        <Shield className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" asChild className="font-semibold">
                <Link to="/auth">Login</Link>
              </Button>
            )}
            
            <Button asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90 font-bold shadow-lg">
              <Link to="/trips">Book Now</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-semibold transition-colors",
                    isActive(link.href)
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              
              {user ? (
                <>
                  <Link
                    to="/my-bookings"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2",
                      isActive("/my-bookings")
                        ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Calendar className="w-4 h-4" />
                    My Bookings
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2",
                        isActive("/admin")
                          ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Shield className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-3 rounded-lg text-sm font-semibold transition-colors text-destructive hover:bg-destructive/10 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 rounded-lg text-sm font-semibold transition-colors text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Login / Sign Up
                </Link>
              )}
              
              <div className="pt-4 mt-2 border-t border-border">
                <Button asChild className="w-full bg-gradient-to-r from-primary to-accent font-bold">
                  <Link to="/trips" onClick={() => setIsOpen(false)}>Book Now</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
