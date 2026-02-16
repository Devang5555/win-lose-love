import { useState } from "react";
import { Copy, CheckCircle, Gift, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";

const ReferralCard = () => {
  const { referralCode, balance, getReferralLink } = useWallet();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const link = getReferralLink();
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!referralCode) return null;

  return (
    <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/20 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Gift className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-bold text-foreground">
            Invite Friends & Earn ₹250
          </h3>
          <p className="text-sm text-muted-foreground">
            Share your referral link — earn ₹250 travel credit per booking
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 bg-muted rounded-lg px-4 py-2.5 font-mono text-sm text-foreground truncate border border-border">
          {getReferralLink()}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-2 flex-shrink-0"
        >
          {copied ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Wallet className="w-4 h-4 text-primary" />
        <span className="text-muted-foreground">Current Balance:</span>
        <span className="font-bold text-primary">₹{balance.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default ReferralCard;
