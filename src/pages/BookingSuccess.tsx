import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle, Calendar, Users, MapPin, CreditCard, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/data/trips";

interface BookingDetails {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  trip_id: string;
  num_travelers: number;
  total_amount: number;
  advance_paid: number;
  pickup_location: string | null;
  booking_status: string;
  payment_status: string;
  created_at: string;
  batch_id: string | null;
}

interface BatchInfo {
  batch_name: string;
  start_date: string;
  end_date: string;
}

const BookingSuccess = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [batch, setBatch] = useState<BatchInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchBooking = async () => {
      if (!bookingId) return;

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        console.error("Failed to fetch booking:", error);
        setLoading(false);
        return;
      }

      setBooking(data as BookingDetails);

      if (data.batch_id) {
        const { data: batchData } = await supabase
          .from("batches")
          .select("batch_name, start_date, end_date")
          .eq("id", data.batch_id)
          .maybeSingle();

        if (batchData) setBatch(batchData);
      }

      setLoading(false);
    };

    fetchBooking();
  }, [bookingId, user, authLoading, navigate]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <p className="text-muted-foreground">Loading booking details…</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-4">Booking Not Found</h1>
          <p className="text-muted-foreground mb-8">We couldn't find this booking.</p>
          <Button asChild>
            <Link to="/my-bookings">View My Bookings</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const remainingAmount = booking.total_amount - booking.advance_paid;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Success Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">
              Booking Confirmed!
            </h1>
            <p className="text-muted-foreground text-lg">
              Thank you, {booking.full_name}! Your spot has been reserved.
            </p>
          </div>

          {/* Booking Details Card */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8 mb-6">
            <h2 className="font-serif text-xl font-semibold text-card-foreground mb-6">
              Booking Summary
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Trip</p>
                  <p className="font-medium text-card-foreground">{booking.trip_id}</p>
                </div>
              </div>

              {batch && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Batch</p>
                    <p className="font-medium text-card-foreground">
                      {batch.batch_name} ({formatDate(batch.start_date)} – {formatDate(batch.end_date)})
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Travelers</p>
                  <p className="font-medium text-card-foreground">
                    {booking.num_travelers} {booking.num_travelers === 1 ? "person" : "people"}
                  </p>
                </div>
              </div>

              {booking.pickup_location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pickup</p>
                    <p className="font-medium text-card-foreground capitalize">{booking.pickup_location}</p>
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-4 mt-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Amount</span>
                      <span className="font-semibold text-card-foreground">{formatPrice(booking.total_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Advance Paid</span>
                      <span className="font-medium text-primary">{formatPrice(booking.advance_paid)}</span>
                    </div>
                    {remainingAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Remaining Balance</span>
                        <span className="text-sm text-muted-foreground">{formatPrice(remainingAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Note */}
          <div className="bg-primary/10 rounded-xl p-5 border border-primary/20 mb-8">
            <p className="text-sm text-primary font-medium">
              ✨ Your payment screenshot is under verification. We'll confirm within 2-4 hours during business hours and notify you at <strong>{booking.email}</strong>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link to="/my-bookings">
                View My Bookings
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to="/trips">Explore More Trips</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BookingSuccess;
