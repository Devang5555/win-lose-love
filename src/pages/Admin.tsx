import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Eye, Search, Filter, Users, Phone, Calendar, Wallet, UserCheck, PhoneCall, XOctagon, MessageCircle, Layers, MapPin, Image, AlertTriangle, ExternalLink, RefreshCw, Download, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BatchManagement from "@/components/admin/BatchManagement";
import TripManagement from "@/components/admin/TripManagement";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import { 
  openWhatsAppAdvanceVerified, 
  openWhatsAppFullyPaid,
  getWhatsAppUserLink,
  BookingDetails 
} from "@/lib/whatsapp";

interface Booking {
  id: string;
  user_id: string | null;
  trip_id: string;
  batch_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  pickup_location: string | null;
  num_travelers: number;
  total_amount: number;
  advance_paid: number;
  payment_status: string;
  booking_status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  advance_screenshot_url: string | null;
  remaining_screenshot_url: string | null;
  remaining_payment_status: string | null;
  remaining_payment_uploaded_at: string | null;
  rejection_reason: string | null;
}

interface InterestedUser {
  id: string;
  user_id: string | null;
  trip_id: string;
  full_name: string;
  email: string;
  phone: string;
  preferred_month: string | null;
  message: string | null;
  created_at: string;
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

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, loading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [interestedUsers, setInterestedUsers] = useState<InterestedUser[]>([]);
  const [filteredInterested, setFilteredInterested] = useState<InterestedUser[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [analyticsTrips, setAnalyticsTrips] = useState<{ trip_id: string; trip_name: string; destination_id: string | null }[]>([]);
  const [analyticsDestinations, setAnalyticsDestinations] = useState<{ id: string; name: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [leadSearchTerm, setLeadSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [advanceScreenshotUrl, setAdvanceScreenshotUrl] = useState<string | null>(null);
  const [remainingScreenshotUrl, setRemainingScreenshotUrl] = useState<string | null>(null);
  const [loadingScreenshots, setLoadingScreenshots] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

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
          b.trip_id.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.booking_status === statusFilter);
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
          u.full_name.toLowerCase().includes(term) ||
          u.phone.includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.trip_id.toLowerCase().includes(term)
      );
    }
    
