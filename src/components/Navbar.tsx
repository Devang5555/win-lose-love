import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Calendar, Shield, Wallet } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import GlobalSearchBar from "@/components/GlobalSearchBar";
import { useWallet } from "@/hooks/useWallet";
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
  const { balance } = useWallet();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/destinations", label: "Destinations" },
    { href: "/trips", label: "Explore Trips" },
    { href: "/experiences", label: "Experiences" },
    { href: "/blog", label: "Blog" },
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
        <div className="flex items-center justify-between h-16 md:h-24 gap-4">
          {/* Desktop Navigation - Left */}
          <div className="hidden md:flex items-center gap-1 flex-1 min-w-0">
            {navLinks.slice(0, 4).map((link) => {
              const active = isActive(link.href);
              const isHome = link.href === "/";
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap",
                    active
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md"
                      : isHome
                        ? "text-animated-gradient hover:opacity-80"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Logo - Centered on Desktop, Left on Mobile */}
          <Link
            to="/"
            className="flex items-center gap-2 md:gap-3 group shrink-0"
          >
            <div className="w-11 h-11 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-primary/30 group-hover:border-primary transition-colors shadow-lg shrink-0">
              <img
                src={logo}
                alt="GoBhraman Logo"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-serif text-lg md:text-xl font-bold text-foreground leading-tight">GoBhraman</span>
              <span className="text-[10px] md:text-xs text-primary font-semibold tracking-wide leading-tight">भ्रमण से मिटे भ्रम</span>
            </div>
          </Link>

          {/* Desktop Navigation Right + CTA */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-end min-w-0">
            {navLinks.slice(4).map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap",
                  isActive(link.href)
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
            <GlobalSearchBar variant="navbar" />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 font-semibold relative">
                    <User className="w-4 h-4" />
                    <span className="max-w-[80px] truncate">{user.email?.split('@')[0]}</span>
                    {balance > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                        ₹{balance >= 1000 ? `${(balance / 1000).toFixed(0)}k` : balance}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {balance > 0 && (
                    <DropdownMenuItem asChild>
                      <Link to="/my-bookings?tab=wallet" className="flex items-center gap-2 cursor-pointer">
                        <Wallet className="w-4 h-4 text-primary" />
                        <span>Wallet</span>
                        <span className="ml-auto text-xs font-bold text-primary">₹{balance.toLocaleString()}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
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

            <Button asChild className="bg-animated-gradient text-primary-foreground hover:opacity-90 font-bold shadow-lg border-0">
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
