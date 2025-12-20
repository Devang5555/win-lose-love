import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, ArrowRight, CreditCard, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

const MyBookings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch your bookings",
        variant: "destructive",
      });
    } else {
      setBookings(data || []);
    }
    setLoadingBookings(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending Confirmation
          </Badge>
        );
    }
  };

  const getPaymentStatusColor = (status: string) => {
    if (status === "paid") return "bg-green-500/20 text-green-600 border-green-500/30";
    if (status === "partial") return "bg-blue-500/20 text-blue-600 border-blue-500/30";
    return "bg-amber-500/20 text-amber-600 border-amber-500/30";
  };

  const getPaymentStatusLabel = (status: string) => {
    if (status === "paid") return "Fully Paid";
    if (status === "partial") return "Advance Paid";
    return "Pending";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading || loadingBookings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground">My Bookings</h1>
            <p className="text-muted-foreground mt-2">Track your trip bookings and their status</p>
          </div>

          {/* Bookings List */}
          {bookings.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground mb-2">No Bookings Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't booked any trips yet. Start exploring!
              </p>
              <Button asChild>
                <Link to="/trips">
                  Browse Trips
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const balanceAmount = Math.max(0, booking.total_amount - booking.advance_paid);
                
                return (
                  <div
                    key={booking.id}
                    className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col gap-4">
                      {/* Header */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-serif text-lg font-bold text-foreground">
                              {booking.trip_id}
                            </h3>
                            {getStatusBadge(booking.booking_status)}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {booking.pickup_location || "Not specified"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {booking.num_travelers} traveler(s)
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Booked on {formatDate(booking.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className="bg-muted/50 rounded-lg p-4 mt-2">
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-primary" />
                          Payment Details
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total Trip Price</p>
                            <p className="font-bold text-foreground">₹{booking.total_amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Advance Paid</p>
                            <p className="font-bold text-green-600">₹{booking.advance_paid.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Remaining Balance</p>
                            <p className={`font-bold ${balanceAmount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                              ₹{balanceAmount.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Payment Status</p>
                            <Badge className={getPaymentStatusColor(booking.payment_status)}>
                              <Wallet className="w-3 h-3 mr-1" />
                              {getPaymentStatusLabel(booking.payment_status)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end">
                        <Link
                          to={`/trips/${booking.trip_id}`}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          View Trip Details
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                      
                      {booking.booking_status === "pending" && (
                        <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                          <p className="text-sm text-yellow-700 dark:text-yellow-400">
                            Your payment is being verified. We'll confirm your booking shortly.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyBookings;