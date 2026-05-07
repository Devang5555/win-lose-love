import { useState, useEffect } from "react";
import { Trash2, ShieldAlert, RefreshCw, AlertTriangle, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions, type AppRole } from "@/hooks/usePermissions";

interface SuperAdminResetToolsProps {
  roles: AppRole[];
  onAfterAction?: () => void;
}

const SuperAdminResetTools = ({ roles, onAfterAction }: SuperAdminResetToolsProps) => {
  const { toast } = useToast();
  const isSuperAdmin = roles.includes("super_admin");
  const [confirmText, setConfirmText] = useState("");
  const [open, setOpen] = useState<null | "test_bookings" | "deleted_bookings">(null);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<{ test: number; deleted: number }>({ test: 0, deleted: 0 });

  const loadCounts = async () => {
    const [testRes, delRes] = await Promise.all([
      supabase.from("bookings").select("id", { count: "exact", head: true }).ilike("notes", "%test%"),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("is_deleted", true),
    ]);
    setStats({ test: testRes.count ?? 0, deleted: delRes.count ?? 0 });
  };

  useEffect(() => { loadCounts(); }, []);

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <ShieldAlert className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="font-semibold">Super Admin Only</p>
          <p className="text-sm text-muted-foreground">These reset tools are restricted to super_admin accounts.</p>
        </CardContent>
      </Card>
    );
  }

  const handleConfirm = async () => {
    if (confirmText !== "DELETE TEST DATA") {
      toast({ title: "Confirmation failed", description: "Type the exact phrase.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      let q = supabase.from("bookings").delete();
      if (open === "test_bookings") q = q.ilike("notes", "%test%");
      else q = q.eq("is_deleted", true);
      const { error } = await q;
      if (error) throw error;

      // Audit log
      await supabase.rpc("create_audit_log", {
        p_user_id: (await supabase.auth.getUser()).data.user?.id!,
        p_action_type: open === "test_bookings" ? "purge_test_bookings" : "purge_soft_deleted_bookings",
        p_entity_type: "booking",
        p_entity_id: "bulk",
        p_metadata: { count: open === "test_bookings" ? stats.test : stats.deleted },
      } as any);

      toast({ title: "Cleared", description: "Test data purged. Analytics will refresh." });
      setOpen(null);
      setConfirmText("");
      await loadCounts();
      onAfterAction?.();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message ?? "Reset failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            Super Admin Reset Tools
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Permanently deletes test/demo data. Real users, trips, batches and wallets are <b>never</b> touched.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/40">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-semibold text-sm">Test bookings (notes contain "test")</p>
                <p className="text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px] mr-1">{stats.test}</Badge>
                  rows will be permanently removed.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled={stats.test === 0}
              onClick={() => setOpen("test_bookings")}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Purge
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/40">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-semibold text-sm">Soft-deleted bookings</p>
                <p className="text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px] mr-1">{stats.deleted}</Badge>
                  rows already in the trash will be permanently removed.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled={stats.deleted === 0}
              onClick={() => setOpen("deleted_bookings")}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Purge
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={loadCounts} className="w-full">
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh counts
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={open !== null} onOpenChange={(o) => { if (!o) { setOpen(null); setConfirmText(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" /> Confirm permanent deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <b>{open === "test_bookings" ? stats.test : stats.deleted}</b> booking record(s).
              Type <code className="px-1 bg-muted rounded">DELETE TEST DATA</code> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE TEST DATA"
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirm(); }}
              disabled={busy || confirmText !== "DELETE TEST DATA"}
              className="bg-destructive hover:bg-destructive/90"
            >
              {busy ? "Deleting…" : "Permanently delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SuperAdminResetTools;
