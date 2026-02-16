import { useState, useEffect, memo } from "react";
import { Search, Filter, Calendar, User, Activity, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface AuditLog {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  metadata: any;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

const ACTION_LABELS: Record<string, string> = {
  cancel_booking: "Cancel Booking",
  refund_processed: "Refund Processed",
  seat_override: "Seat Override",
  price_change: "Price Change",
  trip_updated: "Trip Updated",
  batch_updated: "Batch Updated",
  booking_status_change: "Booking Status Change",
};

const ENTITY_COLORS: Record<string, string> = {
  booking: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  batch: "bg-amber-500/20 text-amber-600 border-amber-500/30",
  trip: "bg-green-500/20 text-green-600 border-green-500/30",
  refund: "bg-purple-500/20 text-purple-600 border-purple-500/30",
};

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (!error && data) {
      setLogs(data);
      // Fetch profiles for all unique user_ids
      const userIds = [...new Set(data.map(l => l.user_id))];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);
        if (profileData) {
          const profileMap: Record<string, Profile> = {};
          profileData.forEach(p => { profileMap[p.id] = p; });
          setProfiles(profileMap);
        }
      }
    }
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => {
    if (actionFilter !== "all" && log.action_type !== actionFilter) return false;
    if (entityFilter !== "all" && log.entity_type !== entityFilter) return false;
    if (dateFrom && new Date(log.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(log.created_at) > new Date(dateTo + "T23:59:59")) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const userName = profiles[log.user_id]?.full_name?.toLowerCase() || "";
      const userEmail = profiles[log.user_id]?.email?.toLowerCase() || "";
      return (
        userName.includes(term) ||
        userEmail.includes(term) ||
        log.entity_id.toLowerCase().includes(term) ||
        log.action_type.toLowerCase().includes(term) ||
        JSON.stringify(log.metadata).toLowerCase().includes(term)
      );
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const uniqueActions = [...new Set(logs.map(l => l.action_type))];
  const uniqueEntities = [...new Set(logs.map(l => l.entity_type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Toggle */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, entity, or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </Button>
        <Button variant="outline" onClick={fetchLogs}>
          Refresh
        </Button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-xl border border-border">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Action Type</label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(a => (
                  <SelectItem key={a} value={a}>{ACTION_LABELS[a] || a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Entity Type</label>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {uniqueEntities.map(e => (
                  <SelectItem key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">From Date</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">To Date</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredLogs.length} of {logs.length} log entries
      </p>

      {/* Logs Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Timestamp</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Entity</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No audit logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const profile = profiles[log.user_id];
                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground">{formatDate(log.created_at)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{profile?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{profile?.email || log.user_id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {ACTION_LABELS[log.action_type] || log.action_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Badge className={ENTITY_COLORS[log.entity_type] || "bg-muted text-muted-foreground"}>
                            {log.entity_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">{log.entity_id.slice(0, 8)}...</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[300px]">
                          {log.metadata && Object.keys(log.metadata).length > 0 ? (
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              {Object.entries(log.metadata).slice(0, 3).map(([key, value]) => (
                                <p key={key}>
                                  <span className="font-medium text-foreground">{key}:</span>{" "}
                                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                </p>
                              ))}
                              {Object.keys(log.metadata).length > 3 && (
                                <p className="text-muted-foreground/60">+{Object.keys(log.metadata).length - 3} more</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default memo(AuditLogs);
