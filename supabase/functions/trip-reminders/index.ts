import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Validate cron secret
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || cronSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const whatsappToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  const now = new Date();
  const results = { "7day": 0, "5day": 0, "24hr": 0, "2day_review": 0, skipped: 0, errors: 0 };

  try {
    // Fetch confirmed bookings with batch info
    const { data: bookings, error: bErr } = await supabase
      .from("bookings")
      .select("id, full_name, phone, trip_id, batch_id, total_amount, advance_paid, payment_status, booking_status, whatsapp_optin, is_deleted")
      .eq("booking_status", "confirmed")
      .eq("is_deleted", false);

    if (bErr) throw bErr;
    if (!bookings || bookings.length === 0) {
      return new Response(JSON.stringify({ message: "No bookings to process", results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch batches
    const batchIds = [...new Set(bookings.filter(b => b.batch_id).map(b => b.batch_id))];
    const { data: batches } = await supabase.from("batches").select("id, start_date, end_date, batch_name").in("id", batchIds);
    const batchMap: Record<string, any> = {};
    (batches || []).forEach(b => { batchMap[b.id] = b; });

    // Fetch already-sent notifications to prevent duplicates
    const bookingIds = bookings.map(b => b.id);
    const { data: sentNotifs } = await supabase
      .from("booking_notifications")
      .select("booking_id, type")
      .in("booking_id", bookingIds);

    const sentSet = new Set((sentNotifs || []).map(n => `${n.booking_id}:${n.type}`));

    for (const booking of bookings) {
      const batch = booking.batch_id ? batchMap[booking.batch_id] : null;
      if (!batch) continue;

      const startDate = new Date(batch.start_date);
      const endDate = new Date(batch.end_date);
      const daysUntilTrip = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const daysSinceEnd = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
      const balanceDue = booking.total_amount - booking.advance_paid;
      const hasBalance = booking.payment_status !== "fully_paid" && balanceDue > 0;

      const reminders: { type: string; message: string; condition: boolean }[] = [
        {
          type: "7day_reminder",
          condition: daysUntilTrip === 7,
          message: `🏔️ 7 Days to Go!\n\nHi ${booking.full_name},\n\nYour trip *${booking.trip_id}* departs on ${batch.start_date}!\n\n${hasBalance ? `⚠️ Balance due: ₹${balanceDue.toLocaleString()}\nPlease complete payment soon.` : "✅ You're all set!"}\n\n– Team GoBhraman`,
        },
        {
          type: "5day_balance",
          condition: daysUntilTrip === 5 && hasBalance,
          message: `⏰ Payment Reminder\n\nHi ${booking.full_name},\n\nYour remaining ₹${balanceDue.toLocaleString()} for *${booking.trip_id}* is due.\n\nTrip departs in 5 days. Please pay before ${batch.start_date}.\n\n– Team GoBhraman`,
        },
        {
          type: "24hr_final",
          condition: daysUntilTrip === 1,
          message: `🎒 Tomorrow's the Day!\n\nHi ${booking.full_name},\n\nYour trip *${booking.trip_id}* starts tomorrow!\n\n📍 Reporting time and pickup details will be shared by your coordinator.\n📞 Support: +91-9415026522\n\n${hasBalance ? `⚠️ Please clear your remaining ₹${balanceDue.toLocaleString()} before departure.` : ""}\n\nHappy travels!\n– Team GoBhraman`,
        },
        {
          type: "2day_review",
          condition: daysSinceEnd === 2,
          message: `⭐ How was your trip?\n\nHi ${booking.full_name},\n\nWe hope you enjoyed *${booking.trip_id}*! 🌄\n\nWe'd love to hear about your experience. Leave a review on your dashboard and help fellow travelers!\n\n– Team GoBhraman`,
        },
      ];

      for (const reminder of reminders) {
        if (!reminder.condition) continue;
        const dedupKey = `${booking.id}:${reminder.type}`;
        if (sentSet.has(dedupKey)) { results.skipped++; continue; }

        try {
          // Log notification
          await supabase.from("booking_notifications").insert({
            booking_id: booking.id,
            type: reminder.type,
            channel: "whatsapp",
            status: "sent",
            metadata: { trip_id: booking.trip_id, batch: batch.batch_name, balance_due: balanceDue },
          });

          // Send WhatsApp if token available and user opted in
          if (whatsappToken && phoneNumberId && booking.whatsapp_optin) {
            const phone = booking.phone.replace(/[^0-9]/g, "");
            const fullPhone = phone.startsWith("91") ? phone : `91${phone}`;

            await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
              method: "POST",
              headers: { Authorization: `Bearer ${whatsappToken}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: fullPhone,
                type: "text",
                text: { body: reminder.message },
              }),
            });
          }

          results[reminder.type === "7day_reminder" ? "7day" : reminder.type === "5day_balance" ? "5day" : reminder.type === "24hr_final" ? "24hr" : "2day_review"]++;
          sentSet.add(dedupKey);
        } catch (err) {
          console.error(`Error sending ${reminder.type} for ${booking.id}:`, err);
          results.errors++;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Trip reminders error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