    setFilteredInterested(filtered);
  }, [interestedUsers, leadSearchTerm]);

  // Fetch screenshot URLs when booking is selected
  useEffect(() => {
    const fetchScreenshots = async () => {
      if (!selectedBooking) {
        setAdvanceScreenshotUrl(null);
        setRemainingScreenshotUrl(null);
        return;
      }

      setLoadingScreenshots(true);
      
      try {
        // Fetch advance screenshot
        if (selectedBooking.advance_screenshot_url) {
          const { data } = await supabase.storage
            .from('payment-screenshots')
            .createSignedUrl(selectedBooking.advance_screenshot_url, 3600);
          if (data?.signedUrl) {
            setAdvanceScreenshotUrl(data.signedUrl);
          }
        }

        // Fetch remaining payment screenshot
        if (selectedBooking.remaining_screenshot_url) {
          const { data } = await supabase.storage
            .from('payment-screenshots')
            .createSignedUrl(selectedBooking.remaining_screenshot_url, 3600);
          if (data?.signedUrl) {
            setRemainingScreenshotUrl(data.signedUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching screenshots:', error);
      } finally {
        setLoadingScreenshots(false);
      }
    };

    fetchScreenshots();
  }, [selectedBooking]);

  const fetchData = async () => {
    const [bookingsRes, interestedRes, batchesRes, tripsRes, destsRes] = await Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("interested_users").select("*").order("created_at", { ascending: false }),
      supabase.from("batches").select("*").order("start_date", { ascending: true }),
      supabase.from("trips").select("trip_id, trip_name, destination_id"),
      supabase.from("destinations").select("id, name"),
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

    if (!tripsRes.error) {
      setAnalyticsTrips(tripsRes.data || []);
    }
    if (!destsRes.error) {
      setAnalyticsDestinations(destsRes.data || []);
    }

    setLoadingData(false);
  };

  const updateBookingStatus = async (bookingId: string, bookingStatus: string, paymentStatus?: string) => {
    const updateData: Record<string, string> = { booking_status: bookingStatus };
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
        description: `Booking ${bookingStatus === "confirmed" ? "confirmed" : "updated"}`,
      });
      fetchData();
      setSelectedBooking(null);
    }
  };

  // Verify remaining payment
  const verifyRemainingPayment = async (booking: Booking) => {
    if (!user) return;
    setProcessingAction(true);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          remaining_payment_status: "verified",
          remaining_payment_verified_at: new Date().toISOString(),
          verified_by_admin_id: user.id,
          payment_status: "fully_paid",
          rejection_reason: null
        })
        .eq("id", booking.id);

      if (error) throw error;

      toast({
        title: "Payment Verified",
        description: "Remaining payment has been verified. Booking is now fully paid.",
      });

      // Open WhatsApp to notify user
      const bookingDetails: BookingDetails = {
        userName: booking.full_name,
        tripName: booking.trip_id,
        advanceAmount: booking.advance_paid,
        remainingAmount: booking.total_amount - booking.advance_paid,
        bookingId: booking.id,
        phone: booking.phone
      };
      openWhatsAppFullyPaid(booking.phone, bookingDetails);

      fetchData();
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Error",
        description: "Failed to verify payment",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Reject remaining payment
  const rejectRemainingPayment = async (booking: Booking, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    setProcessingAction(true);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          remaining_payment_status: "rejected",
          rejection_reason: reason,
          payment_status: "advance_verified" // Revert to advance_verified so user can re-upload
        })
        .eq("id", booking.id);

      if (error) throw error;

      toast({
        title: "Payment Rejected",
        description: "User has been notified to re-upload payment proof.",
      });

      // Open WhatsApp to notify user about rejection
      const message = `❌ Payment Verification Failed

Hi ${booking.full_name},

The payment proof uploaded for *${booking.trip_id}* could not be verified.

Reason: ${reason}

Please re-upload the correct payment proof from your dashboard.

– Team GoBhraman`;

      window.open(getWhatsAppUserLink(booking.phone, message), '_blank');

      fetchData();
      setSelectedBooking(null);
      setShowRejectModal(false);
      setRejectionReason("");
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "Error",
        description: "Failed to reject payment",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Confirmed</Badge>;
      case "initiated":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Initiated</Badge>;
      case "expired":
        return <Badge className="bg-gray-500/20 text-gray-600 border-gray-500/30">Expired</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Cancelled</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "fully_paid":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Fully Paid</Badge>;
      case "balance_verified":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Balance Verified</Badge>;
      case "balance_pending":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Balance Pending</Badge>;
      case "advance_verified":
        return <Badge className="bg-teal-500/20 text-teal-600 border-teal-500/30">Advance Verified</Badge>;
      case "pending_advance":
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pending Advance</Badge>;
      case "paid":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Paid</Badge>;
      case "partial":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Partial</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pending</Badge>;
    }
  };

  const getRemainingPaymentStatusBadge = (status: string | null) => {
    switch (status) {
      case "uploaded":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Uploaded - Awaiting Review</Badge>;
      case "verified":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Verified</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-600 border-gray-500/30">Pending</Badge>;
    }
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

  // Get bookings pending remaining payment verification
  const pendingRemainingVerification = bookings.filter(
    b => b.remaining_payment_status === "uploaded" && b.payment_status === "balance_pending"
  );

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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">Manage bookings, leads, and trips</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Pending Remaining Payment Verification Alert */}
          {pendingRemainingVerification.length > 0 && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {pendingRemainingVerification.length} Remaining Payment(s) Awaiting Verification
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Users have uploaded payment screenshots that need your review.
                  </p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setPaymentStatusFilter("balance_pending")}
                >
                  Review Now
                </Button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-8 gap-4 mb-8">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter((b) => b.booking_status === "initiated").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Initiated</p>
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
                    {bookings.filter((b) => b.payment_status === "pending_advance").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending Advance</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter((b) => b.booking_status === "pending").length}
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
                    {bookings.filter((b) => b.booking_status === "confirmed").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {pendingRemainingVerification.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Balance Review</p>
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
                    {bookings.filter((b) => b.payment_status === "fully_paid").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Fully Paid</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {interestedUsers.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Leads</p>
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
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter((b) => b.booking_status === "expired").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Expired</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="trips" className="space-y-6">
            <TabsList className="grid w-full md:w-auto grid-cols-5 md:inline-flex">
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
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
                {pendingRemainingVerification.length > 0 && (
                  <Badge className="ml-1 bg-blue-500 text-white">{pendingRemainingVerification.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="leads" className="gap-2">
                <Users className="w-4 h-4" />
                Leads
              </TabsTrigger>
            </TabsList>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <AdminAnalytics
                bookings={bookings}
                batches={batches}
                trips={analyticsTrips}
                destinations={analyticsDestinations}
              />
            </TabsContent>

            {/* Trips Tab */}
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
                    <SelectItem value="initiated">Initiated</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="pending_advance">Pending Advance</SelectItem>
                    <SelectItem value="advance_verified">Advance Verified</SelectItem>
                    <SelectItem value="balance_pending">Balance Pending</SelectItem>
                    <SelectItem value="fully_paid">Fully Paid</SelectItem>
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
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Payment</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                            No bookings found
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((booking) => (
                          <tr key={booking.id} className={`hover:bg-muted/30 transition-colors ${
                            booking.remaining_payment_status === "uploaded" ? "bg-blue-500/5" : ""
                          }`}>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-foreground">{booking.full_name}</p>
                                <p className="text-sm text-muted-foreground">{booking.phone}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-foreground">{booking.trip_id}</p>
                                <p className="text-sm text-muted-foreground">
                                  {booking.num_travelers} traveler(s)
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-foreground">₹{booking.total_amount.toLocaleString()}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-green-600">₹{booking.advance_paid.toLocaleString()}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                {getPaymentStatusBadge(booking.payment_status)}
                                {booking.remaining_payment_status === "uploaded" && (
                                  <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 text-xs">
                                    Balance Screenshot
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">{getStatusBadge(booking.booking_status)}</td>
                            <td className="px-4 py-3">
                              <Button
                                variant={booking.remaining_payment_status === "uploaded" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedBooking(booking)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                {booking.remaining_payment_status === "uploaded" ? "Review" : "View"}
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Leads Tab */}
            <TabsContent value="leads" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, phone, email, or trip..."
                    value={leadSearchTerm}
                    onChange={(e) => setLeadSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  onClick={() => {
                    const csvData = filteredInterested.map(lead => ({
                      Name: lead.full_name,
                      Email: lead.email || '',
                      Phone: lead.phone,
                      Trip: lead.trip_id,
                      'Preferred Month': lead.preferred_month || '',
                      'Submitted At': formatDate(lead.created_at),
                      Type: lead.user_id ? 'Registered' : 'Guest',
                    }));

                    const headers = Object.keys(csvData[0] || {});
                    const csvContent = [
                      headers.join(','),
                      ...csvData.map(row => 
                        headers.map(header => {
                          const value = row[header as keyof typeof row] || '';
                          const escaped = String(value).replace(/"/g, '""');
                          return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
                        }).join(',')
                      )
                    ].join('\n');

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', `interested-users-${new Date().toISOString().split('T')[0]}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    toast({
                      title: "Export Successful",
                      description: `Exported ${filteredInterested.length} leads to CSV`,
                    });
                  }} 
                  variant="outline"
                  disabled={filteredInterested.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV ({filteredInterested.length})
                </Button>
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
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Preferred Month</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Submitted</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredInterested.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                            No leads found
                          </td>
                        </tr>
                      ) : (
                        filteredInterested.map((lead) => (
                          <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{lead.full_name}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <a 
                                  href={`tel:${lead.phone}`} 
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <Phone className="w-3 h-3" />
                                  {lead.phone}
                                </a>
                                <p className="text-sm text-muted-foreground">{lead.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{lead.trip_id}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-foreground">{lead.preferred_month || "Not specified"}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-muted-foreground">{formatDate(lead.created_at)}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`https://wa.me/${lead.phone}`, '_blank')}
                                  title="Contact via WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`tel:${lead.phone}`, '_blank')}
                                  title="Call"
                                >
                                  <PhoneCall className="w-4 h-4" />
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
            onClick={() => {
              setSelectedBooking(null);
              setShowRejectModal(false);
              setRejectionReason("");
            }}
          />
          <div className="relative w-full max-w-3xl bg-card rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-card-foreground">Booking Details</h2>
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
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
                  <p className="font-medium text-foreground">{selectedBooking.trip_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Travelers</p>
                  <p className="font-medium text-foreground">{selectedBooking.num_travelers}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pickup Location</p>
                  <p className="font-medium text-foreground capitalize">{selectedBooking.pickup_location || "Not specified"}</p>
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
                    <p className="font-bold text-foreground text-lg">₹{selectedBooking.total_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Advance Paid</p>
                    <p className="font-bold text-green-600 text-lg">₹{selectedBooking.advance_paid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Balance Amount</p>
                    <p className="font-bold text-amber-600 text-lg">
                      ₹{Math.max(0, selectedBooking.total_amount - selectedBooking.advance_paid).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Status</p>
                    {getPaymentStatusBadge(selectedBooking.payment_status)}
                  </div>
                </div>

                {/* Remaining Payment Status */}
                {selectedBooking.remaining_payment_status && selectedBooking.remaining_payment_status !== "pending" && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Remaining Payment Status</p>
                        {getRemainingPaymentStatusBadge(selectedBooking.remaining_payment_status)}
                      </div>
                      {selectedBooking.remaining_payment_uploaded_at && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Uploaded At</p>
                          <p className="text-sm font-medium">{formatDate(selectedBooking.remaining_payment_uploaded_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedBooking.notes && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium text-foreground">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>

              {/* Payment Screenshots Section */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <Image className="w-4 h-4 text-primary" />
                  Payment Screenshots
                </h4>
                
                {loadingScreenshots ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Advance Payment Screenshot */}
                    <div className="border border-border rounded-lg p-3">
                      <p className="text-sm font-medium text-foreground mb-2">Advance Payment</p>
                      {advanceScreenshotUrl ? (
                        <div className="space-y-2">
                          <img 
                            src={advanceScreenshotUrl} 
                            alt="Advance Payment Screenshot" 
                            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setViewingImage(advanceScreenshotUrl)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => window.open(advanceScreenshotUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Full Image
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 bg-muted rounded-lg border-2 border-dashed border-border">
                          <div className="text-center">
                            <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                            <p className="text-sm text-muted-foreground">No screenshot uploaded</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Remaining Payment Screenshot */}
                    <div className="border border-border rounded-lg p-3">
                      <p className="text-sm font-medium text-foreground mb-2">Remaining Payment</p>
                      {remainingScreenshotUrl ? (
                        <div className="space-y-2">
                          <img 
                            src={remainingScreenshotUrl} 
                            alt="Remaining Payment Screenshot" 
                            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setViewingImage(remainingScreenshotUrl)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => window.open(remainingScreenshotUrl, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Full Image
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 bg-muted rounded-lg border-2 border-dashed border-border">
                          <div className="text-center">
                            {selectedBooking.payment_status === "balance_pending" || selectedBooking.remaining_payment_status === "uploaded" ? (
                              <>
                                <Clock className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                                <p className="text-sm text-muted-foreground">Awaiting upload</p>
                              </>
                            ) : (
                              <>
                                <Image className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                                <p className="text-sm text-muted-foreground">Not applicable yet</p>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking Status</p>
                  {getStatusBadge(selectedBooking.booking_status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Booked On</p>
                  <p className="font-medium text-foreground">{formatDate(selectedBooking.created_at)}</p>
                </div>
              </div>

              {/* Rejection Reason Input */}
              {showRejectModal && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">Reject Remaining Payment</h4>
                  <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                    Please provide a reason for rejection. This will be shown to the user.
                  </p>
                  <Textarea
                    placeholder="Enter rejection reason..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mb-3"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => rejectRemainingPayment(selectedBooking, rejectionReason)}
                      disabled={!rejectionReason.trim() || processingAction}
                    >
                      {processingAction ? "Processing..." : "Confirm Rejection"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRejectModal(false);
                        setRejectionReason("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Admin Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                {/* Pending Advance - Verify Advance Payment */}
                {selectedBooking.booking_status === "pending" && selectedBooking.payment_status === "pending_advance" && (
                  <>
                    <Button
                      onClick={() => {
                        if (!advanceScreenshotUrl) {
                          toast({
                            title: "Warning",
                            description: "No advance payment screenshot uploaded. Please verify payment manually.",
                            variant: "destructive",
                          });
                          return;
                        }
                        updateBookingStatus(selectedBooking.id, "confirmed", "advance_verified");
                      }}
                      className="flex-1"
                      disabled={!advanceScreenshotUrl}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify Advance & Confirm
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => updateBookingStatus(selectedBooking.id, "cancelled")}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}

                {/* Legacy pending status */}
                {selectedBooking.booking_status === "pending" && selectedBooking.payment_status === "pending" && (
                  <>
                    <Button
                      onClick={() => updateBookingStatus(selectedBooking.id, "confirmed", "advance_verified")}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Booking
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => updateBookingStatus(selectedBooking.id, "cancelled")}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}

                {/* Advance Verified - Wait for balance or mark fully paid */}
                {selectedBooking.booking_status === "confirmed" && 
                 selectedBooking.payment_status === "advance_verified" && 
                 selectedBooking.remaining_payment_status !== "uploaded" && (
                  <>
                    <Button
                      onClick={() => updateBookingStatus(selectedBooking.id, "confirmed", "balance_pending")}
                      variant="outline"
                      className="flex-1"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Request Balance Payment
                    </Button>
                    <Button
                      onClick={() => updateBookingStatus(selectedBooking.id, "confirmed", "fully_paid")}
                      className="flex-1"
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Mark Fully Paid
                    </Button>
                  </>
                )}

                {/* Remaining Payment Uploaded - Verify or Reject */}
                {selectedBooking.remaining_payment_status === "uploaded" && !showRejectModal && (
                  <>
                    <Button
                      onClick={() => {
                        if (!remainingScreenshotUrl) {
                          toast({
                            title: "Warning",
                            description: "No remaining payment screenshot found. Cannot verify.",
                            variant: "destructive",
                          });
                          return;
                        }
                        verifyRemainingPayment(selectedBooking);
                      }}
                      className="flex-1"
                      disabled={!remainingScreenshotUrl || processingAction}
                    >
                      {processingAction ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify & Mark Fully Paid
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectModal(true)}
                      className="flex-1"
                      disabled={processingAction}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Payment
                    </Button>
                  </>
                )}

                {/* Balance Pending but no screenshot uploaded yet */}
                {selectedBooking.booking_status === "confirmed" && 
                 selectedBooking.payment_status === "balance_pending" && 
                 selectedBooking.remaining_payment_status === "pending" && (
                  <div className="w-full p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Waiting for user to upload remaining payment screenshot.
                    </p>
                  </div>
                )}

                {/* Legacy partial status */}
                {selectedBooking.booking_status === "confirmed" && selectedBooking.payment_status === "partial" && (
                  <Button
                    onClick={() => updateBookingStatus(selectedBooking.id, "confirmed", "fully_paid")}
                    className="flex-1"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Mark as Fully Paid
                  </Button>
                )}

                {/* Fully Paid */}
                {selectedBooking.payment_status === "fully_paid" && (
                  <div className="w-full p-3 bg-green-500/10 rounded-lg border border-green-500/20 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700 dark:text-green-400">
                      This booking is fully paid and confirmed.
                    </p>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => window.open(`https://wa.me/${selectedBooking.phone}`, '_blank')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>

              {/* Warning Messages */}
              {!advanceScreenshotUrl && selectedBooking.payment_status === "pending_advance" && (
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Warning: No advance payment screenshot found. Please verify payment before confirming.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
          onClick={() => setViewingImage(null)}
        >
          <img 
            src={viewingImage} 
            alt="Payment Screenshot" 
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <XCircle className="w-6 h-6 text-white" />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Admin;