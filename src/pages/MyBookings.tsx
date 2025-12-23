import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, ArrowRight, CreditCard, Wallet, Upload, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { QRCodeSVG } from "qrcode.react";
import { generateUpiQrString, getMerchantUpiId } from "@/lib/upi";

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
}

const MyBookings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<Booking | null>(null);

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

      const { error: updateError } = await supabase
        .from("bookings")
        .update({ 
          remaining_screenshot_url: fileName,
          payment_status: "balance_pending"
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
    if (status === "fully_paid" || status === "paid") return "bg-green-500/20 text-green-600 border-green-500/30";
    if (status === "balance_pending") return "bg-blue-500/20 text-blue-600 border-blue-500/30";
    if (status === "advance_verified" || status === "partial") return "bg-teal-500/20 text-teal-600 border-teal-500/30";
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
        return "Advance Under Verification";
      case "paid":
        return "Fully Paid";
      case "partial":
        return "Advance Paid";
      default:
        return "Pending";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const canPayRemainingBalance = (booking: Booking) => {
    // Don't show if already uploaded remaining screenshot or fully paid
    if (booking.remaining_screenshot_url) return false;
    if (booking.payment_status === "fully_paid" || booking.payment_status === "balance_pending") return false;
    
    return booking.booking_status === "confirmed" && 
           ["advance_verified", "partial"].includes(booking.payment_status) &&
           booking.total_amount > booking.advance_paid;
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
                            <p className={`font-bold ${balanceAmount > 0 && booking.payment_status !== "fully_paid" ? 'text-amber-600' : 'text-green-600'}`}>
                              {booking.payment_status === "fully_paid" ? "₹0" : `₹${balanceAmount.toLocaleString()}`}
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

                      {/* Pay Remaining Balance Button */}
                      {canPayRemainingBalance(booking) && (
                        <div className="flex justify-center">
                          <Button 
                            onClick={() => setShowPaymentModal(booking)}
                            className="gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Pay Remaining Balance (₹{balanceAmount.toLocaleString()})
                          </Button>
                        </div>
                      )}

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
                      
                      {/* Status Messages */}
                      {booking.booking_status === "pending" && (
                        <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                          <p className="text-sm text-yellow-700 dark:text-yellow-400">
                            Your payment is being verified. We'll confirm your booking shortly.
                          </p>
                        </div>
                      )}

                      {booking.payment_status === "balance_pending" && (
                        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            Your remaining payment screenshot has been submitted. We'll verify it shortly.
                          </p>
                        </div>
                      )}

                      {booking.payment_status === "fully_paid" && (
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
              <h2 className="font-serif text-xl font-bold text-card-foreground">Pay Remaining Balance</h2>
              <p className="text-sm text-muted-foreground">
                ₹{(showPaymentModal.total_amount - showPaymentModal.advance_paid).toLocaleString()} for {showPaymentModal.trip_id}
              </p>
            </div>

            <div className="p-6 space-y-6">
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
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowPaymentModal(null);
                    setScreenshotFile(null);
                    setScreenshotPreview(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  disabled={!screenshotFile || uploadingId === showPaymentModal.id}
                  onClick={() => uploadRemainingScreenshot(showPaymentModal.id)}
                >
                  {uploadingId === showPaymentModal.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Payment
                    </>
                  )}
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

export default MyBookings;