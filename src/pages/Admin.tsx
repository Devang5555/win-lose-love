import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Eye, Search, Filter, Users, Phone, Calendar, Wallet, UserCheck, PhoneCall, XOctagon, MessageCircle, Layers, MapPin } from "lucide-react";
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
import BatchManagement from "@/components/admin/BatchManagement";
import TripManagement from "@/components/admin/TripManagement";

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
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [leadSearchTerm, setLeadSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

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
          u.trip_id.toLowerCase().includes(term)
      );
    }
    
    setFilteredInterested(filtered);
  }, [interestedUsers, leadSearchTerm]);

  const fetchData = async () => {
    const [bookingsRes, interestedRes, batchesRes] = await Promise.all([
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("interested_users").select("*").order("created_at", { ascending: false }),
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

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "paid":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Paid</Badge>;
      case "partial":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">Partial</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Pending</Badge>;
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
            <p className="text-muted-foreground mt-2">Manage bookings, leads, and trips</p>
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
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {bookings.filter((b) => b.payment_status === "partial").length}
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
                          <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
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
                              {getPaymentStatusBadge(booking.payment_status)}
                            </td>
                            <td className="px-4 py-3">{getStatusBadge(booking.booking_status)}</td>
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
                    placeholder="Search by name, phone, or trip..."
                    value={leadSearchTerm}
                    onChange={(e) => setLeadSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
                {selectedBooking.notes && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium text-foreground">{selectedBooking.notes}</p>
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

              <div className="flex gap-3 pt-4">
                {selectedBooking.booking_status === "pending" && (
                  <>
                    <Button
                      onClick={() => updateBookingStatus(selectedBooking.id, "confirmed", "partial")}
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
                {selectedBooking.booking_status === "confirmed" && selectedBooking.payment_status !== "paid" && (
                  <Button
                    onClick={() => updateBookingStatus(selectedBooking.id, "confirmed", "paid")}
                    className="flex-1"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Mark as Fully Paid
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://wa.me/${selectedBooking.phone}`, '_blank')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
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