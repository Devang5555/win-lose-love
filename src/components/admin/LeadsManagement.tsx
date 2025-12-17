import { useState } from "react";
import { Plus, Edit, Trash2, Save, X, Phone, MessageCircle, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { trips } from "@/data/trips";
import { openWhatsAppCustom } from "@/lib/whatsapp";

interface InterestedUser {
  id: string;
  name: string;
  mobile: string;
  trip_id: string;
  trip_name: string;
  preferred_date: string;
  submitted_at: string;
  status: string;
  user_id: string | null;
  admin_notes: string | null;
}

interface LeadsManagementProps {
  leads: InterestedUser[];
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onRefresh: () => void;
}

const LeadsManagement = ({ leads, onUpdateStatus, onRefresh }: LeadsManagementProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const sendWhatsApp = async (lead: InterestedUser) => {
    const message = `Hi ${lead.name}! 👋

Thank you for your interest in *${lead.trip_name}*!

We'd love to help you plan your perfect Konkan adventure. 🌴

Your preferred date: ${formatDate(lead.preferred_date)}

Any questions? Feel free to ask!

– Team GoBhraman`;
    
    openWhatsAppCustom(lead.mobile, message);
    if (lead.status === "interested") {
      await onUpdateStatus(lead.id, "contacted");
    }
  };

  const convertToBooking = async (lead: InterestedUser) => {
    const message = `Hi ${lead.name}! 👋

Thanks for your interest in *${lead.trip_name}*!

Ready to book your adventure? 🌊

Visit our website or reply here to complete your booking.

– Team GoBhraman`;
    
    openWhatsAppCustom(lead.mobile, message);
    await onUpdateStatus(lead.id, "converted");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "contacted":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Contacted</Badge>;
      case "converted":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Converted</Badge>;
      case "not_interested":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Not Interested</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Interested</Badge>;
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.mobile.includes(searchTerm) ||
      lead.trip_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, phone, or trip..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="interested">Interested</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="not_interested">Not Interested</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Contact</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Trip</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Preferred Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Submitted</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No leads found
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{lead.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`tel:${lead.mobile}`} className="flex items-center gap-1 text-primary hover:underline text-sm">
                        <Phone className="w-3 h-3" />
                        {lead.mobile}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{lead.trip_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{formatDate(lead.preferred_date)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-muted-foreground">{formatDateTime(lead.submitted_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{lead.user_id ? "Registered" : "Guest"}</Badge>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(lead.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => sendWhatsApp(lead)} 
                          title="Send WhatsApp"
                          className="text-green-600 hover:text-green-700"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => convertToBooking(lead)} 
                          title="Convert to Booking" 
                          disabled={lead.status === "converted"}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onUpdateStatus(lead.id, "not_interested")}
                          disabled={lead.status === "not_interested"}
                          title="Mark Not Interested"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
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

export default LeadsManagement;
