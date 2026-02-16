import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, User, Mail, Phone, Users, Calendar, CreditCard, CheckCircle, Upload, MessageCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Trip, getTripPrice, formatPrice } from "@/data/trips";
import { calculateDynamicPrice } from "@/lib/dynamicPricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { generateUpiQrString, getMerchantUpiId } from "@/lib/upi";

interface Batch {
  id: string;
  trip_id: string;
  batch_name: string;
  start_date: string;
  end_date: string;
  batch_size: number;
  seats_booked: number;
  available_seats: number | null;
  status: string;
}

interface BookingModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal = ({ trip, isOpen, onClose }: BookingModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    travelers: "1",
    pickupPoint: "mumbai",
    batchId: "",
    upiTransactionId: "",
    whatsappOptin: false,
  });

  // Fetch available batches for this trip
  useEffect(() => {
    const fetchBatches = async () => {
      const { data } = await supabase
        .from("batches")
        .select("*")
        .eq("trip_id", trip.tripId)
        .eq("status", "active")
        .order("start_date", { ascending: true });
      
      if (data) {
        // Filter out full batches using available_seats
        const availableBatches = data.filter(b => (b.available_seats ?? (b.batch_size - b.seats_booked)) > 0);
        setBatches(availableBatches);
      }
    };

    if (isOpen) {
      fetchBatches();
      setBookingId(null);
    }
  }, [trip.tripId, isOpen]);

  if (!isOpen) return null;

  const hasMultiplePrices = typeof trip.price === 'object' && trip.price.fromPune;
  const selectedBasePrice = hasMultiplePrices && typeof trip.price === 'object'
    ? (formData.pickupPoint === 'pune' ? trip.price.fromPune! : trip.price.default)
    : getTripPrice(trip);
  
  // Calculate dynamic price if a batch is selected
  const selectedBatch = batches.find(b => b.id === formData.batchId);
  const selectedPrice = (() => {
    if (selectedBatch) {
      const dp = calculateDynamicPrice(
        selectedBasePrice,
        selectedBatch.batch_size,
        selectedBatch.available_seats ?? (selectedBatch.batch_size - selectedBatch.seats_booked),
        selectedBatch.start_date,
      );
      return dp.effectivePrice;
    }
    return selectedBasePrice;
  })();

  const totalPrice = selectedPrice * parseInt(formData.travelers);
  const advanceAmount = trip.booking?.advance || 2000;
  const totalAdvance = advanceAmount * parseInt(formData.travelers);
  const remainingAmount = totalPrice - totalAdvance;

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

  const uploadScreenshot = async (): Promise<string | null> => {
    if (!screenshotFile || !user) return null;

    const fileExt = screenshotFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('payment-screenshots')
      .upload(fileName, screenshotFile);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    return fileName;
  };

  // Step 1 → 2: Create booking record with 'initiated' status before showing payment
  const createBookingRecord = async (): Promise<string | null> => {
    if (!user) return null;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          trip_id: trip.tripId,
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          pickup_location: formData.pickupPoint,
          num_travelers: parseInt(formData.travelers),
          total_amount: totalPrice,
          advance_paid: 0,
          batch_id: formData.batchId || null,
          payment_status: "pending",
          booking_status: "initiated",
          whatsapp_optin: formData.whatsappOptin,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Save WhatsApp consent if opted in
      if (formData.whatsappOptin && formData.phone) {
        await supabase.from("whatsapp_consents").upsert({
          user_id: user.id,
          phone: formData.phone,
          opted_in: true,
          source: "booking",
        }, { onConflict: "user_id,phone" }).then(() => {});
      }
      return data.id;
    } catch (error: any) {
      console.error('Booking creation error:', error);
      toast({
        title: "Booking Failed",
        description: error?.message || "Could not create booking. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Step 3: After screenshot upload, confirm booking via RPC
  const confirmBookingWithPayment = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      // Upload screenshot first
      const screenshotUrl = await uploadScreenshot();

      // Update booking with screenshot and advance info
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          advance_paid: totalAdvance,
          advance_screenshot_url: screenshotUrl,
          payment_status: "pending_advance",
          notes: formData.upiTransactionId ? `UPI: ${formData.upiTransactionId}` : null,
        })
        .eq("id", bookingId);

      if (updateError) throw updateError;

      // Call RPC to atomically confirm booking and deduct seats
      const { error: rpcError } = await supabase.rpc(
        'confirm_booking_after_payment',
        { p_booking_id: bookingId }
      );

      if (rpcError) {
        console.error('RPC error:', rpcError);
        toast({
          title: "Seats Unavailable",
          description: "Seats sold out or unavailable. Please try a different batch.",
          variant: "destructive",
        });
        return;
      }

      // Trigger WhatsApp notification (fire-and-forget)
      try {
        const { data: notifData } = await supabase.functions.invoke(
          'send-booking-notification',
          { body: { booking_id: bookingId } }
        );
        // Open admin WhatsApp notification in background
        if (notifData?.admin_whatsapp_url) {
          window.open(notifData.admin_whatsapp_url, '_blank');
        }
      } catch (notifErr) {
        console.warn('WhatsApp notification failed (non-blocking):', notifErr);
      }

      toast({
        title: "Booking Confirmed!",
        description: "Your spot has been reserved. Redirecting…",
      });
      handleClose();
      navigate(`/booking-success/${bookingId}`);
    } catch (error: any) {
      console.error('Booking confirmation error:', error);
      toast({
        title: "Booking Failed",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!user) {
        toast({
          title: "Login Required",
          description: "Please login to book this trip.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Create booking record before proceeding to payment
      const newBookingId = await createBookingRecord();
      if (!newBookingId) return;
      setBookingId(newBookingId);
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      // Step 3: Submit screenshot and confirm via RPC
      if (!screenshotFile) {
        toast({
          title: "Screenshot Required",
          description: "Please upload your payment screenshot",
          variant: "destructive",
        });
        return;
      }

      await confirmBookingWithPayment();
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      name: "",
      email: "",
      phone: "",
      travelers: "1",
      pickupPoint: "mumbai",
      batchId: "",
      upiTransactionId: "",
      whatsappOptin: false,
    });
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setBookingId(null);
    onClose();
  };

  const formatBatchDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-xl overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-border">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <h2 className="font-serif text-xl font-bold text-card-foreground pr-8">
            {step === 4 ? "Booking Submitted!" : `Book: ${trip.tripName}`}
          </h2>
          <p className="text-sm text-muted-foreground">{trip.duration} • {formatPrice(selectedPrice)}/person</p>
          
          {/* Progress Steps */}
          {step < 4 && (
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    s <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 4 ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-card-foreground mb-2">
                Thank You, {formData.name}!
              </h3>
              <p className="text-muted-foreground mb-6">
                Your booking has been submitted. We'll verify your payment and send a confirmation to {formData.email}.
              </p>
              <div className="bg-muted rounded-lg p-4 text-left mb-6">
                <p className="text-sm font-medium text-card-foreground mb-2">Booking Summary</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Trip: {trip.tripName}</p>
                  <p>Travelers: {formData.travelers}</p>
                  <p>Pickup: {formData.pickupPoint === 'pune' ? 'Pune' : 'Mumbai'}</p>
                  <p className="font-medium text-card-foreground">
                    Total: {formatPrice(totalPrice)}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Close
                </Button>
                <Button onClick={() => navigate("/my-bookings")} className="flex-1">
                  View My Bookings
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-primary" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-primary" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-primary" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  {/* Batch Selection - moved before travelers */}
                  {batches.length > 0 && (
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Select Batch
                      </Label>
                      <Select
                        value={formData.batchId}
                        onValueChange={(value) => {
                          const selectedBatch = batches.find(b => b.id === value);
                          const availableSeats = selectedBatch ? (selectedBatch.available_seats ?? (selectedBatch.batch_size - selectedBatch.seats_booked)) : 10;
                          // Reset travelers to 1 if current selection exceeds available seats
                          const newTravelers = parseInt(formData.travelers) > availableSeats ? "1" : formData.travelers;
                          setFormData({ ...formData, batchId: value, travelers: newTravelers });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your travel dates" />
                        </SelectTrigger>
                        <SelectContent>
                          {batches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.batch_name} ({formatBatchDate(batch.start_date)} - {formatBatchDate(batch.end_date)}) - {batch.available_seats ?? (batch.batch_size - batch.seats_booked)} seats left
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="travelers" className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-primary" />
                        Travelers
                      </Label>
                      {(() => {
                        const selectedBatch = batches.find(b => b.id === formData.batchId);
                        const maxTravelers = selectedBatch 
                          ? Math.min(10, selectedBatch.available_seats ?? (selectedBatch.batch_size - selectedBatch.seats_booked))
                          : 10;
                        return (
                          <Select
                            value={formData.travelers}
                            onValueChange={(value) => setFormData({ ...formData, travelers: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: maxTravelers }, (_, i) => i + 1).map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num} {num === 1 ? 'Person' : 'People'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      })()}
                      {formData.batchId && (() => {
                        const selectedBatch = batches.find(b => b.id === formData.batchId);
                        const availableSeats = selectedBatch ? (selectedBatch.available_seats ?? (selectedBatch.batch_size - selectedBatch.seats_booked)) : 0;
                        return availableSeats <= 3 && (
                          <p className="text-xs text-amber-600 mt-1">Only {availableSeats} seat{availableSeats !== 1 ? 's' : ''} left!</p>
                        );
                      })()}
                    </div>

                    {hasMultiplePrices && (
                      <div>
                        <Label htmlFor="pickup" className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          Pickup Point
                        </Label>
                        <Select
                          value={formData.pickupPoint}
                          onValueChange={(value) => setFormData({ ...formData, pickupPoint: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mumbai">Mumbai ({formatPrice(typeof trip.price === 'object' ? trip.price.default : 0)})</SelectItem>
                            <SelectItem value="pune">Pune ({formatPrice(typeof trip.price === 'object' ? trip.price.fromPune! : 0)})</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Opt-in */}
                  <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                    <Checkbox
                      id="whatsapp-optin"
                      checked={formData.whatsappOptin}
                      onCheckedChange={(checked) => setFormData({ ...formData, whatsappOptin: !!checked })}
                      className="mt-0.5"
                    />
                    <Label htmlFor="whatsapp-optin" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                      <MessageCircle className="w-4 h-4 inline mr-1 text-green-600" />
                      Get trip updates & reminders on WhatsApp
                    </Label>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium text-card-foreground mb-3">Payment Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price per person</span>
                        <span className="text-card-foreground">{formatPrice(selectedPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Travelers</span>
                        <span className="text-card-foreground">× {formData.travelers}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-border font-medium">
                        <span className="text-card-foreground">Total Amount</span>
                        <span className="text-primary text-lg">{formatPrice(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Advance to pay now</span>
                        <span className="text-accent font-medium">{formatPrice(totalAdvance)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Remaining (pay later)</span>
                        <span className="text-muted-foreground">{formatPrice(remainingAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                    <h4 className="font-medium text-card-foreground mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      Pay via UPI
                    </h4>
                    
                    {/* Dynamic QR Code Section */}
                    <div className="flex flex-col items-center text-center">
                      <p className="text-xs text-muted-foreground mb-2">Scan & Pay via any UPI App</p>
                      <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                        <QRCodeSVG
                          value={generateUpiQrString({
                            amount: totalAdvance,
                            transactionNote: `GoBhraman ${trip.tripName}`,
                          })}
                          size={180}
                          level="M"
                          includeMargin={true}
                        />
                      </div>
                      <p className="font-mono text-sm text-primary font-bold">{getMerchantUpiId()}</p>
                      <p className="text-lg text-foreground font-semibold mt-2">
                        Pay ₹{totalAdvance.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Scan QR with Google Pay, PhonePe, Paytm or any UPI app
                      </p>
                    </div>

                    {trip.booking?.bank && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Or pay via Bank Transfer:</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p><strong>Name:</strong> {trip.booking.bank.name}</p>
                          <p><strong>A/C:</strong> {trip.booking.bank.accountNumber}</p>
                          <p><strong>IFSC:</strong> {trip.booking.bank.ifsc}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                    <p className="text-sm text-accent-foreground">
                      <strong>Next Step:</strong> After completing the payment in your UPI app, click "I've Made the Payment" below to upload your payment screenshot for verification.
                    </p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-primary/10 rounded-lg p-4 border border-primary/20 mb-4">
                    <p className="text-sm text-primary font-medium">
                      If payment is completed, please upload the payment screenshot for verification.
                    </p>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-medium text-card-foreground mb-2">Upload Payment Screenshot</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a clear screenshot showing the payment confirmation from your UPI app.
                    </p>
                    
                    <div>
                      <Label htmlFor="upiId" className="mb-2 block text-sm">
                        UPI Transaction ID (Optional)
                      </Label>
                      <Input
                        id="upiId"
                        value={formData.upiTransactionId}
                        onChange={(e) => setFormData({ ...formData, upiTransactionId: e.target.value })}
                        placeholder="Enter transaction ID"
                        className="mb-4"
                      />
                    </div>

                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      {screenshotPreview ? (
                        <div className="space-y-3">
                          <img
                            src={screenshotPreview}
                            alt="Payment Screenshot"
                            className="max-h-48 mx-auto rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setScreenshotFile(null);
                              setScreenshotPreview(null);
                            }}
                          >
                            Remove & Upload New
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <div className="space-y-2">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                              <Upload className="w-6 h-6 text-primary" />
                            </div>
                            <p className="text-sm font-medium text-card-foreground">
                              Click to upload screenshot
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG up to 5MB
                            </p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      <strong>Note:</strong> Your booking will be confirmed after we verify your payment. This usually takes 2-4 hours during business hours.
                    </p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex gap-3 mt-6">
                {step > 1 && step < 4 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </Button>
                )}
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Submitting..." : step === 1 ? "Continue" : step === 2 ? "I've Made the Payment" : "Submit Booking"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
