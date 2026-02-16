import { useState, useEffect, useCallback } from "react";
import { X, Gift, Sparkles, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDestinations } from "@/hooks/useDestinations";

const SESSION_KEY = "gb_exit_popup_shown";

const ExitIntentPopup = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { destinations } = useDestinations();
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    destination: "",
  });

  const showPopup = useCallback(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    setIsOpen(true);
    sessionStorage.setItem(SESSION_KEY, "1");
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Desktop: mouse leaves viewport toward top
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) {
        showPopup();
      }
    };

    // Mobile: rapid scroll up (track scroll delta)
    let lastScrollY = window.scrollY;
    let rapidScrollCount = 0;

    const handleScroll = () => {
      const delta = lastScrollY - window.scrollY;
      if (delta > 80) {
        rapidScrollCount++;
        if (rapidScrollCount >= 2) {
          showPopup();
        }
      } else {
        rapidScrollCount = 0;
      }
      lastScrollY = window.scrollY;
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [showPopup]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast({ title: "Required", description: "Name and email are required.", variant: "destructive" });
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast({ title: "Invalid Email", description: "Please enter a valid email.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("leads").insert({
        name: formData.name.trim().slice(0, 100),
        email: formData.email.trim().toLowerCase().slice(0, 255),
        phone: formData.phone.trim().slice(0, 15) || null,
        source: "popup",
        destination_interest: formData.destination || null,
        user_id: user?.id || null,
      });

      if (error) {
        if (error.code === "23505") {
          // Duplicate email
          toast({ title: "Already Registered", description: "This email is already in our system. You'll hear from us soon!" });
          setSubmitted(true);
          return;
        }
        throw error;
      }

      setSubmitted(true);
      toast({ title: "Welcome! 🎉", description: "You've been added. ₹300 travel credit will be applied to your first booking!" });
    } catch (err: any) {
      console.error("Lead capture error:", err);
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm animate-fade-in" onClick={handleClose} />
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden animate-scale-in">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-primary via-ocean-dark to-accent px-6 py-8 text-center relative">
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
          >
            <X className="w-4 h-4 text-primary-foreground" />
          </button>
          <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-primary-foreground mb-2">
            Wait! Don't Go Yet 🎁
          </h2>
          <p className="text-primary-foreground/90 text-sm">
            Get <span className="font-bold text-lg">₹300 travel credit</span> + exclusive early access to upcoming trips!
          </p>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-4">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="font-serif text-xl font-bold text-card-foreground mb-2">You're In! 🎉</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Your ₹300 travel credit will be applied when you sign up and make your first booking.
              </p>
              <Button onClick={handleClose} className="w-full">
                Explore Trips
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="exit-name" className="text-sm font-medium">Name *</Label>
                <Input
                  id="exit-name"
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="exit-email" className="text-sm font-medium">Email *</Label>
                <Input
                  id="exit-email"
                  type="email"
                  required
                  maxLength={255}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <Label htmlFor="exit-phone" className="text-sm font-medium">
                  WhatsApp Number <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="exit-phone"
                  type="tel"
                  maxLength={15}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <Label className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Preferred Destination <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Select value={formData.destination} onValueChange={(v) => setFormData({ ...formData, destination: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((d) => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Submitting..." : "Claim ₹300 Credit"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                No spam, ever. Just travel inspiration & exclusive deals.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExitIntentPopup;
