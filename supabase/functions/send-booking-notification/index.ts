import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { booking_id } = await req.json();
    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: "booking_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, full_name, trip_id, num_travelers, total_amount, advance_paid, phone, pickup_location, batch_id")
      .eq("id", booking_id)
      .maybeSingle();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch batch info if available
    let batchInfo = "";
    if (booking.batch_id) {
      const { data: batch } = await supabase
        .from("batches")
        .select("batch_name, start_date, end_date")
        .eq("id", booking.batch_id)
        .maybeSingle();

      if (batch) {
        const startDate = new Date(batch.start_date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const endDate = new Date(batch.end_date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        batchInfo = `\n📅 Batch: ${batch.batch_name} (${startDate} – ${endDate})`;
      }
    }

    const remainingAmount = booking.total_amount - booking.advance_paid;

    // Build WhatsApp message
    const message = [
      `🎉 *Booking Confirmed — GoBhraman*`,
      ``,
      `Hi ${booking.full_name}! Your spot has been reserved.`,
      ``,
      `🧳 *Trip:* ${booking.trip_id}`,
      `👥 *Travelers:* ${booking.num_travelers}`,
      booking.pickup_location ? `📍 *Pickup:* ${booking.pickup_location}` : null,
      batchInfo || null,
      ``,
      `💰 *Total:* ₹${booking.total_amount.toLocaleString()}`,
      `✅ *Advance Paid:* ₹${booking.advance_paid.toLocaleString()}`,
      remainingAmount > 0
        ? `⏳ *Remaining:* ₹${remainingAmount.toLocaleString()} (pay before departure)`
        : `✅ *Fully Paid*`,
      ``,
      `Your advance payment is under verification. We'll confirm within 2-4 hours.`,
      ``,
      `For queries, reply here or call +91-9415026522`,
      `— Team GoBhraman 🌊`,
    ]
      .filter(Boolean)
      .join("\n");

    // Build WhatsApp link for the user's phone
    const cleanPhone = booking.phone.replace(/[^0-9]/g, "");
    const phone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    // Also build admin notification message
    const adminMessage = [
      `📋 *New Booking Alert*`,
      ``,
      `👤 *Name:* ${booking.full_name}`,
      `📞 *Phone:* ${booking.phone}`,
      `🧳 *Trip:* ${booking.trip_id}`,
      `👥 *Travelers:* ${booking.num_travelers}`,
      booking.pickup_location ? `📍 *Pickup:* ${booking.pickup_location}` : null,
      batchInfo || null,
      `💰 *Total:* ₹${booking.total_amount.toLocaleString()}`,
      `✅ *Advance:* ₹${booking.advance_paid.toLocaleString()}`,
      ``,
      `🔗 Booking ID: ${booking.id}`,
    ]
      .filter(Boolean)
      .join("\n");

    const adminWhatsappUrl = `https://wa.me/919415026522?text=${encodeURIComponent(adminMessage)}`;

    return new Response(
      JSON.stringify({
        success: true,
        user_whatsapp_url: whatsappUrl,
        admin_whatsapp_url: adminWhatsappUrl,
        message: "WhatsApp notification links generated",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
