import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Eye, Search, Filter, Users, Phone, Calendar, Wallet, UserCheck, PhoneCall, XOctagon, MessageCircle, Layers, MapPin, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminStats from "@/components/admin/AdminStats";
import BatchManagement from "@/components/admin/BatchManagement";
import TripManagement from "@/components/admin/TripManagement";
import LeadsManagement from "@/components/admin/LeadsManagement";
import { openWhatsAppAdvanceVerified, openWhatsAppFullyPaid, openWhatsAppReminder, openWhatsAppCustom } from "@/lib/whatsapp";

interface Booking {
  id: string;
  trip_id: string;
  trip_name: string;
  full_name: string;
  email: string;
  phone: string;
  pickup_location: string;
  num_travelers: number;
  travel_date: string | null;
  amount: number;
  advance_amount: number | null;
  remaining_amount: number | null;
  payment_status: string | null;
  batch_id: string | null;
  upi_transaction_id: string | null;
  payment_screenshot_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface InterestedUser {
  id: string;
  user_id: string | null;
  name: string;
  mobile: string;
  trip_id: string;
  trip_name: string;
  preferred_date: string;
  submitted_at: string;
  status: string;
}

interface Batch {
  id: string;
  trip_id: string;
  batch_name: string;
  start_date: string;
  end_date: string;
  batch_size: number;
  seats_booked: number;
  status: string;
}

const ADVANCE_AMOUNT = 2000;

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, loading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [interestedUsers, setInterestedUsers] = useState<InterestedUser[]>([]);
  const [filteredInterested, setFilteredInterested] = useState<InterestedUser[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [leadSearchTerm, setLeadSearchTerm] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  // Fetch signed URL when a booking with screenshot is selected
  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (selectedBooking?.payment_screenshot_url) {
        const { data, error } = await supabase.storage
          .from('payment-screenshots')
          .createSignedUrl(selectedBooking.payment_screenshot_url, 3600); // 1 hour expiry
        
        if (!error && data) {
          setScreenshotUrl(data.signedUrl);
        } else {
          setScreenshotUrl(null);
        }
      } else {
        setScreenshotUrl(null);
      }
    };
    
