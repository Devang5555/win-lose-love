import { Link } from "react-router-dom";
import { Wallet, ArrowRight } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";

const WalletBanner = () => {
  const { user } = useAuth();
  const { balance } = useWallet();

  if (!user || balance <= 0) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            You have ₹{balance.toLocaleString()} travel credit waiting!
          </p>
          <p className="text-xs text-muted-foreground">Use it on your next booking</p>
        </div>
      </div>
      <Link
        to="/my-bookings?tab=wallet"
        className="text-primary text-sm font-semibold hover:underline flex items-center gap-1 flex-shrink-0"
      >
        View <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
};

export default WalletBanner;
