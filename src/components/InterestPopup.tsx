import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, User, Phone, Calendar, MapPin, Sparkles, Mail, CheckCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { openWhatsAppCustom } from "@/lib/whatsapp";

interface InterestPopupProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedTripId?: string | null;
}

interface TripOption {
  trip_id: string;
  trip_name: string;
}

const InterestPopup = ({ isOpen, onClose, preselectedTripId }: InterestPopupProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [submittedData, setSubmittedData] = useState<{name: string; tripName: string; phone: string} | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: user?.email || "",
    mobile: "",
    tripId: preselectedTripId || "",
    preferredDate: "",
  });

  // Fetch trips from database
  useEffect(() => {
    const fetchTrips = async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('trip_id, trip_name')
        .eq('is_active', true)
        .order('trip_name');
      
      if (!error && data) {
        setTrips(data);
      }
    };
    
    if (isOpen) {
      fetchTrips();
      // Update tripId when preselectedTripId changes
      if (preselectedTripId) {
        setFormData(prev => ({ ...prev, tripId: preselectedTripId }));
      }
    }
  }, [isOpen, preselectedTripId]);

  // Auto-close countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showSuccess && countdown > 0) {
      timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    } else if (showSuccess && countdown === 0) {
      handleClose();
    }
    return () => clearTimeout(timer);
  }, [showSuccess, countdown]);

  const handleClose = () => {
    setShowSuccess(false);
    setCountdown(8);
    setSubmittedData(null);
    setFormData({
      name: "",
      email: user?.email || "",
      mobile: "",
      tripId: "",
      preferredDate: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleNotifyWhatsApp = () => {
    if (!submittedData) return;
    
    const message = `Hi Team GoBhraman! 👋

I just registered my interest for *${submittedData.tripName}*.

Name: ${submittedData.name}

Please notify me when bookings open! 🙏

Thank you!`;

    openWhatsAppCustom("919415026522", message);
  };

  const handleViewTrips = () => {
    handleClose();
    navigate("/trips");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      toast({
        title: "Valid Email Required",
        description: "Please enter a valid email so we can contact you.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.tripId) {
      toast({
        title: "Trip Required",
        description: "Please select a journey you're interested in",
        variant: "destructive",
      });
      return;
    }

    // Validate mobile number (10-15 digits)
    const cleanedMobile = formData.mobile.replace(/\D/g, '');
    const mobileRegex = /^\d{10,15}$/;
    if (!mobileRegex.test(cleanedMobile)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid mobile number (10-15 digits)",
        variant: "destructive",
      });
      return;
    }


    setLoading(true);

    try {
      const selectedTrip = trips.find((t) => t.trip_id === formData.tripId);

      // Format phone with + prefix for database validation
      const phoneWithPrefix = cleanedMobile.startsWith("+") ? cleanedMobile : `+${cleanedMobile}`;

      const insertData = {
        user_id: user?.id ?? null,
        full_name: formData.name.trim(),
        email: formData.email.trim(),
        phone: phoneWithPrefix,
        trip_id: formData.tripId,
        preferred_month: formData.preferredDate || null,
        message: `Interested in ${selectedTrip?.trip_name || "trip"}`,
      };

      const { error } = await supabase.from("interested_users").insert(insertData);

      if (error) {
        throw error;
      }

      // Store submitted data for success screen
      setSubmittedData({
        name: formData.name.trim(),
        tripName: selectedTrip?.trip_name || "the trip",
        phone: phoneWithPrefix,
      });

      // Show success screen
      setShowSuccess(true);
      setCountdown(8);
      
    } catch (error: any) {
      console.error("Error submitting interest:", error);
      toast({
        title: "Submission Failed",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (showSuccess && submittedData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-foreground/60 backdrop-blur-sm animate-fade-in"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="relative px-6 py-8 bg-gradient-to-r from-green-500 to-emerald-600 text-center">
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 p-2 rounded-full bg-background/20 hover:bg-background/30 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-white mb-2">
              You're In! 🎉
            </h2>
            <p className="text-white/90 text-sm">
              We'll notify you when bookings open for <strong>{submittedData.tripName}</strong>
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-center text-muted-foreground text-sm">
              Thank you, <strong>{submittedData.name}</strong>! We've saved your interest and will reach out soon.
            </p>
            
            {/* WhatsApp Notification Option */}
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm mb-1">Get notified on WhatsApp</h4>
                  <p className="text-muted-foreground text-xs mb-3">
                    Send us a quick message to ensure you don't miss the booking window!
                  </p>
                  <Button 
                    onClick={handleNotifyWhatsApp} 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Notify Me on WhatsApp
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="flex-1"
              >
                Close ({countdown}s)
              </Button>
              <Button 
                onClick={handleViewTrips}
                className="flex-1"
              >
                View All Trips
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-primary to-accent">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-background/20 hover:bg-background/30 transition-colors"
          >
            <X className="w-4 h-4 text-primary-foreground" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
            <h2 className="font-serif text-xl font-bold text-primary-foreground">
              Get Trip Updates
            </h2>
          </div>
          <p className="text-primary-foreground/80 text-sm">
            Be the first to know when this journey launches
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Label htmlFor="mobile" className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-primary" />
              WhatsApp Number
            </Label>
            <Input
              id="mobile"
              type="tel"
              required
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <Label htmlFor="trip" className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              Journey Interested In
            </Label>
            <Select
              value={formData.tripId}
              onValueChange={(value) => setFormData({ ...formData, tripId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a journey" />
              </SelectTrigger>
              <SelectContent>
                {trips.map((trip) => (
                  <SelectItem key={trip.trip_id} value={trip.trip_id}>
                    {trip.trip_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date" className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              Preferred Month
            </Label>
            <Input
              id="date"
              type="date"
              required
              min={getTomorrowDate()}
              value={formData.preferredDate}
              onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Count Me In"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default InterestPopup;
