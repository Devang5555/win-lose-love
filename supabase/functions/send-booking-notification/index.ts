import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";
const ADMIN_PHONE = "919415026522";

async function sendWhatsAppText(toPhone: string, body: string) {
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  if (!phoneId || !token) {
    return { ok: false, error: "WhatsApp not configured" };
  }
  try {
    const res = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toPhone,
        type: "text",
        text: { body, preview_url: false },
      }),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: json };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const apiKey = req.headers.get("apikey");

    // Allow either a logged-in user (Bearer JWT) OR a valid apikey (anon/service)
    if (!authHeader?.startsWith("Bearer ") && !apiKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role so we can read bookings regardless of RLS / caller identity
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { booking_id, type } = await req.json();
    if (!booking_id) {
      return new Response(JSON.stringify({ error: "booking_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const notifType = type || "submitted";

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, full_name, trip_id, num_travelers, total_amount, advance_paid, phone, pickup_location, batch_id, email")
      .eq("id", booking_id)
      .maybeSingle();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let batchInfo = "";
    if (booking.batch_id) {
      const { data: batch } = await supabase
        .from("batches")
        .select("batch_name, start_date, end_date")
        .eq("id", booking.batch_id)
        .maybeSingle();
      if (batch) {
        const start = new Date(batch.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        const end = batch.end_date
          ? new Date(batch.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
          : start;
        batchInfo = `\n📅 Batch: ${batch.batch_name} (${start}${end !== start ? ` – ${end}` : ""})`;
      }
    }

    const remainingAmount = booking.total_amount - booking.advance_paid;
    const cleanPhone = booking.phone.replace(/[^0-9]/g, "");
    const userPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

    // ===== USER MESSAGE =====
    // Resolve a friendly display name for the trip/experience
    let displayName = booking.trip_id;
    {
      const { data: tripRow } = await supabase
        .from("trips").select("trip_name").eq("trip_id", booking.trip_id).maybeSingle();
      if (tripRow?.trip_name) {
        displayName = tripRow.trip_name;
      } else {
        const { data: expRow } = await supabase
          .from("experiences").select("name").eq("experience_id", booking.trip_id).maybeSingle();
        if (expRow?.name) displayName = expRow.name;
      }
    }

    const userMessage = notifType === "confirmed"
      ? [
          `Hi ${booking.full_name} 👋`,
          ``,
          `🎉 Your payment for *${displayName}* has been successfully verified and your booking is now confirmed!`,
          ``,
          `🧾 Booking ID: ${booking.id}`,
          `💳 Amount Received: ₹${booking.advance_paid.toLocaleString()}`,
          `👥 Guests: ${booking.num_travelers}`,
          batchInfo ? batchInfo.trim() : null,
          remainingAmount > 0 ? `💰 Balance Due: ₹${remainingAmount.toLocaleString()}` : null,
          ``,
          `Thank you for choosing GoBhraman 💙`,
          `We're excited to have you join us for this experience!`,
          ``,
          `Further trip details, reporting instructions, and important updates will be shared with you shortly.`,
          ``,
          `For any assistance, feel free to reach out anytime.`,
          `— Team GoBhraman`,
        ].filter(Boolean).join("\n")
      : [
          `🎉 Payment proof received successfully by Team GoBhraman.`,
          ``,
          `Hi ${booking.full_name}, your booking for *${booking.trip_id}* is currently under verification. Confirmation will be shared shortly.`,
          ``,
          `🧾 Booking ID: ${booking.id}`,
          `👥 Guests: ${booking.num_travelers}`,
          batchInfo || null,
          `💰 Amount: ₹${booking.total_amount.toLocaleString()}`,
          ``,
          `For queries, reply here or call +91-9415026522`,
          `— Team GoBhraman 🌊`,
        ].filter(Boolean).join("\n");

    // ===== ADMIN MESSAGE =====
    const adminMessage = [
      `🆕 *New Booking — Payment Submitted*`,
      ``,
      `👤 ${booking.full_name}`,
      `📞 ${booking.phone}`,
      `✉️ ${booking.email}`,
      `🧳 Trip: ${booking.trip_id}`,
      `👥 Travelers: ${booking.num_travelers}`,
      booking.pickup_location ? `📍 Pickup: ${booking.pickup_location}` : null,
      batchInfo || null,
      `💰 Total: ₹${booking.total_amount.toLocaleString()}`,
      `✅ Paid: ₹${booking.advance_paid.toLocaleString()}`,
      ``,
      `🔗 Booking ID: ${booking.id}`,
      `Action: Open Admin → Verify & Confirm`,
    ].filter(Boolean).join("\n");

    // Best-effort send via Meta API (silent on failure)
    const [adminSend, userSend] = await Promise.all([
      sendWhatsAppText(ADMIN_PHONE, adminMessage),
      sendWhatsAppText(userPhone, userMessage),
    ]);

    // Always also return click-to-chat URLs as fallback for the client
    const adminWhatsappUrl = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(adminMessage)}`;
    const userWhatsappUrl = `https://wa.me/${userPhone}?text=${encodeURIComponent(userMessage)}`;

    return new Response(
      JSON.stringify({
        success: true,
        admin_whatsapp_url: adminWhatsappUrl,
        user_whatsapp_url: userWhatsappUrl,
        admin_send: adminSend,
        user_send: userSend,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
