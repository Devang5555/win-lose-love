import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, ArrowRight, CreditCard, Wallet, Upload, Image, AlertCircle, RefreshCw, Heart, TrendingDown, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { QRCodeSVG } from "qrcode.react";
import { generateUpiQrString, getMerchantUpiId } from "@/lib/upi";
import { useWishlist } from "@/hooks/useWishlist";
import { useTrips } from "@/hooks/useTrips";
import ReviewForm from "@/components/ReviewForm";
import WalletTab from "@/components/WalletTab";

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
  rejection_reason: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
}

const MyBookings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<Booking | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<string | null>(null);
  const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());
  const { wishlist, loading: wishlistLoading, isInWishlist, isToggling, toggleWishlist, hasPriceDropped, getSavedPrice } = useWishlist();
  const { trips, loading: tripsLoading, isTripBookable, getTripBatches } = useTrips();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchUserReviews();
    }
  }, [user]);

  const fetchUserReviews = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("reviews")
      .select("booking_id")
      .eq("user_id", user.id);
    if (data) {
      setReviewedBookings(new Set(data.map((r) => r.booking_id)));
    }
  };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadRemainingScreenshot = async (bookingId: string) => {
    if (!screenshotFile || !user) return;

    setUploadingId(bookingId);

    try {
      const fileExt = screenshotFile.name.split('.').pop();
      const fileName = `${user.id}/remaining_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, screenshotFile);

      if (uploadError) throw uploadError;

      // Update booking with screenshot URL and set remaining_payment_status to 'uploaded'
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ 
          remaining_screenshot_url: fileName,
          remaining_payment_status: "uploaded",
          remaining_payment_uploaded_at: new Date().toISOString(),
          payment_status: "balance_pending",
          rejection_reason: null // Clear any previous rejection reason
        })
        .eq("id", bookingId);

      if (updateError) throw updateError;

      toast({
        title: "Success!",
        description: "Your payment screenshot has been uploaded. We'll verify it shortly.",
      });

      setShowPaymentModal(null);
      setScreenshotFile(null);
      setScreenshotPreview(null);
      fetchBookings();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload screenshot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
    }
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
      case "initiated":
        return (
          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Payment Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      case "refunded":
        return (
          <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Refunded
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
    if (status === "fully_paid" || status === "paid") return "bg-green-500/20 text-green-600 border-green-500/30";
    if (status === "balance_pending") return "bg-blue-500/20 text-blue-600 border-blue-500/30";
    if (status === "advance_verified" || status === "partial") return "bg-teal-500/20 text-teal-600 border-teal-500/30";
    if (status === "pending_advance") return "bg-amber-500/20 text-amber-600 border-amber-500/30";
    if (status === "pending") return "bg-muted text-muted-foreground border-border";
    return "bg-amber-500/20 text-amber-600 border-amber-500/30";
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "fully_paid":
        return "Fully Paid";
      case "balance_pending":
        return "Balance Under Verification";
      case "advance_verified":
        return "Advance Verified";
      case "pending_advance":
        return "Advance Under Review";
      case "paid":
        return "Fully Paid";
      case "partial":
        return "Advance Paid";
      case "pending":
        return "Awaiting Payment";
      default:
        return "Pending";
    }
  };

  const getRemainingPaymentStatusBadge = (status: string | null) => {
    switch (status) {
      case "uploaded":
        return (
          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Awaiting Verification
          </Badge>
        );
      case "verified":
        return (
          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
            <Wallet className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Determine if user can upload remaining payment
  const canUploadRemainingPayment = (booking: Booking) => {
    // User can upload if:
    // 1. Booking is confirmed with advance_verified
    // 2. remaining_payment_status is 'pending' OR 'rejected'
    // 3. There's a balance to pay
    const hasBalance = booking.total_amount > booking.advance_paid;
    const isConfirmed = booking.booking_status === "confirmed";
    const advanceVerified = ["advance_verified", "partial"].includes(booking.payment_status);
    const canUpload = booking.remaining_payment_status === "pending" || booking.remaining_payment_status === "rejected";
    
    return hasBalance && isConfirmed && advanceVerified && canUpload;
  };

  // Check if remaining payment is pending verification
  const isRemainingPaymentPendingVerification = (booking: Booking) => {
    return booking.remaining_payment_status === "uploaded";
  };

  // Check if fully paid
  const isFullyPaid = (booking: Booking) => {
    return booking.payment_status === "fully_paid" || booking.remaining_payment_status === "verified";
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
      
      <main className="pt-20 md:pt-24 pb-16 px-3 md:px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8 flex items-start md:items-center justify-between gap-3">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">My Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Track your bookings and saved trips</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchBookings} className="flex-shrink-0">
              <RefreshCw className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Refresh</span>
            </Button>
          </div>

          <Tabs defaultValue={searchParams.get("tab") || "bookings"} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              <TabsTrigger value="bookings" className="gap-1.5 text-xs md:text-sm py-2">
                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Bookings</span>
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="gap-1.5 text-xs md:text-sm py-2">
                <Heart className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Wishlist <span className="hidden sm:inline">({wishlist.length})</span></span>
              </TabsTrigger>
              <TabsTrigger value="wallet" className="gap-1.5 text-xs md:text-sm py-2">
                <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Wallet</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
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
                const isOldInitiated = booking.booking_status === "initiated" && 
                  (Date.now() - new Date(booking.created_at).getTime()) > 30 * 60 * 1000;
                
                return (
                  <div
                    key={booking.id}
                    className={`bg-card border rounded-xl p-6 hover:shadow-md transition-shadow ${
                      isOldInitiated ? 'border-destructive/50 shadow-destructive/10' : 'border-border'
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      {/* Urgent Payment Reminder Banner */}
                      {isOldInitiated && (
                        <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30 flex items-start gap-3 animate-fade-in">
                          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-destructive">
                              ⚠️ Payment Overdue — Your seat may be released!
                            </p>
                            <p className="text-xs text-destructive/80 mt-1">
                              This booking was initiated {Math.round((Date.now() - new Date(booking.created_at).getTime()) / 60000)} minutes ago. Please complete your payment soon to avoid losing your spot.
                            </p>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="mt-2"
                              asChild
                            >
                              <Link to={`/trips/${booking.trip_id}`}>
                                Complete Payment Now
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      )}
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
                            <p className={`font-bold ${isFullyPaid(booking) ? 'text-green-600' : 'text-amber-600'}`}>
                              {isFullyPaid(booking) ? "₹0" : `₹${balanceAmount.toLocaleString()}`}
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

                      {/* Cancellation Details */}
                      {(booking.booking_status === "cancelled" || booking.booking_status === "refunded") && (
                        <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                          <h4 className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                            <XCircle className="w-4 h-4" />
                            {booking.booking_status === "refunded" ? "Booking Refunded" : "Booking Cancelled"}
                          </h4>
                          {booking.cancellation_reason && (
                            <p className="text-sm text-foreground">
                              <strong>Reason:</strong> {booking.cancellation_reason}
                            </p>
                          )}
                          {booking.cancelled_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Cancelled on {formatDate(booking.cancelled_at)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Remaining Payment Status (for users who have initiated balance payment) */}
                      {booking.remaining_payment_status && booking.remaining_payment_status !== "pending" && balanceAmount > 0 && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Remaining Payment Status</p>
                              {getRemainingPaymentStatusBadge(booking.remaining_payment_status)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Pay Remaining Balance Button - Only show when status is pending or rejected */}
                      {canUploadRemainingPayment(booking) && (
                        <div className="flex justify-center">
                          <Button 
                            onClick={() => setShowPaymentModal(booking)}
                            className="gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            {booking.remaining_payment_status === "rejected" 
                              ? "Re-upload Payment Screenshot" 
                              : `Pay Remaining Balance (₹${balanceAmount.toLocaleString()})`
                            }
                          </Button>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Write Review Button */}
                          {booking.booking_status === "confirmed" && !reviewedBookings.has(booking.id) && reviewingBooking !== booking.id && (
                            <Button variant="outline" size="sm" onClick={() => setReviewingBooking(booking.id)} className="gap-1">
                              <Star className="w-4 h-4" />
                              Write a Review
                            </Button>
                          )}
                          {reviewedBookings.has(booking.id) && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-500" /> Reviewed
                            </span>
                          )}
                          {/* Download Invoice Button */}
                          {booking.booking_status === "confirmed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => {
                                const invoiceWindow = window.open(`/invoice/${booking.id}`, '_blank');
                              }}
                            >
                              <CreditCard className="w-4 h-4" />
                              View Invoice
                            </Button>
                          )}
                        </div>
                        <Link
                          to={`/trips/${booking.trip_id}`}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          View Trip Details
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>

                      {/* Review Form */}
                      {reviewingBooking === booking.id && (
                        <ReviewForm
                          tripId={booking.trip_id}
                          bookingId={booking.id}
                          onSuccess={() => {
                            setReviewingBooking(null);
                            setReviewedBookings((prev) => new Set(prev).add(booking.id));
                          }}
                          onCancel={() => setReviewingBooking(null)}
                        />
                      )}
                      
                      {/* Status Messages */}
                      {booking.booking_status === "initiated" && (
                        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            Booking initiated — please complete your payment to reserve your spot.
                          </p>
                        </div>
                      )}

                      {booking.booking_status === "pending" && (
                        <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                          <p className="text-sm text-yellow-700 dark:text-yellow-400">
                            Your payment is being verified. We'll confirm your booking shortly.
                          </p>
                        </div>
                      )}

                      {booking.booking_status === "confirmed" && booking.payment_status === "pending_advance" && (
                        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                          <p className="text-sm text-amber-700 dark:text-amber-400">
                            Your advance payment is under review. We'll verify it within 2-4 hours.
                          </p>
                        </div>
                      )}

                      {/* Remaining Payment Uploaded - Awaiting Verification */}
                      {isRemainingPaymentPendingVerification(booking) && (
                        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            Remaining payment submitted. Awaiting admin verification.
                          </p>
                        </div>
                      )}

                      {/* Remaining Payment Rejected */}
                      {booking.remaining_payment_status === "rejected" && (
                        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                Payment verification failed
                              </p>
                              {booking.rejection_reason && (
                                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                                  Reason: {booking.rejection_reason}
                                </p>
                              )}
                              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                                Please re-upload the correct payment proof.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Fully Paid Success Message */}
                      {isFullyPaid(booking) && (
                        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <p className="text-sm text-green-700 dark:text-green-400">
                            Your full payment has been verified successfully. Have a great trip!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist">
              {wishlistLoading || tripsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : wishlist.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-2xl border border-border">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-foreground mb-2">No Saved Trips</h3>
                  <p className="text-muted-foreground mb-6">
                    Save trips you love and get notified about price drops!
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
                  {wishlist.map((item) => {
                    const trip = trips.find((t) => t.trip_id === item.trip_id);
                    if (!trip) return null;
                    const activeBatches = getTripBatches(trip.trip_id);
                    const priceDropped = hasPriceDropped(trip.trip_id, trip.price_default);
                    const savedPrice = getSavedPrice(trip.trip_id);

                    return (
                      <div
                        key={item.id}
                        className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row">
                          <Link to={`/trips/${trip.trip_id}`} className="sm:w-48 h-36 sm:h-auto flex-shrink-0">
                            <img
                              src={trip.images[0] || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"}
                              alt={trip.trip_name}
                              className="w-full h-full object-cover"
                            />
                          </Link>
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <Link to={`/trips/${trip.trip_id}`} className="font-serif text-lg font-bold text-foreground hover:text-primary transition-colors">
                                  {trip.trip_name}
                                </Link>
                                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {trip.duration}
                                  </span>
                                  {activeBatches.length > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {activeBatches.length} batch{activeBatches.length !== 1 ? "es" : ""}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => toggleWishlist(trip.trip_id, trip.price_default)}
                                disabled={isToggling(trip.trip_id)}
                                className="p-2 rounded-full hover:bg-muted transition-colors flex-shrink-0"
                              >
                                <Heart className="w-5 h-5 fill-destructive text-destructive" />
                              </button>
                            </div>
                            <div className="flex items-center gap-3 mt-3">
                              <span className="text-xl font-bold text-primary">
                                ₹{trip.price_default.toLocaleString()}
                              </span>
                              <span className="text-sm text-muted-foreground">/person</span>
                              {priceDropped && savedPrice && (
                                <Badge className="bg-green-500/15 text-green-600 border-green-500/20 text-xs gap-1">
                                  <TrendingDown className="w-3 h-3" />
                                  Price Dropped from ₹{savedPrice.toLocaleString()}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              {isTripBookable(trip.trip_id) ? (
                                <Badge className="bg-primary/15 text-primary border-primary/20">Ready to Book</Badge>
                              ) : (
                                <Badge variant="outline">Coming Soon</Badge>
                              )}
                              <Link
                                to={`/trips/${trip.trip_id}`}
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                View Details
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Wallet Tab */}
            <TabsContent value="wallet">
              <WalletTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
            onClick={() => {
              setShowPaymentModal(null);
              setScreenshotFile(null);
              setScreenshotPreview(null);
            }}
          />
          <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-serif text-xl font-bold text-card-foreground">
                {showPaymentModal.remaining_payment_status === "rejected" 
                  ? "Re-upload Payment Screenshot" 
                  : "Pay Remaining Balance"
                }
              </h2>
              <p className="text-sm text-muted-foreground">
                ₹{(showPaymentModal.total_amount - showPaymentModal.advance_paid).toLocaleString()} for {showPaymentModal.trip_id}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Rejection reason if resubmitting */}
              {showPaymentModal.remaining_payment_status === "rejected" && showPaymentModal.rejection_reason && (
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Previous rejection reason:</p>
                  <p className="text-sm text-red-600 dark:text-red-300">{showPaymentModal.rejection_reason}</p>
                </div>
              )}

              {/* UPI QR Code */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">Scan QR code to pay via UPI</p>
                <div className="inline-block p-4 bg-white rounded-xl">
                  <QRCodeSVG 
                    value={generateUpiQrString({
                      amount: showPaymentModal.total_amount - showPaymentModal.advance_paid,
                      transactionNote: `${showPaymentModal.trip_id} - ${showPaymentModal.full_name} - Balance`
                    })}
                    size={180}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  UPI ID: <span className="font-mono font-medium text-foreground">{getMerchantUpiId()}</span>
                </p>
                <p className="text-lg font-bold text-primary mt-2">
                  ₹{(showPaymentModal.total_amount - showPaymentModal.advance_paid).toLocaleString()}
                </p>
              </div>

              {/* Screenshot Upload */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Upload Payment Screenshot</p>
                <label className="block cursor-pointer">
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    screenshotPreview ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
                  }`}>
                    {screenshotPreview ? (
                      <div className="space-y-2">
                        <img 
                          src={screenshotPreview} 
                          alt="Payment Screenshot" 
                          className="max-h-40 mx-auto rounded-lg"
                        />
                        <p className="text-sm text-primary">Click to change</p>
                      </div>
                    ) : (
                      <div className="py-4">
                        <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload screenshot</p>
                        <p className="text-xs text-muted-foreground mt-1">Max size: 5MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Submit Button */}
              <Button
                onClick={() => uploadRemainingScreenshot(showPaymentModal.id)}
                disabled={!screenshotFile || uploadingId === showPaymentModal.id}
                className="w-full"
              >
                {uploadingId === showPaymentModal.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Payment Proof
                  </>
                )}
              </Button>

              {/* Cancel Button */}
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentModal(null);
                  setScreenshotFile(null);
                  setScreenshotPreview(null);
                }}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyBookings;