import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import InvoiceView from "@/components/InvoiceView";

const Invoice = () => {
  const { bookingId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const [tripName, setTripName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !bookingId) return;

    const fetchBooking = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (error || !data) {
        navigate("/my-bookings");
        return;
      }

      setBooking(data);

      // Fetch trip name
      const { data: trip } = await supabase
        .from("trips")
        .select("trip_name")
        .eq("trip_id", data.trip_id)
        .single();
      if (trip) setTripName(trip.trip_name);

      // Fetch batch info
      if (data.batch_id) {
        const { data: batch } = await supabase
          .from("batches")
          .select("batch_name, start_date, end_date")
          .eq("id", data.batch_id)
          .single();
        if (batch) setBatchInfo(batch);
      }

      setLoading(false);
    };

    fetchBooking();
  }, [user, bookingId, navigate]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <InvoiceView booking={booking} batchInfo={batchInfo} tripName={tripName} />
    </div>
  );
};

export default Invoice;
