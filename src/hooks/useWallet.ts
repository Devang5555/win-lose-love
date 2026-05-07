import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const WALLET_MAX_PER_BOOKING = 300;
export const WALLET_MIN_ORDER_AMOUNT = 3499;
export const WALLET_SIGNUP_BONUS = 101;
export const WALLET_EXPIRY_DAYS = 180;

export interface WalletData {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  is_frozen: boolean;
}

export interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  reference_id: string | null;
  created_at: string;
  expires_at?: string | null;
  is_expired?: boolean;
}

export interface ReferralEarning {
  id: string;
  referred_user_id: string;
  booking_id: string | null;
  amount: number;
  status: string;
  created_at: string;
}

/**
 * Compute how much wallet credit can be applied to a booking.
 * Rules: max ₹300, only on bookings ≥ ₹5000, never more than balance/total.
 */
export const computeWalletApplicable = (balance: number, totalAmount: number, isFrozen: boolean) => {
  if (isFrozen || balance <= 0) return 0;
  if (totalAmount < WALLET_MIN_ORDER_AMOUNT) return 0;
  return Math.min(balance, WALLET_MAX_PER_BOOKING, totalAmount);
};

export const useWallet = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data as WalletData | null;
    },
    enabled: !!user,
  });

  const { data: referralCode } = useQuery({
    queryKey: ["referral-code", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.rpc("generate_referral_code", {
        p_user_id: user.id,
      });
      return data as string | null;
    },
    enabled: !!user,
  });

  const { data: transactions } = useQuery({
    queryKey: ["wallet-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as WalletTransaction[];
    },
    enabled: !!user,
  });

  const { data: referralEarnings } = useQuery({
    queryKey: ["referral-earnings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("referral_earnings")
        .select("*")
        .eq("referrer_user_id", user.id)
        .order("created_at", { ascending: false });
      return (data || []) as ReferralEarning[];
    },
    enabled: !!user,
  });

  const applyWalletCredit = async (bookingId: string, amount: number) => {
    if (!user) return false;
    const { data, error } = await supabase.rpc("apply_wallet_to_booking", {
      p_user_id: user.id,
      p_booking_id: bookingId,
      p_amount: amount,
    });
    if (error) {
      console.warn("Wallet apply error:", error.message);
      return false;
    }
    if (data) {
      queryClient.invalidateQueries({ queryKey: ["wallet", user.id] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions", user.id] });
    }
    return !!data;
  };

  const creditReferral = async (referralCodeUsed: string, bookingId: string) => {
    if (!user) return false;
    const { data } = await supabase.rpc("credit_referral_reward", {
      p_referrer_code: referralCodeUsed,
      p_referred_user_id: user.id,
      p_booking_id: bookingId,
    });
    return !!data;
  };

  const applyCoupon = async (bookingId: string, code: string): Promise<{ success: boolean; discount?: number; error?: string }> => {
    if (!user) return { success: false, error: "Not authenticated" };
    const { data, error } = await supabase.rpc("apply_coupon_to_booking", {
      p_user_id: user.id,
      p_booking_id: bookingId,
      p_code: code,
    });
    if (error) return { success: false, error: error.message };
    return data as any;
  };

  const balance = wallet?.balance ?? 0;
  const isFrozen = wallet?.is_frozen ?? false;

  // Find earliest non-expired credit's expiry to surface to user
  const nextExpiry = (transactions || [])
    .filter((t) => t.amount > 0 && !t.is_expired && t.expires_at)
    .map((t) => new Date(t.expires_at as string))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const getReferralLink = () => {
    if (!referralCode) return "";
    return `${window.location.origin}/trips?ref=${referralCode}`;
  };

  return {
    wallet,
    balance,
    isFrozen,
    walletLoading,
    referralCode,
    transactions: transactions || [],
    referralEarnings: referralEarnings || [],
    nextExpiry,
    applyWalletCredit,
    creditReferral,
    applyCoupon,
    getReferralLink,
  };
};
