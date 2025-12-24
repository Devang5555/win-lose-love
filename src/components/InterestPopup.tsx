import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, User, Phone, Calendar, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface InterestPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TripOption {
  trip_id: string;
  trip_name: string;
}

const InterestPopup = ({ isOpen, onClose }: InterestPopupProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    tripId: "",
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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate mobile number (10-15 digits)
    const mobileRegex = /^\d{10,15}$/;
    if (!mobileRegex.test(formData.mobile.replace(/\D/g, ''))) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid mobile number (10-15 digits)",
        variant: "destructive",
      });
      return;
    }

    // Require user to be logged in
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to submit your interest.",
        variant: "destructive",
      });
      onClose();
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      const selectedTrip = trips.find(t => t.trip_id === formData.tripId);
      
      const { error } = await supabase.from("interested_users").insert({
        user_id: user.id,
        full_name: formData.name,
        email: user.email || "",
        phone: formData.mobile.replace(/\D/g, ''),
        trip_id: formData.tripId,
        preferred_month: formData.preferredDate,
        message: `Interested in ${selectedTrip?.trip_name || "trip"}`,
      });

      if (error) throw error;

      toast({
        title: "You're in!",
        description: "We'll reach out with updates on this journey.",
      });
      onClose();
    } catch (error) {
      console.error("Error submitting interest:", error);
      toast({
        title: "Submission Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
