import { useState, useEffect } from "react";
import { Phone, MessageCircle, Download, Search, Filter, CheckCircle, Mail, MapPin, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { openWhatsAppCustom } from "@/lib/whatsapp";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  source: string;
  destination_interest: string | null;
  status: string;
  contacted_at: string | null;
  user_id: string | null;
  wallet_credited: boolean;
  created_at: string;
}

const LeadsCaptureManagement = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setLeads(data as Lead[]);
    setLoading(false);
  };

  const markAsContacted = async (lead: Lead) => {
    const { error } = await supabase
      .from("leads")
      .update({ status: "contacted", contacted_at: new Date().toISOString() })
      .eq("id", lead.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `${lead.name} marked as contacted` });
      fetchLeads();
    }
  };

  const sendWhatsApp = (lead: Lead) => {
    if (!lead.phone) return;
    const message = `Hi ${lead.name}! 👋\n\nThank you for your interest in GoBhraman! 🌄\n\n${lead.destination_interest ? `We see you're interested in ${lead.destination_interest}. ` : ""}We have amazing trips lined up for you.\n\nCheck them out: gobhraman.com/trips\n\n– Team GoBhraman`;
    openWhatsAppCustom(lead.phone, message);
    if (lead.status === "new") {
      markAsContacted(lead);
    }
  };

  const uniqueSources = [...new Set(leads.map((l) => l.source))];
  const uniqueDestinations = [...new Set(leads.filter((l) => l.destination_interest).map((l) => l.destination_interest!))];

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !searchTerm ||
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.phone && lead.phone.includes(searchTerm));
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesDest = destinationFilter === "all" || lead.destination_interest === destinationFilter;
    return matchesSearch && matchesSource && matchesStatus && matchesDest;
  });

  const exportToCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = ["Name", "Email", "Phone", "Source", "Destination", "Status", "Contacted At", "Created At"];
    const rows = filteredLeads.map((l) => [
      l.name,
      l.email,
      l.phone || "",
      l.source,
      l.destination_interest || "",
      l.status,
      l.contacted_at ? new Date(l.contacted_at).toLocaleString() : "",
      new Date(l.created_at).toLocaleString(),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast({ title: "Exported", description: `${filteredLeads.length} leads exported to CSV` });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "contacted":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Contacted</Badge>;
      case "converted":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Converted</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">New</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      popup: "bg-purple-500/20 text-purple-600 border-purple-500/30",
      blog: "bg-blue-500/20 text-blue-600 border-blue-500/30",
      "trip page": "bg-green-500/20 text-green-600 border-green-500/30",
    };
    return <Badge className={colors[source] || "bg-muted text-muted-foreground"}>{source}</Badge>;
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{leads.length}</p>
          <p className="text-sm text-muted-foreground">Total Leads</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{leads.filter((l) => l.status === "new").length}</p>
          <p className="text-sm text-muted-foreground">New</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{leads.filter((l) => l.status === "contacted").length}</p>
          <p className="text-sm text-muted-foreground">Contacted</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{leads.filter((l) => l.source === "popup").length}</p>
          <p className="text-sm text-muted-foreground">From Popup</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {uniqueSources.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={destinationFilter} onValueChange={setDestinationFilter}>
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Destination" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Destinations</SelectItem>
            {uniqueDestinations.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={exportToCSV} variant="outline" disabled={filteredLeads.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          CSV ({filteredLeads.length})
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Source</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Destination</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No leads found</td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{lead.name}</p>
                        {lead.user_id && (
                          <span className="text-xs text-primary">Registered user</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${lead.email}`} className="text-primary hover:underline text-sm flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {lead.email}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      {lead.phone ? (
                        <a href={`tel:${lead.phone}`} className="text-primary hover:underline text-sm flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{getSourceBadge(lead.source)}</td>
                    <td className="px-4 py-3">
                      {lead.destination_interest ? (
                        <span className="text-sm text-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-primary" />
                          {lead.destination_interest}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(lead.status)}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-muted-foreground">{formatDate(lead.created_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {lead.phone && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendWhatsApp(lead)}
                            title="Send WhatsApp"
                            className="text-green-600 hover:text-green-700"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsContacted(lead)}
                          disabled={lead.status === "contacted" || lead.status === "converted"}
                          title="Mark as Contacted"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadsCaptureManagement;
