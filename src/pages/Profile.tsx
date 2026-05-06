import { Link } from "react-router-dom";
import { User, Calendar, Wallet, HelpCircle, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ProfileLayout from "@/components/profile/ProfileLayout";

const menu = [
  { to: "/profile/account", label: "My Account", desc: "Personal details & password", icon: User },
  { to: "/my-bookings", label: "My Bookings", desc: "Upcoming & past trips", icon: Calendar },
  { to: "/profile/credits", label: "My Credits", desc: "Wallet, referrals & history", icon: Wallet },
  { to: "/profile/help", label: "Help & Support", desc: "FAQs, WhatsApp & cancellation", icon: HelpCircle },
];

const Profile = () => {
  const { user } = useAuth();
  const { balance } = useWallet();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <ProfileLayout title="My Profile" description={user?.email || ""} showBack={false}>
      <div className="space-y-3">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-card transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
              </div>
              {item.to === "/profile/credits" && balance > 0 && (
                <span className="text-xs font-bold text-primary mr-1">₹{balance.toLocaleString()}</span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          );
        })}

        <Button onClick={handleSignOut} variant="outline" className="w-full mt-4 gap-2 text-destructive hover:text-destructive">
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </ProfileLayout>
  );
};

export default Profile;
