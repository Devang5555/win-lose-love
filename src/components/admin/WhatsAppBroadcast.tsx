import { useState, useEffect } from "react";
import { Send, Users, MapPin, Calendar, Copy, ExternalLink, Clock, CheckCircle, XCircle, RefreshCw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cleanPhoneNumber } from "@/lib/whatsapp";

interface BroadcastMessage {
  id: string;
  message_template: string;
  audience_type: string;
  audience_filter: any;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  status: string;
  sent_at: string | null;
  created_at: string;
}

interface WhatsAppConsent {
  id: string;
  phone: string;
  user_id: string;
  opted_in: boolean;
}

const WhatsAppBroadcast = () => {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [audienceType, setAudienceType] = useState("all");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<BroadcastMessage[]>([]);
  const [consents, setConsents] = useState<WhatsAppConsent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [historyRes, consentsRes] = await Promise.all([
      supabase
        .from("broadcast_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("whatsapp_consents")
        .select("*")
        .eq("opted_in", true),
    ]);

    if (!historyRes.error) setHistory((historyRes.data || []) as BroadcastMessage[]);
    if (!consentsRes.error) setConsents((consentsRes.data || []) as WhatsAppConsent[]);
    setLoading(false);
  };

  const handleSendBroadcast = async () => {
    if (!message.trim()) {
      toast({ title: "Error", description: "Please enter a message", variant: "destructive" });
      return;
    }

    if (consents.length === 0) {
      toast({ title: "No Recipients", description: "No users have opted in for WhatsApp updates.", variant: "destructive" });
      return;
    }

    setSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create broadcast record
      const { data: broadcast, error: createErr } = await supabase
        .from("broadcast_messages")
        .insert({
          created_by: user.id,
          message_template: message,
          audience_type: audienceType,
          audience_filter: {},
          status: "draft",
        })
        .select()
        .single();

      if (createErr) throw createErr;

      // Invoke edge function to send
      const { data: result, error: invokeErr } = await supabase.functions.invoke("whatsapp-broadcast", {
        body: {
          action: "send_broadcast",
          broadcast_id: broadcast.id,
        },
      });

      if (invokeErr) throw invokeErr;

      toast({
        title: "Broadcast Sent!",
        description: `Sent to ${result?.sent || 0} recipients. ${result?.failed || 0} failed.`,
      });

      setMessage("");
      fetchData();
    } catch (err: any) {
      console.error("Broadcast error:", err);
      toast({ title: "Error", description: err.message || "Failed to send broadcast", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const copyMessageForManual = () => {
    navigator.clipboard.writeText(message);
    toast({ title: "Copied!", description: "Message copied to clipboard" });
  };

  const getWaLinks = () => {
    return consents.map(c => ({
      phone: c.phone,
      link: `https://wa.me/${cleanPhoneNumber(c.phone)}?text=${encodeURIComponent(message)}`,
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent": return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Sent</Badge>;
      case "sending": return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Sending</Badge>;
      case "failed": return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Failed</Badge>;
      default: return <Badge className="bg-muted text-muted-foreground">Draft</Badge>;
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const messageTemplates = [
    { label: "New Trip Launch", text: "🚀 Exciting News!\n\nWe're launching a new trip! Check it out at gobhraman.com/trips\n\nLimited seats available. Book early!\n\n– Team GoBhraman" },
    { label: "Early Bird Offer", text: "🐦 Early Bird Offer!\n\nGet special discounts on our upcoming trips. Visit gobhraman.com to explore.\n\nOffer valid for a limited time!\n\n– Team GoBhraman" },
    { label: "Custom", text: "" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{consents.length}</p>
              <p className="text-sm text-muted-foreground">Opted-in Users</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{history.length}</p>
              <p className="text-sm text-muted-foreground">Broadcasts Sent</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {history.reduce((s, h) => s + h.sent_count, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Delivered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compose */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Compose Broadcast
        </h3>

        <div className="space-y-4">
          {/* Templates */}
          <div>
            <Label className="mb-2 block">Quick Templates</Label>
            <div className="flex flex-wrap gap-2">
              {messageTemplates.map((t) => (
                <Button
                  key={t.label}
                  variant="outline"
                  size="sm"
                  onClick={() => t.text && setMessage(t.text)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div>
            <Label className="mb-2 block">Audience</Label>
            <Select value={audienceType} onValueChange={setAudienceType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Opted-in Users ({consents.length})</SelectItem>
                <SelectItem value="upcoming_trips">Users with Upcoming Trips</SelectItem>
                <SelectItem value="destination">Users by Destination</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div>
            <Label className="mb-2 block">Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your broadcast message..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{message.length}/1024 characters</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSendBroadcast} disabled={sending || !message.trim()}>
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Sending..." : "Send via WhatsApp API"}
            </Button>
            <Button variant="outline" onClick={copyMessageForManual} disabled={!message.trim()}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Message
            </Button>
          </div>

          {/* Manual wa.me links */}
          {message.trim() && consents.length > 0 && (
            <details className="mt-4">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                Show individual wa.me links ({consents.length} users)
              </summary>
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {getWaLinks().map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{item.phone}</span>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Open
                    </a>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Send History */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Send History</h3>
          <Button variant="ghost" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No broadcasts sent yet</p>
        ) : (
          <div className="space-y-3">
            {history.map((h) => (
              <div key={h.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-foreground line-clamp-2">{h.message_template}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(h.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {h.recipient_count} recipients
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" /> {h.sent_count} sent
                      </span>
                      {h.failed_count > 0 && (
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-destructive" /> {h.failed_count} failed
                        </span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(h.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppBroadcast;
