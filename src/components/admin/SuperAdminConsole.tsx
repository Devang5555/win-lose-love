import { useEffect, useState } from "react";
import { Activity, RefreshCw, Eye, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuditRow {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  metadata: any;
  created_at: string;
}

interface Snapshot {
  bookingsByStatus: Record<string, number>;
  pendingProofs: number;
  pendingRefunds: number;
  pendingReferrals: number;
  frozenWallets: number;
}

const SuperAdminConsole = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [filter, setFilter] = useState("");
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [batchId, setBatchId] = useState("");

  const load = async () => {
    setLoading(true);
    const [logsRes, b1, b2, b3, b4, b5, b6] = await Promise.all([
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(150),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("booking_status", "confirmed"),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("booking_status", "pending"),
      supabase.from("bookings").select("id", { count: "exact", head: true }).not("advance_screenshot_url", "is", null).neq("payment_status", "advance_verified"),
      supabase.from("refunds").select("id", { count: "exact", head: true }).eq("refund_status", "pending"),
      supabase.from("referral_earnings").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("wallets").select("id", { count: "exact", head: true }).eq("is_frozen", true),
    ]);
    setLogs((logsRes.data as AuditRow[]) || []);
    setSnap({
      bookingsByStatus: { confirmed: b1.count ?? 0, pending: b2.count ?? 0 },
      pendingProofs: b3.count ?? 0,
      pendingRefunds: b4.count ?? 0,
      pendingReferrals: b5.count ?? 0,
      frozenWallets: b6.count ?? 0,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const recalcBatch = async () => {
    if (!batchId) return;
    const { data, error } = await supabase.rpc("recalculate_batch_seats", { p_batch_id: batchId });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else toast({ title: "Recalculated", description: `Seats booked = ${data}` });
  };

  const filtered = logs.filter((l) => {
    if (!filter) return true;
    const s = filter.toLowerCase();
    return (
      l.action_type.toLowerCase().includes(s) ||
      l.entity_type.toLowerCase().includes(s) ||
      l.entity_id.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-primary" /> SuperAdmin Console
          </CardTitle>
          <p className="text-xs text-muted-foreground">Cross-platform visibility, override tools, and live activity feed.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {snap && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              <Stat label="Confirmed" value={snap.bookingsByStatus.confirmed} />
              <Stat label="Pending bookings" value={snap.bookingsByStatus.pending} />
              <Stat label="Proofs to verify" value={snap.pendingProofs} tone="warning" />
              <Stat label="Refunds pending" value={snap.pendingRefunds} tone="warning" />
              <Stat label="Pending referrals" value={snap.pendingReferrals} />
              <Stat label="Frozen wallets" value={snap.frozenWallets} tone="danger" />
            </div>
          )}

          <div className="rounded-xl border p-3 bg-muted/30 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[220px]">
              <p className="text-xs font-semibold mb-1">Resync batch seats from confirmed bookings</p>
              <Input value={batchId} onChange={(e) => setBatchId(e.target.value)} placeholder="batch UUID" />
            </div>
            <Button size="sm" variant="outline" onClick={recalcBatch}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Recalculate
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-4 h-4 text-primary" /> Live Activity (audit logs)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-3">
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by action / entity…" />
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> {loading ? "…" : "Refresh"}
            </Button>
          </div>
          <div className="max-h-[420px] overflow-y-auto divide-y rounded-lg border">
            {filtered.map((l) => (
              <div key={l.id} className="p-2.5 text-xs flex items-start justify-between gap-2 hover:bg-muted/40">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{l.entity_type}</Badge>
                    <span className="font-mono font-semibold text-foreground">{l.action_type}</span>
                    <span className="text-muted-foreground truncate max-w-[260px]">{l.entity_id}</span>
                  </div>
                  {l.metadata && Object.keys(l.metadata).length > 0 && (
                    <pre className="mt-1 text-[10px] text-muted-foreground bg-muted/40 rounded p-1 overflow-x-auto">
                      {JSON.stringify(l.metadata)}
                    </pre>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {new Date(l.created_at).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="p-6 text-center text-xs text-muted-foreground">No activity matches.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Stat = ({ label, value, tone }: { label: string; value: number; tone?: "warning" | "danger" }) => {
  const cls = tone === "danger" ? "border-destructive/30 text-destructive" : tone === "warning" ? "border-orange-500/30 text-orange-600" : "border-border text-foreground";
  return (
    <div className={`rounded-xl border bg-card p-3 ${cls}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
};

export default SuperAdminConsole;
