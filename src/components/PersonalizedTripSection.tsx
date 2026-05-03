import { useState } from "react";
import { Users, Heart, Briefcase, GraduationCap, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "919415026522";

const TRIP_TYPES = [
  { id: "Women-Only Trips", label: "Women-Only", icon: Heart },
  { id: "Family Trips", label: "Family", icon: Users },
  { id: "Corporate Trips", label: "Corporate", icon: Briefcase },
  { id: "College Group Trips", label: "College Group", icon: GraduationCap },
  { id: "Custom Travel Experience", label: "Custom", icon: Sparkles },
];

const PersonalizedTripSection = () => {
  const [tripType, setTripType] = useState<string>("Custom Travel Experience");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    destination: "",
    dates: "",
    people: "",
  });

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Please fill in your name and phone number");
      return;
    }

    const message = `Hi GoBhraman! 👋 I'd like to plan a personalized trip.

*Name:* ${form.name}
*Phone:* ${form.phone}
*Trip Type:* ${tripType}
*Destination:* ${form.destination || "Open to suggestions"}
*Dates:* ${form.dates || "Flexible"}
*Number of People:* ${form.people || "TBD"}

Please help me plan this trip. Thanks!`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    toast.success("Opening WhatsApp with your trip details...");
  };

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-primary font-bold text-sm uppercase tracking-wider">Made For You</span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2">
            Plan Your Personalized Trip
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Tell us your preferences and we'll create a perfect trip for you
          </p>
        </div>

        {/* Trip type cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto mb-8">
          {TRIP_TYPES.map((type) => {
            const Icon = type.icon;
            const isActive = tripType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setTripType(type.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 text-center",
                  isActive
                    ? "border-primary bg-primary/5 shadow-card-hover -translate-y-0.5"
                    : "border-border bg-card hover:border-primary/40 hover:-translate-y-0.5"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs md:text-sm font-semibold text-card-foreground leading-tight">
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-card p-6 md:p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pt-name">Name *</Label>
              <Input id="pt-name" placeholder="Your name" value={form.name} onChange={handleChange("name")} maxLength={100} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pt-phone">Phone *</Label>
              <Input id="pt-phone" type="tel" placeholder="10-digit number" value={form.phone} onChange={handleChange("phone")} maxLength={15} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pt-destination">Destination</Label>
              <Input id="pt-destination" placeholder="e.g. Manali, Goa" value={form.destination} onChange={handleChange("destination")} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pt-dates">Dates</Label>
              <Input id="pt-dates" placeholder="e.g. 15–20 Jan" value={form.dates} onChange={handleChange("dates")} maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pt-people">Number of People</Label>
              <Input id="pt-people" type="number" min={1} placeholder="e.g. 4" value={form.people} onChange={handleChange("people")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pt-type">Trip Type</Label>
              <Select value={tripType} onValueChange={setTripType}>
                <SelectTrigger id="pt-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIP_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full mt-6 font-bold text-base">
            <Send className="w-4 h-4 mr-2" />
            Get My Trip Plan
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            We'll connect with you on WhatsApp within minutes
          </p>
        </form>
      </div>
    </section>
  );
};

export default PersonalizedTripSection;
