import { useState, useEffect } from "react";
import { Search, Wallet, ArrowDownCircle, ArrowUpCircle, Snowflake, AlertTriangle, Shield, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";

interface WalletRow {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  is_frozen: boolean;
  frozen_at: string | null;
  created_at: string;
  profile?: { full_name: string | null; email: string | null; phone: string | null };
}

interface FraudFlag {
  id: string;
  user_id: string;
  reason: string;
  status: string;
  flagged_at: string;
  resolved_by: string | null;
  resolved_at: string | null;
  notes: string | null;
}

interface TransactionRow {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  reason: string | null;
  expires_at: string | null;
  is_expired: boolean;
  created_at: string;
  created_by: string | null;
}

const CREDIT_REASONS = ["Promotion", "Compensation", "Marketing Campaign", "Refund Adjustment", "Other"];

const WalletManagement = () => {
  const { toast } = useToast();
  const { user, roles } = useAuth();
  const { can } = usePermissions(roles);
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [selectedWallet, setSelectedWallet] = useState<WalletRow | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [showAction, setShowAction] = useState<"credit" | "debit" | "adjust" | null>(null);
  const [actionAmount, setActionAmount] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [actionExpiry, setActionExpiry] = useState("");
  const [processing, setProcessing] = useState(false);
  const [tab, setTab] = useState<"wallets" | "fraud">("wallets");

  useEffect(() => { fetchWallets(); fetchFraudFlags(); }, []);

  const fetchWallets = async () => {
    setLoading(true);
    const { data: walletsData } = await supabase.from("wallets").select("*").order("updated_at", { ascending: false });
    if (walletsData) {
      // Fetch profiles for all wallet users
      const userIds = walletsData.map(w => w.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email, phone").in("id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      setWallets(walletsData.map(w => ({ ...w, is_frozen: (w as any).is_frozen ?? false, frozen_at: (w as any).frozen_at ?? null, profile: profileMap.get(w.user_id) || undefined })) as WalletRow[]);
    }
    setLoading(false);
  };

  const fetchFraudFlags = async () => {
    const { data } = await supabase.from("fraud_flags").select("*").order("flagged_at", { ascending: false });
    setFraudFlags((data || []) as FraudFlag[]);
  };

  const fetchTransactions = async (userId: string) => {
    const { data } = await supabase.from("wallet_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
    setTransactions((data || []) as TransactionRow[]);
  };

  const selectWallet = (w: WalletRow) => {
    setSelectedWallet(w);
    fetchTransactions(w.user_id);
    setShowAction(null);
  };

  const filtered = wallets.filter(w => {
    const term = search.toLowerCase();
    const matchesSearch = !term || 
      w.profile?.full_name?.toLowerCase().includes(term) ||
      w.profile?.email?.toLowerCase().includes(term) ||
      w.profile?.phone?.includes(term);
    
    if (balanceFilter === "positive") return matchesSearch && w.balance > 0;
    if (balanceFilter === "zero") return matchesSearch && w.balance === 0;
    if (balanceFilter === "expiring") return matchesSearch; // Would need join, simplified
    return matchesSearch;
  });

  const handleWalletAction = async () => {
    if (!selectedWallet || !actionAmount || !user) return;
    const amount = parseFloat(actionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      let type = "";
      let rpcAmount = amount;
      if (showAction === "credit") type = "manual_credit";
      else if (showAction === "debit") type = "manual_debit";
      else if (showAction === "adjust") {
        type = "admin_adjustment";
        rpcAmount = amount; // This is the target balance
      }

      const { error } = await supabase.rpc("admin_wallet_adjust", {
        p_target_user_id: selectedWallet.user_id,
        p_amount: rpcAmount,
        p_type: type,
        p_reason: actionReason || null,
        p_notes: actionNotes || null,
        p_expires_at: actionExpiry ? new Date(actionExpiry).toISOString() : null,
      });

      if (error) throw error;

      toast({ title: "Success", description: `Wallet ${showAction} applied successfully.` });
      setShowAction(null);
      setActionAmount("");
      setActionReason("");
      setActionNotes("");
      setActionExpiry("");
      fetchWallets();
      fetchTransactions(selectedWallet.user_id);
      fetchFraudFlags();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to adjust wallet", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const toggleFreeze = async (userId: string, freeze: boolean) => {
    setProcessing(true);
    try {
      const { error } = await supabase.rpc("toggle_wallet_freeze", { p_user_id: userId, p_freeze: freeze });
      if (error) throw error;
      toast({ title: freeze ? "Wallet Frozen" : "Wallet Unfrozen" });
      fetchWallets();
      if (selectedWallet?.user_id === userId) {
        setSelectedWallet(prev => prev ? { ...prev, is_frozen: freeze } : null);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const resolveFraudFlag = async (flagId: string) => {
    if (!user) return;
    const { error } = await supabase.from("fraud_flags").update({
      status: "resolved",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    }).eq("id", flagId);
    if (error) {
      toast({ title: "Error", description: "Failed to resolve", variant: "destructive" });
    } else {
      toast({ title: "Resolved" });
      fetchFraudFlags();
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  if (loading) {
    return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        <Button variant={tab === "wallets" ? "default" : "outline"} size="sm" onClick={() => setTab("wallets")}>
          <Wallet className="w-4 h-4 mr-2" /> Wallets ({wallets.length})
        </Button>
        <Button variant={tab === "fraud" ? "default" : "outline"} size="sm" onClick={() => setTab("fraud")}>
          <AlertTriangle className="w-4 h-4 mr-2" /> Fraud Flags ({fraudFlags.filter(f => f.status === "open").length})
        </Button>
      </div>

      {tab === "fraud" ? (
        <div className="space-y-3">
          {fraudFlags.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No fraud flags.</p>
          ) : (
            fraudFlags.map(f => (
              <div key={f.id} className="p-4 bg-card border border-border rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{f.reason}</p>
                  <p className="text-xs text-muted-foreground">User: {f.user_id.slice(0, 8)}… • {formatDate(f.flagged_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={f.status === "open" ? "bg-red-500/20 text-red-600" : "bg-green-500/20 text-green-600"}>
                    {f.status}
                  </Badge>
                  {f.status === "open" && (
                    <Button size="sm" variant="outline" onClick={() => resolveFraudFlag(f.id)}>Resolve</Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, email, phone…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={balanceFilter} onValueChange={setBalanceFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wallets</SelectItem>
                <SelectItem value="positive">Positive Balance</SelectItem>
                <SelectItem value="zero">Zero Balance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wallet List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filtered.map(w => (
                <div
                  key={w.id}
                  onClick={() => selectWallet(w)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${selectedWallet?.id === w.id ? "bg-primary/10 border-primary/30" : "bg-card border-border hover:bg-muted"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{w.profile?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{w.profile?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">₹{w.balance.toLocaleString()}</p>
                      {w.is_frozen && <Badge className="bg-blue-500/20 text-blue-600 text-xs"><Snowflake className="w-3 h-3 mr-1" />Frozen</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Earned: ₹{w.total_earned.toLocaleString()}</span>
                    <span>Spent: ₹{w.total_spent.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No wallets found.</p>}
            </div>

            {/* Detail Panel */}
            {selectedWallet ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-5 text-primary-foreground">
                  <p className="font-bold text-lg">{selectedWallet.profile?.full_name || "User"}</p>
                  <p className="text-sm opacity-80">{selectedWallet.profile?.email}</p>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div><p className="text-xs opacity-70">Balance</p><p className="text-2xl font-bold">₹{selectedWallet.balance.toLocaleString()}</p></div>
                    <div><p className="text-xs opacity-70">Earned</p><p className="text-lg font-semibold">₹{selectedWallet.total_earned.toLocaleString()}</p></div>
                    <div><p className="text-xs opacity-70">Spent</p><p className="text-lg font-semibold">₹{selectedWallet.total_spent.toLocaleString()}</p></div>
                  </div>
                  {selectedWallet.is_frozen && (
                    <div className="mt-3 bg-primary-foreground/20 rounded-lg p-2 text-sm flex items-center gap-2">
                      <Snowflake className="w-4 h-4" /> Wallet is frozen
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setShowAction("credit")} disabled={selectedWallet.is_frozen}>
                    <ArrowDownCircle className="w-4 h-4 mr-1" /> Credit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAction("debit")} disabled={selectedWallet.is_frozen}>
                    <ArrowUpCircle className="w-4 h-4 mr-1" /> Debit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAction("adjust")} disabled={selectedWallet.is_frozen}>
                    <Shield className="w-4 h-4 mr-1" /> Adjust
                  </Button>
                  {selectedWallet.is_frozen ? (
                    <Button size="sm" variant="destructive" onClick={() => toggleFreeze(selectedWallet.user_id, false)} disabled={processing}>
                      <Snowflake className="w-4 h-4 mr-1" /> Unfreeze
                    </Button>
                  ) : (
                    <Button size="sm" variant="destructive" onClick={() => toggleFreeze(selectedWallet.user_id, true)} disabled={processing}>
                      <Snowflake className="w-4 h-4 mr-1" /> Freeze
                    </Button>
                  )}
                </div>

                {/* Action Form */}
                {showAction && (
                  <div className="bg-muted rounded-xl p-4 space-y-3">
                    <h4 className="font-semibold text-foreground capitalize">{showAction} Wallet</h4>
                    <div>
                      <Label>{showAction === "adjust" ? "Target Balance (₹)" : "Amount (₹)"}</Label>
                      <Input type="number" min="0" value={actionAmount} onChange={e => setActionAmount(e.target.value)} />
                    </div>
                    <div>
                      <Label>Reason</Label>
                      <Select value={actionReason} onValueChange={setActionReason}>
                        <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                        <SelectContent>
                          {CREDIT_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea value={actionNotes} onChange={e => setActionNotes(e.target.value)} placeholder="Optional notes…" rows={2} />
                    </div>
                    {showAction === "credit" && (
                      <div>
                        <Label>Expiry Date (optional)</Label>
                        <Input type="date" value={actionExpiry} onChange={e => setActionExpiry(e.target.value)} />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={handleWalletAction} disabled={processing}>
                        {processing ? "Processing…" : `Apply ${showAction}`}
                      </Button>
                      <Button variant="outline" onClick={() => setShowAction(null)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {/* Transaction Ledger */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Transaction Ledger
                  </h4>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {transactions.map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-2 bg-card rounded-lg border border-border text-sm">
                        <div className="flex items-center gap-2">
                          {tx.amount > 0 ? <ArrowDownCircle className="w-3.5 h-3.5 text-green-600" /> : <ArrowUpCircle className="w-3.5 h-3.5 text-red-500" />}
                          <div>
                            <p className="font-medium text-foreground">{tx.type.replace(/_/g, " ")}</p>
                            {tx.description && <p className="text-xs text-muted-foreground">{tx.description}</p>}
                            {tx.expires_at && <p className="text-xs text-amber-600">Expires: {formatDate(tx.expires_at)}</p>}
                            {tx.is_expired && <Badge className="bg-gray-500/20 text-gray-500 text-xs">Expired</Badge>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-semibold ${tx.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                            {tx.amount > 0 ? "+" : ""}₹{Math.abs(tx.amount).toLocaleString()}
                          </span>
                          <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                        </div>
                      </div>
                    ))}
                    {transactions.length === 0 && <p className="text-center text-muted-foreground py-4">No transactions.</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>Select a wallet to view details</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default WalletManagement;
