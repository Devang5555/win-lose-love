import { Wallet, Gift, ArrowDownCircle, ArrowUpCircle, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWallet, WALLET_MAX_PER_BOOKING, WALLET_MIN_ORDER_AMOUNT } from "@/hooks/useWallet";
import ReferralCard from "@/components/ReferralCard";
import ProfileLayout from "@/components/profile/ProfileLayout";

const formatDate = (s: string) => new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const getTransactionIcon = (type: string, amount: number) =>
  amount > 0 ? <ArrowDownCircle className="w-4 h-4 text-green-600" /> : <ArrowUpCircle className="w-4 h-4 text-red-500" />;

const getTypeLabel = (type: string) => {
  switch (type) {
    case "referral_credit": return "Referral Reward";
    case "booking_debit": return "Booking Discount";
    case "manual_credit":
    case "admin_credit": return "Promo Credit";
    case "manual_debit":
    case "admin_debit": return "Admin Adjustment";
    case "signup_bonus": return "Signup Bonus";
    case "credit_expired": return "Credit Expired";
    default: return type.replace(/_/g, " ");
  }
};

const ProfileCredits = () => {
  const { wallet, balance, transactions, referralEarnings, walletLoading, isFrozen, nextExpiry } = useWallet();

  return (
    <ProfileLayout title="My Credits" description="Wallet, referral earnings & transaction history">
      {walletLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="space-y-6">
          {/* Balance Card */}
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-6 text-primary-foreground">
            <div className="flex items-center gap-3 mb-4">
              <Wallet className="w-7 h-7" />
              <h2 className="font-serif text-xl font-bold">Wallet Balance</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-primary-foreground/70 text-xs">Current</p>
                <p className="text-2xl md:text-3xl font-bold">₹{balance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-primary-foreground/70 text-xs">Earned</p>
                <p className="text-lg font-semibold">₹{(wallet?.total_earned ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-primary-foreground/70 text-xs">Used</p>
                <p className="text-lg font-semibold">₹{(wallet?.total_spent ?? 0).toLocaleString()}</p>
              </div>
            </div>
            {nextExpiry && (
              <div className="mt-4 bg-primary-foreground/15 rounded-lg p-2.5 text-xs flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Next credits expire on <span className="font-semibold">{formatDate(nextExpiry.toISOString())}</span>
              </div>
            )}
            {isFrozen && (
              <div className="mt-4 bg-primary-foreground/20 rounded-lg p-3 text-sm flex items-center gap-2">
                ❄️ Wallet temporarily restricted. Contact support.
              </div>
            )}
          </div>

          {/* Rules */}
          <div className="bg-muted/40 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
            <p>• Max <span className="font-semibold text-foreground">₹{WALLET_MAX_PER_BOOKING}</span> credits applicable per booking</p>
            <p>• Usable only on bookings above <span className="font-semibold text-foreground">₹{WALLET_MIN_ORDER_AMOUNT.toLocaleString()}</span></p>
            <p>• Credits expire <span className="font-semibold text-foreground">180 days</span> after they are earned</p>
          </div>

          <ReferralCard />

          {referralEarnings.length > 0 && (
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" /> Referral Earnings
              </h3>
              <div className="space-y-2">
                {referralEarnings.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {e.status === "pending" ? "Pending — awaiting friend's confirmation" : "Friend's booking confirmed"}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.created_at)}</p>
                    </div>
                    <Badge className={e.status === "pending"
                      ? "bg-amber-500/15 text-amber-600 border-amber-500/20"
                      : "bg-green-500/15 text-green-600 border-green-500/20"}>
                      {e.status === "pending" ? "₹" : "+₹"}{e.amount.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-serif text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Transaction History
            </h3>
            {transactions.length === 0 ? (
              <div className="text-center py-8 bg-muted rounded-xl">
                <p className="text-muted-foreground text-sm">No transactions yet. Invite friends to start earning!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-3 min-w-0">
                      {getTransactionIcon(tx.type, tx.amount)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{getTypeLabel(tx.type)}</p>
                        {tx.description && <p className="text-xs text-muted-foreground truncate">{tx.description}</p>}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.created_at)}
                          {tx.expires_at && !tx.is_expired && tx.amount > 0 && (
                            <> · expires {formatDate(tx.expires_at)}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold text-sm flex-shrink-0 ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                      {tx.amount > 0 ? "+" : ""}₹{Math.abs(tx.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </ProfileLayout>
  );
};

export default ProfileCredits;
