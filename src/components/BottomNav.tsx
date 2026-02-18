import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trips", label: "Trips", icon: Compass },
  { href: "/my-bookings", label: "Bookings", icon: Calendar },
  { href: "/auth", label: "Profile", icon: User, authHref: "/my-bookings" },
];

const BottomNav = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {navItems.map(({ href, label, icon: Icon, authHref }) => {
          const resolvedHref = authHref && user ? authHref : href;
          const active =
            resolvedHref === "/"
              ? pathname === "/"
              : pathname.startsWith(resolvedHref);

          return (
            <Link
              key={label}
              to={resolvedHref}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[60px]",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
