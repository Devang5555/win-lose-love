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
    // Validate: accept x-cron-secret header OR service_role JWT
    const cronSecret = Deno.env.get("CRON_SECRET");
    const providedSecret = req.headers.get("x-cron-secret");
    const authHeader = req.headers.get("Authorization");
    
    let authorized = false;
    if (providedSecret && cronSecret && providedSecret === cronSecret) {
      authorized = true;
    }
    if (!authorized && authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.role === "service_role") authorized = true;
      } catch (_) { /* invalid token */ }
    }
    if (!authorized) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
      console.warn('WhatsApp credentials not configured, skipping reminders');
      return new Response(JSON.stringify({ skipped: true, reason: 'credentials not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find bookings with trips starting in ~48 hours that have opted in
    const now = new Date();
    const in46h = new Date(now.getTime() + 46 * 60 * 60 * 1000);
    const in50h = new Date(now.getTime() + 50 * 60 * 60 * 1000);

    // Get batches starting in ~48h window
    const { data: upcomingBatches, error: batchErr } = await supabase
      .from('batches')
      .select('id, trip_id, batch_name, start_date')
      .gte('start_date', in46h.toISOString().split('T')[0])
      .lte('start_date', in50h.toISOString().split('T')[0])
      .eq('status', 'active');

    if (batchErr) throw batchErr;
    if (!upcomingBatches || upcomingBatches.length === 0) {
      return new Response(JSON.stringify({ success: true, reminders_sent: 0, reason: 'no upcoming batches' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const batchIds = upcomingBatches.map(b => b.id);

    // Get confirmed bookings for these batches with WhatsApp opt-in
    const { data: bookings, error: bookErr } = await supabase
      .from('bookings')
      .select('id, full_name, phone, trip_id, batch_id, whatsapp_optin')
      .in('batch_id', batchIds)
      .eq('booking_status', 'confirmed')
      .eq('whatsapp_optin', true);

    if (bookErr) throw bookErr;

    let sentCount = 0;

    for (const booking of (bookings || [])) {
      const batch = upcomingBatches.find(b => b.id === booking.batch_id);
      if (!batch) continue;

      // Check if we already sent a reminder for this booking
      const { data: existingLog } = await supabase
        .from('whatsapp_message_logs')
        .select('id')
        .eq('recipient_phone', booking.phone)
        .eq('message_type', 'reminder')
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existingLog && existingLog.length > 0) continue;

      const message = `⏰ Trip Reminder – GoBhraman

Hi ${booking.full_name}! 👋

Your trip *${booking.trip_id}* (${batch.batch_name}) starts on *${new Date(batch.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}*!

📍 Please ensure you're ready and packed.
📞 For any last-minute queries, reach us at +91-9415026522.

Have an amazing journey! 🌊

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

        await supabase.from('whatsapp_message_logs').insert({
          recipient_phone: booking.phone,
          recipient_user_id: null,
          message_type: 'reminder',
          message_body: message,
          status: response.ok ? 'sent' : 'failed',
          whatsapp_message_id: result?.messages?.[0]?.id || null,
          error_message: response.ok ? null : JSON.stringify(result),
          sent_at: response.ok ? new Date().toISOString() : null,
        });

        if (response.ok) sentCount++;
      } catch (err: any) {
        console.error(`Reminder failed for ${booking.phone}:`, err.message);
        await supabase.from('whatsapp_message_logs').insert({
          recipient_phone: booking.phone,
          message_type: 'reminder',
          message_body: message,
          status: 'failed',
          error_message: err.message,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, reminders_sent: sentCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Reminder error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
