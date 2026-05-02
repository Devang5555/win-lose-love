import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Calendar, Shield, Wallet, ChevronDown } from "lucide-react";
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

  const primaryLinks = [
    { href: "/", label: "Home" },
    { href: "/destinations", label: "Destinations" },
    { href: "/trips", label: "Explore Trips" },
    { href: "/experiences", label: "Experiences" },
  ];

  const secondaryLinks = [
    { href: "/blog", label: "Blog" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  const allLinks = [...primaryLinks, ...secondaryLinks];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-[76px] gap-4">
          {/* LEFT: Primary nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1 lg:gap-1.5 flex-1 basis-0 min-w-0">
            {primaryLinks.map((link) => {
              const active = isActive(link.href);
              const isHome = link.href === "/";
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "nav-link px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap",
                    active
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md"
                      : isHome
                        ? "text-animated-gradient hover:opacity-80"
                        : "text-foreground/80 hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* CENTER: Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2 min-w-0"
          >
            <div className="w-11 h-11 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-primary/30 group-hover:border-primary transition-colors shadow-lg shrink-0">
              <img
                src={logo}
                alt="GoBhraman Logo"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="font-serif text-lg sm:text-xl md:text-[24px] font-bold text-foreground whitespace-nowrap">GoBhraman</span>
              <span className="hidden sm:block text-[11px] md:text-[13px] text-primary font-semibold tracking-wide whitespace-nowrap">भ्रमण से मिटे भ्रम</span>
            </div>
          </Link>

          {/* RIGHT: Search + Profile + Book Now (desktop) */}
          <div className="hidden md:flex items-center gap-2 flex-1 basis-0 justify-end min-w-0">
            <GlobalSearchBar variant="navbar" />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 font-semibold relative">
                    <User className="w-4 h-4" />
                    <span className="hidden lg:inline max-w-[80px] truncate">{user.email?.split('@')[0]}</span>
                    {balance > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                        ₹{balance >= 1000 ? `${(balance / 1000).toFixed(0)}k` : balance}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
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
                  {secondaryLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link to={link.href} className="cursor-pointer">{link.label}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 font-semibold">
                    More <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {secondaryLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link to={link.href} className="cursor-pointer">{link.label}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/auth" className="cursor-pointer font-semibold">Login / Sign Up</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button asChild className="bg-animated-gradient text-primary-foreground hover:opacity-90 font-bold shadow-lg border-0">
              <Link to="/trips">Book Now</Link>
            </Button>
          </div>

          {/* MOBILE: Book Now + Hamburger */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <Button asChild size="sm" className="bg-animated-gradient text-primary-foreground font-bold border-0 h-9 px-3 text-xs">
              <Link to="/trips">Book Now</Link>
            </Button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-foreground"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              <div className="px-1 pb-2">
                <GlobalSearchBar variant="navbar" />
              </div>
              {allLinks.map((link) => (
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
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-semibold transition-colors text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
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
                  {balance > 0 && (
                    <Link
                      to="/my-bookings?tab=wallet"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-3 rounded-lg text-sm font-semibold transition-colors text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2"
                    >
                      <Wallet className="w-4 h-4 text-primary" />
                      Wallet
                      <span className="ml-auto text-xs font-bold text-primary">₹{balance.toLocaleString()}</span>
                    </Link>
                  )}
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
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