    fetchSignedUrl();
  }, [selectedBooking]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, isAdmin, loading, navigate, toast]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    let filtered = bookings;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.full_name.toLowerCase().includes(term) ||
          b.email.toLowerCase().includes(term) ||
          b.phone.includes(term) ||
          b.trip_name.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter((b) => b.payment_status === paymentStatusFilter);
    }
    
    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, paymentStatusFilter]);

  useEffect(() => {
    let filtered = interestedUsers;
    
    if (leadSearchTerm) {
      const term = leadSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          u.mobile.includes(term) ||
          u.trip_name.toLowerCase().includes(term)
      );
    }
    
    if (leadStatusFilter !== "all") {
      filtered = filtered.filter((u) => u.status === leadStatusFilter);
    }
    
    setFilteredInterested(filtered);
  }, [interestedUsers, leadSearchTerm, leadStatusFilter]);

  const fetchData = async () => {
    const [bookingsRes, interestedRes, batchesRes] = await Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("interested_users").select("*").order("submitted_at", { ascending: false }),
      supabase.from("batches").select("*").order("start_date", { ascending: true }),
    ]);

    if (bookingsRes.error) {
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    } else {
      setBookings(bookingsRes.data || []);
    }

    if (interestedRes.error) {
      toast({
        title: "Error",
        description: "Failed to fetch interested users",
        variant: "destructive",
      });
    } else {
      setInterestedUsers(interestedRes.data || []);
    }

    if (!batchesRes.error) {
      setBatches(batchesRes.data || []);
    }

    setLoadingData(false);
  };

  const updateBookingStatus = async (bookingId: string, status: string, paymentStatus?: string) => {
    const updateData: any = { status };
    if (paymentStatus) {
      updateData.payment_status = paymentStatus;
    }

    const { error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Booking ${status === "confirmed" ? "confirmed" : "cancelled"}`,
      });
      fetchData();
      setSelectedBooking(null);
    }
  };

  const verifyAdvancePayment = async (booking: Booking) => {
    await updateBookingStatus(booking.id, "confirmed", "advance_verified");
    
    // Open WhatsApp notification
    openWhatsAppAdvanceVerified(booking.phone, {
      userName: booking.full_name,
      tripName: booking.trip_name,
      advanceAmount: booking.advance_amount || ADVANCE_AMOUNT * booking.num_travelers,
      remainingAmount: booking.remaining_amount || booking.amount - (ADVANCE_AMOUNT * booking.num_travelers),
      bookingId: booking.id.slice(0, 8).toUpperCase(),
    });
  };

  const markFullyPaid = async (booking: Booking) => {
    const { error } = await supabase
      .from("bookings")
      .update({ payment_status: "fully_paid", remaining_amount: 0 })
      .eq("id", booking.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update payment status", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Marked as fully paid" });
      
      // Open WhatsApp notification
      openWhatsAppFullyPaid(booking.phone, {
        userName: booking.full_name,
        tripName: booking.trip_name,
        advanceAmount: booking.advance_amount || ADVANCE_AMOUNT * booking.num_travelers,
        remainingAmount: 0,
        bookingId: booking.id.slice(0, 8).toUpperCase(),
      });
      
      fetchData();
      setSelectedBooking(null);
    }
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    const { error } = await supabase
      .from("interested_users")
      .update({ status })
      .eq("id", leadId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Lead marked as ${status}`,
      });
      fetchData();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Confirmed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Cancelled</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    }
  };

  const getLeadStatusBadge = (status: string) => {
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

  const getPaymentStatusBadge = (paymentStatus: string | null) => {
    switch (paymentStatus) {
      case "fully_paid":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Fully Paid</Badge>;
      case "advance_verified":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Advance Verified</Badge>;
      case "partial":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Partial</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pending Advance</Badge>;
    }
  };

  const getPaymentStatus = (booking: Booking) => {
    if (booking.payment_status === "fully_paid") return "Completed";
    if (booking.payment_status === "advance_verified") return "Advance Verified";
    const advancePaid = booking.advance_amount || ADVANCE_AMOUNT * booking.num_travelers;
    const balanceAmount = booking.remaining_amount || booking.amount - advancePaid;
    if (booking.status === "confirmed" && balanceAmount <= 0) {
      return "Completed";
    }
    return "Partial";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage bookings, leads, and payments</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter((b) => b.status === "pending").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter((b) => b.status === "confirmed").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter((b) => getPaymentStatus(b) === "Partial" && b.status !== "cancelled").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Partial Paid</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {interestedUsers.filter((u) => u.status === "interested").length}
                  </p>
                  <p className="text-sm text-muted-foreground">New Leads</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{bookings.length}</p>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="trips" className="space-y-6">
            <TabsList className="grid w-full md:w-auto grid-cols-4 md:inline-flex">
              <TabsTrigger value="trips" className="gap-2">
                <MapPin className="w-4 h-4" />
                Trips
              </TabsTrigger>
              <TabsTrigger value="batches" className="gap-2">
                <Layers className="w-4 h-4" />
                Batches
              </TabsTrigger>
              <TabsTrigger value="bookings" className="gap-2">
                <Calendar className="w-4 h-4" />
                Bookings
              </TabsTrigger>
              <TabsTrigger value="leads" className="gap-2">
                <Users className="w-4 h-4" />
                Leads
              </TabsTrigger>
            </TabsList>

            {/* Trips Tab - NEW */}
            <TabsContent value="trips">
              <TripManagement onRefresh={fetchData} />
            </TabsContent>

            {/* Batches Tab */}
            <TabsContent value="batches">
              <BatchManagement batches={batches} onRefresh={fetchData} />
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, phone, or trip..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bookings Table */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Trip</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Total</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Advance</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Balance</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Payment</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                            No bookings found
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((booking) => {
                          const advancePaid = ADVANCE_AMOUNT * booking.num_travelers;
                          const balanceAmount = Math.max(0, booking.amount - advancePaid);
                          const paymentStatus = getPaymentStatus(booking);
                          
                          return (
                            <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium text-foreground">{booking.full_name}</p>
                                  <p className="text-sm text-muted-foreground">{booking.phone}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium text-foreground">{booking.trip_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {booking.num_travelers} traveler(s)
                                  </p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-foreground">₹{booking.amount.toLocaleString()}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-green-600">₹{advancePaid.toLocaleString()}</p>
                              </td>
                              <td className="px-4 py-3">
                                <p className={`font-medium ${balanceAmount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                  ₹{balanceAmount.toLocaleString()}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <Badge 
                                  className={paymentStatus === "Completed" 
                                    ? "bg-green-500/20 text-green-600 border-green-500/30" 
                                    : "bg-amber-500/20 text-amber-600 border-amber-500/30"}
                                >
                                  {paymentStatus}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
                              <td className="px-4 py-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedBooking(booking)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Interested Leads Tab */}
            <TabsContent value="leads" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, mobile, or trip..."
                    value={leadSearchTerm}
                    onChange={(e) => setLeadSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
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
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Mobile</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Trip</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Preferred Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Submitted</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">User Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredInterested.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                            No leads found
                          </td>
                        </tr>
                      ) : (
                        filteredInterested.map((lead) => (
                          <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{lead.name}</p>
                            </td>
                            <td className="px-4 py-3">
                              <a 
                                href={`tel:${lead.mobile}`} 
                                className="flex items-center gap-1 text-primary hover:underline"
                              >
                                <Phone className="w-3 h-3" />
                                {lead.mobile}
                              </a>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{lead.trip_name}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-foreground">{formatDateOnly(lead.preferred_date)}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-muted-foreground">{formatDate(lead.submitted_at)}</p>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">
                                {lead.user_id ? "Registered" : "Guest"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">{getLeadStatusBadge(lead.status)}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateLeadStatus(lead.id, "contacted")}
                                  disabled={lead.status === "contacted"}
                                  title="Mark as Contacted"
                                >
                                  <PhoneCall className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateLeadStatus(lead.id, "converted")}
                                  disabled={lead.status === "converted"}
                                  className="text-green-600 hover:text-green-700"
                                  title="Mark as Converted"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateLeadStatus(lead.id, "not_interested")}
                                  disabled={lead.status === "not_interested"}
                                  className="text-red-600 hover:text-red-700"
                                  title="Mark as Not Interested"
                                >
                                  <XOctagon className="w-4 h-4" />
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
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
            onClick={() => setSelectedBooking(null)}
          />
          <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-card-foreground">Booking Details</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-medium text-foreground">{selectedBooking.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{selectedBooking.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{selectedBooking.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trip</p>
                  <p className="font-medium text-foreground">{selectedBooking.trip_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Travelers</p>
                  <p className="font-medium text-foreground">{selectedBooking.num_travelers}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pickup Location</p>
                  <p className="font-medium text-foreground capitalize">{selectedBooking.pickup_location}</p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  Payment Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Amount</p>
                    <p className="font-bold text-foreground text-lg">₹{selectedBooking.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Advance Paid</p>
                    <p className="font-bold text-green-600 text-lg">
                      ₹{(ADVANCE_AMOUNT * selectedBooking.num_travelers).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Balance Amount</p>
                    <p className="font-bold text-amber-600 text-lg">
                      ₹{Math.max(0, selectedBooking.amount - (ADVANCE_AMOUNT * selectedBooking.num_travelers)).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Status</p>
                    <Badge 
                      className={getPaymentStatus(selectedBooking) === "Completed" 
                        ? "bg-green-500/20 text-green-600 border-green-500/30" 
                        : "bg-amber-500/20 text-amber-600 border-amber-500/30"}
                    >
                      {getPaymentStatus(selectedBooking)}
                    </Badge>
                  </div>
                </div>
                {selectedBooking.upi_transaction_id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">UPI Transaction ID</p>
                    <p className="font-medium text-foreground">{selectedBooking.upi_transaction_id}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Booked On</p>
                  <p className="font-medium text-foreground">{formatDate(selectedBooking.created_at)}</p>
                </div>
              </div>

              {selectedBooking.payment_screenshot_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Payment Screenshot</p>
                  {screenshotUrl ? (
                    <a
                      href={screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={screenshotUrl}
                        alt="Payment Screenshot"
                        className="max-w-full h-auto max-h-64 rounded-lg border border-border"
                      />
                    </a>
                  ) : (
                    <div className="text-sm text-muted-foreground">Loading screenshot...</div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-border">
                {selectedBooking.status === "pending" && (
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => verifyAdvancePayment(selectedBooking)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify & Confirm
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => updateBookingStatus(selectedBooking.id, "cancelled")}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
                
                {selectedBooking.status === "confirmed" && selectedBooking.payment_status !== "fully_paid" && (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => markFullyPaid(selectedBooking)}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Mark Balance as Paid
                  </Button>
                )}

                {selectedBooking.status === "confirmed" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const message = selectedBooking.payment_status === "fully_paid" 
                        ? `Hi ${selectedBooking.full_name}, your booking for ${selectedBooking.trip_name} is fully confirmed!`
                        : `Hi ${selectedBooking.full_name}, your advance for ${selectedBooking.trip_name} is verified. Balance: ₹${(selectedBooking.remaining_amount || 0).toLocaleString()}`;
                      const phone = selectedBooking.phone.replace(/\D/g, '');
                      const phoneWithCountry = phone.startsWith('91') ? phone : `91${phone}`;
                      window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send WhatsApp Message
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Admin;
