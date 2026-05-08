import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, User, Mail, Phone, Users, Calendar, CreditCard, Upload, MessageCircle, AlertTriangle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { generateUpiQrString, getMerchantUpiId } from "@/lib/upi";

interface ExperienceSlot {
  id: string;
  batch_name: string;
  start_date: string;
  end_date: string;
  batch_size: number;
  available_seats: number;
}

interface PricingTier {
  label: string;
  price: number;
  description?: string;
}

interface ExperienceBookingModalProps {
  experienceId: string;
  experienceName: string;
  duration?: string;
  pricePerPerson: number;
  selectedTier?: PricingTier | null;
  selectedSlot: ExperienceSlot | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const ExperienceBookingModal = ({
  experienceId,
  experienceName,
  duration,
  pricePerPerson,
  selectedTier,
  selectedSlot,
  isOpen,
  onClose,
}: ExperienceBookingModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
    travelers: "1",
    upiTransactionId: "",
    whatsappOptin: true,
  });

  if (!isOpen) return null;

  const totalPrice = pricePerPerson * parseInt(formData.travelers || "1");
  const seatsLeft = selectedSlot?.available_seats ?? 0;
  const maxTravelers = Math.min(8, Math.max(1, seatsLeft));

  const resetAll = () => {
    setStep(1);
    setBookingId(null);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setFormData({ name: "", email: user?.email || "", phone: "", travelers: "1", upiTransactionId: "", whatsappOptin: true });
  };

  const handleClose = (force = false) => {
    // Protect payment session: if user is on the QR/Proof step, confirm before closing
    if (!force && (step === 2 || step === 3)) {
      const ok = window.confirm(
        "Your payment session is active. If you've already paid, please upload the screenshot to confirm your booking.\n\nClose anyway?"
      );
      if (!ok) return;
    }
    resetAll();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadScreenshot = async (): Promise<string | null> => {
    if (!screenshotFile || !user) return null;
    const ext = screenshotFile.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("payment-screenshots").upload(fileName, screenshotFile);
    if (error) {
      console.error("Upload failed:", error);
      return null;
    }
    return fileName;
  };

  // Step 1 → 2: create booking row (initiated)
  const createBooking = async () => {
    if (!user || !selectedSlot) return;
    setLoading(true);
    try {
      const tierNote = selectedTier ? `Option: ${selectedTier.label}` : null;
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          trip_id: experienceId,
          batch_id: selectedSlot.id,
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          num_travelers: parseInt(formData.travelers),
          total_amount: totalPrice,
          advance_paid: 0,
          payment_status: "pending",
          booking_status: "initiated",
          whatsapp_optin: formData.whatsappOptin,
          notes: tierNote,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (formData.whatsappOptin && formData.phone) {
        await supabase
          .from("whatsapp_consents")
          .upsert(
            { user_id: user.id, phone: formData.phone, opted_in: true, source: "booking" },
            { onConflict: "user_id,phone" }
          );
      }

      setBookingId(data.id);
      setStep(2);
    } catch (err: any) {
      toast({ title: "Booking failed", description: err?.message || "Try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: upload + confirm
  const confirmBooking = async () => {
    if (!bookingId) return;
    if (!screenshotFile) {
      toast({ title: "Screenshot required", description: "Upload your payment proof", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const screenshotUrl = await uploadScreenshot();
      const tierNote = selectedTier ? `Option: ${selectedTier.label}` : "";
      const txnNote = formData.upiTransactionId ? `UPI Txn: ${formData.upiTransactionId}` : "";
      const combinedNotes = [tierNote, txnNote].filter(Boolean).join(" | ") || null;

      // Experience flow: save proof, mark pending verification.
      // Seats are deducted only when admin approves (via RPC in admin panel).
      const { error: updErr } = await supabase
        .from("bookings")
        .update({
          advance_paid: totalPrice, // FULL payment for experiences
          advance_screenshot_url: screenshotUrl,
          payment_status: "pending_advance",
          booking_status: "pending",
          notes: combinedNotes,
        })
        .eq("id", bookingId);
      if (updErr) throw updErr;

      // Fire-and-forget WhatsApp notifications (admin + user) via Meta Cloud API
      try {
        await supabase.functions.invoke("send-booking-notification", {
          body: { booking_id: bookingId },
        });
      } catch (e) {
        console.warn("notification failed", e);
      }

      // Send confirmation email to the user (best-effort)
      try {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "experience-booking-received",
            recipientEmail: formData.email,
            idempotencyKey: `exp-booking-${bookingId}`,
            templateData: {
              name: formData.name,
              experienceName,
              guests: parseInt(formData.travelers),
              amount: totalPrice,
              bookingId,
              tier: selectedTier?.label || null,
            },
          },
        });
      } catch (e) {
        console.warn("email send failed", e);
      }

      toast({
        title: "🎉 Payment proof submitted successfully!",
        description: "Team GoBhraman is verifying your booking — confirmation will be shared shortly on WhatsApp.",
      });
      handleClose(true);
      navigate(`/my-bookings`);
    } catch (err: any) {
      toast({ title: "Booking failed", description: err?.message || "Try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!user) {
        toast({ title: "Login required", variant: "destructive" });
        navigate("/auth");
        return;
      }
      if (!selectedSlot) {
        toast({ title: "Pick a date", description: "Select a slot first", variant: "destructive" });
        return;
      }
      createBooking();
    } else if (step === 2) {
      setStep(3);
    } else {
      confirmBooking();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm animate-fade-in" onClick={() => handleClose()} />
      <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-xl overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="relative px-6 py-4 border-b border-border">
          <button type="button" onClick={() => handleClose()} className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <h2 className="font-serif text-xl font-bold text-card-foreground pr-8">Book: {experienceName}</h2>
          <p className="text-sm text-muted-foreground">
            {duration} • ₹{pricePerPerson.toLocaleString()}/person
          </p>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex-1 h-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              {selectedSlot ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-primary uppercase mb-1">Your Slot</p>
                  <p className="font-semibold text-card-foreground">{selectedSlot.batch_name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    {formatDate(selectedSlot.start_date)}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    {selectedTier && (
                      <span className="text-xs text-muted-foreground">{selectedTier.label}</span>
                    )}
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {seatsLeft} {seatsLeft === 1 ? "seat" : "seats"} left
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <p className="text-sm text-destructive">Please select a slot first.</p>
                </div>
              )}

              <div>
                <Label className="flex items-center gap-2 mb-2"><User className="w-4 h-4 text-primary" />Full Name</Label>
                <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Your full name" />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2"><Mail className="w-4 h-4 text-primary" />Email</Label>
                <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="you@email.com" />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2"><Phone className="w-4 h-4 text-primary" />Phone</Label>
                <Input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-primary" />Guests</Label>
                <Select value={formData.travelers} onValueChange={(v) => setFormData({ ...formData, travelers: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxTravelers }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? "Guest" : "Guests"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {seatsLeft <= 3 && seatsLeft > 0 && (
                  <p className="text-xs text-destructive mt-1">Only {seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} left!</p>
                )}
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                <Checkbox id="wa-opt" checked={formData.whatsappOptin} onCheckedChange={(c) => setFormData({ ...formData, whatsappOptin: !!c })} className="mt-0.5" />
                <Label htmlFor="wa-opt" className="text-sm text-muted-foreground cursor-pointer">
                  <MessageCircle className="w-4 h-4 inline mr-1 text-green-600" />
                  Get confirmation & reminders on WhatsApp
                </Label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium text-card-foreground mb-3">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Per person</span><span>₹{pricePerPerson.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Guests</span><span>× {formData.travelers}</span></div>
                  <div className="flex justify-between pt-2 border-t border-border font-bold">
                    <span>Total (Pay Now)</span>
                    <span className="text-primary text-lg">₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">Full payment confirms your spot instantly.</p>
                </div>
              </div>

              <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                <h4 className="font-medium text-card-foreground mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />Pay via UPI
                </h4>
                <div className="flex flex-col items-center text-center">
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                    <QRCodeSVG
                      value={generateUpiQrString({ amount: totalPrice, transactionNote: `GoBhraman ${experienceName}` })}
                      size={180}
                      level="M"
                      includeMargin
                    />
                  </div>
                  <p className="font-mono text-sm text-primary font-bold">{getMerchantUpiId()}</p>
                  <p className="text-lg text-foreground font-semibold mt-2">Pay ₹{totalPrice.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Scan with GPay, PhonePe, Paytm or any UPI app</p>
                </div>
              </div>

              <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                <p className="text-sm text-accent-foreground">
                  <strong>Done paying?</strong> Tap <em>"I Have Completed Payment"</em> below to upload your screenshot. Your booking is held until proof is submitted.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-sm">UPI Transaction ID (Optional)</Label>
                <Input value={formData.upiTransactionId} onChange={(e) => setFormData({ ...formData, upiTransactionId: e.target.value })} placeholder="Transaction ID" />
              </div>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                {screenshotPreview ? (
                  <div className="space-y-3">
                    <img src={screenshotPreview} alt="Payment" className="max-h-48 mx-auto rounded-lg" />
                    <Button type="button" variant="outline" size="sm" onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}>
                      Remove & Upload New
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-card-foreground">Click to upload screenshot</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </div>
                  </label>
                )}
              </div>
              <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Booking confirms instantly after upload. Our team will verify the payment shortly.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>Back</Button>
            )}
            <Button type="submit" className="flex-1" disabled={loading || (step === 1 && !selectedSlot)}>
              {loading ? "Processing…" : step === 1 ? "Continue to Pay" : step === 2 ? "I've Paid" : "Confirm Booking"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExperienceBookingModal;
