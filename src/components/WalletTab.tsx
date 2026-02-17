import { Wallet, Gift, ArrowDownCircle, ArrowUpCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/hooks/useWallet";
import ReferralCard from "@/components/ReferralCard";

const WalletTab = () => {
  const { wallet, balance, transactions, referralEarnings, walletLoading, isFrozen } = useWallet();

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const getTransactionIcon = (type: string) => {
    if (type.includes("credit") || type === "signup_bonus") return <ArrowDownCircle className="w-4 h-4 text-green-600" />;
    return <ArrowUpCircle className="w-4 h-4 text-red-500" />;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "referral_credit": return "Referral Reward";
      case "booking_debit": return "Booking Discount";
      case "admin_credit": return "Admin Credit";
      case "admin_debit": return "Admin Adjustment";
      case "signup_bonus": return "Signup Bonus";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-6 text-primary-foreground">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-8 h-8" />
          <h2 className="font-serif text-2xl font-bold">My Wallet</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-primary-foreground/70 text-xs">Current Balance</p>
            <p className="text-3xl font-bold">₹{balance.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-primary-foreground/70 text-xs">Total Earned</p>
            <p className="text-xl font-semibold">₹{(wallet?.total_earned ?? 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-primary-foreground/70 text-xs">Total Used</p>
            <p className="text-xl font-semibold">₹{(wallet?.total_spent ?? 0).toLocaleString()}</p>
          </div>
        </div>
        {isFrozen && (
          <div className="mt-4 bg-primary-foreground/20 rounded-lg p-3 text-sm flex items-center gap-2">
            ❄️ Wallet temporarily restricted. Contact support.
          </div>
        )}
      </div>

      {/* Referral Card */}
      <ReferralCard />

      {/* Referral Earnings */}
      {referralEarnings.length > 0 && (
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Referral Earnings
          </h3>
          <div className="space-y-2">
            {referralEarnings.map((earning) => (
              <div key={earning.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Friend's booking completed</p>
                  <p className="text-xs text-muted-foreground">{formatDate(earning.created_at)}</p>
                </div>
                <Badge className="bg-green-500/15 text-green-600 border-green-500/20">
                  +₹{earning.amount.toLocaleString()}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div>
        <h3 className="font-serif text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Transaction History
        </h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8 bg-muted rounded-xl">
            <p className="text-muted-foreground text-sm">No transactions yet. Invite friends to start earning!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  {getTransactionIcon(tx.type)}
                  <div>
                    <p className="text-sm font-medium text-foreground">{getTypeLabel(tx.type)}</p>
                    {tx.description && <p className="text-xs text-muted-foreground">{tx.description}</p>}
                    <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                  </div>
                </div>
                <span className={`font-semibold text-sm ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                  {tx.amount > 0 ? "+" : ""}₹{Math.abs(tx.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletTab;
