import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth: require cron secret or service role key
    const cronSecret = Deno.env.get("CRON_SECRET");
    const providedSecret = req.headers.get("x-cron-secret");
    const authHeader = req.headers.get("Authorization");

    if (!providedSecret || providedSecret !== cronSecret) {
      if (!authHeader?.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "___none___")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ skipped: true, reason: 'WhatsApp credentials not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const now = new Date();

    // Target dates: 7 days and 3 days from now
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Find batches starting in 7 or 3 days
    const { data: targetBatches, error: batchErr } = await supabase
      .from('batches')
      .select('id, trip_id, batch_name, start_date')
      .in('start_date', [in7d, in3d])
      .in('status', ['active', 'upcoming']);

    if (batchErr) throw batchErr;
    if (!targetBatches || targetBatches.length === 0) {
      return new Response(JSON.stringify({ success: true, reminders_sent: 0, reason: 'no batches at 7d/3d window' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const batchIds = targetBatches.map(b => b.id);

    // Find confirmed bookings with pending balance and WhatsApp opt-in
    const { data: bookings, error: bookErr } = await supabase
      .from('bookings')
      .select('id, full_name, phone, trip_id, batch_id, total_amount, advance_paid, whatsapp_optin, payment_status')
      .in('batch_id', batchIds)
      .eq('booking_status', 'confirmed')
      .eq('whatsapp_optin', true)
      .in('payment_status', ['advance_verified', 'balance_pending']);

    if (bookErr) throw bookErr;

    // Get trip names for messages
    const tripIds = [...new Set((bookings || []).map(b => b.trip_id))];
    const tripMap: Record<string, string> = {};
    if (tripIds.length > 0) {
      const { data: trips } = await supabase
        .from('trips')
        .select('trip_id, trip_name')
        .in('trip_id', tripIds);
      for (const t of (trips || [])) {
        tripMap[t.trip_id] = t.trip_name;
      }
    }

    let sentCount = 0;
    let skippedCount = 0;

    for (const booking of (bookings || [])) {
      const batch = targetBatches.find(b => b.id === booking.batch_id);
      if (!batch) continue;

      const remaining = booking.total_amount - booking.advance_paid;
      if (remaining <= 0) { skippedCount++; continue; }

      // Check if we already sent a balance reminder for this booking today
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const { data: existingReminder } = await supabase
        .from('payment_reminders')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('channel', 'whatsapp')
        .gte('sent_at', todayStart.toISOString())
        .limit(1);

      if (existingReminder && existingReminder.length > 0) { skippedCount++; continue; }

      const tripName = tripMap[booking.trip_id] || booking.trip_id;
      const startDate = new Date(batch.start_date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      });

      const message = `⏰ Payment Reminder – GoBhraman

Hi ${booking.full_name},

Your remaining ₹${remaining.toLocaleString('en-IN')} for *${tripName}* is pending. Please complete payment before *${startDate}*.

📋 Booking ID: ${booking.id.slice(0, 8)}
💳 Pending Amount: ₹${remaining.toLocaleString('en-IN')}

Complete your payment to secure your seat! 🌊

– Team GoBhraman`;

      try {
        const cleanPhone = booking.phone.replace(/\D/g, '');
        const phone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

        const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: message },
          }),
        });

        const result = await response.json();

        // Log in whatsapp_message_logs
        await supabase.from('whatsapp_message_logs').insert({
          recipient_phone: booking.phone,
          recipient_user_id: null,
          message_type: 'balance_reminder',
          message_body: message,
          status: response.ok ? 'sent' : 'failed',
          whatsapp_message_id: result?.messages?.[0]?.id || null,
          error_message: response.ok ? null : JSON.stringify(result),
          sent_at: response.ok ? new Date().toISOString() : null,
        });

        // Log in payment_reminders table
        if (response.ok) {
          await supabase.from('payment_reminders').insert({
            booking_id: booking.id,
            sent_by: '00000000-0000-0000-0000-000000000000', // system/cron
            channel: 'whatsapp',
            message: message,
          });
          sentCount++;
        }
      } catch (err: any) {
        console.error(`Balance reminder failed for ${booking.phone}:`, err.message);
        await supabase.from('whatsapp_message_logs').insert({
          recipient_phone: booking.phone,
          message_type: 'balance_reminder',
          message_body: message,
          status: 'failed',
          error_message: err.message,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, reminders_sent: sentCount, skipped: skippedCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Balance reminder error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
