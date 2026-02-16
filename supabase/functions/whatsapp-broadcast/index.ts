import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

async function sendWhatsAppMessage(phoneNumberId: string, accessToken: string, to: string, message: string) {
  // Ensure phone is in international format without +
  const cleanPhone = to.replace(/\D/g, '');
  const phone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

  const response = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('WhatsApp API error:', JSON.stringify(data));
    throw new Error(`WhatsApp API error [${response.status}]: ${JSON.stringify(data)}`);
  }

  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    if (!WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error('WHATSAPP_PHONE_NUMBER_ID is not configured');
    }

    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    if (!WHATSAPP_ACCESS_TOKEN) {
      throw new Error('WHATSAPP_ACCESS_TOKEN is not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub;

    const body = await req.json();
    const { action } = body;

    // Action: send_broadcast
    if (action === 'send_broadcast') {
      const { broadcast_id } = body;

      // Fetch broadcast
      const { data: broadcast, error: bErr } = await supabase
        .from('broadcast_messages')
        .select('*')
        .eq('id', broadcast_id)
        .single();

      if (bErr || !broadcast) {
        throw new Error('Broadcast not found');
      }

      // Get opted-in users based on audience type
      let recipientQuery = supabase
        .from('whatsapp_consents')
        .select('phone, user_id')
        .eq('opted_in', true);

      const { data: recipients, error: rErr } = await recipientQuery;
      if (rErr) throw rErr;

      if (!recipients || recipients.length === 0) {
        // Update broadcast status
        await supabase.from('broadcast_messages').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          recipient_count: 0,
          sent_count: 0,
        }).eq('id', broadcast_id);

        return new Response(JSON.stringify({ success: true, sent: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update broadcast to sending
      await supabase.from('broadcast_messages').update({
        status: 'sending',
        recipient_count: recipients.length,
      }).eq('id', broadcast_id);

      let sentCount = 0;
      let failedCount = 0;

      for (const recipient of recipients) {
        try {
          const result = await sendWhatsAppMessage(
            WHATSAPP_PHONE_NUMBER_ID,
            WHATSAPP_ACCESS_TOKEN,
            recipient.phone,
            broadcast.message_template
          );

          await supabase.from('whatsapp_message_logs').insert({
            broadcast_id,
            recipient_phone: recipient.phone,
            recipient_user_id: recipient.user_id,
            message_type: 'broadcast',
            message_body: broadcast.message_template,
            status: 'sent',
            whatsapp_message_id: result?.messages?.[0]?.id || null,
            sent_at: new Date().toISOString(),
          });

          sentCount++;
        } catch (err: any) {
          console.error(`Failed to send to ${recipient.phone}:`, err.message);

          await supabase.from('whatsapp_message_logs').insert({
            broadcast_id,
            recipient_phone: recipient.phone,
            recipient_user_id: recipient.user_id,
            message_type: 'broadcast',
            message_body: broadcast.message_template,
            status: 'failed',
            error_message: err.message,
          });

          failedCount++;
        }
      }

      // Update broadcast final status
      await supabase.from('broadcast_messages').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_count: sentCount,
        failed_count: failedCount,
      }).eq('id', broadcast_id);

      return new Response(JSON.stringify({ success: true, sent: sentCount, failed: failedCount }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: send_single
    if (action === 'send_single') {
      const { phone, message, message_type } = body;

      if (!phone || !message) {
        throw new Error('Phone and message are required');
      }

      const result = await sendWhatsAppMessage(
        WHATSAPP_PHONE_NUMBER_ID,
        WHATSAPP_ACCESS_TOKEN,
        phone,
        message
      );

      // Log the message
      await supabase.from('whatsapp_message_logs').insert({
        recipient_phone: phone,
        message_type: message_type || 'confirmation',
        message_body: message,
        status: 'sent',
        whatsapp_message_id: result?.messages?.[0]?.id || null,
        sent_at: new Date().toISOString(),
      });

      return new Response(JSON.stringify({ success: true, whatsapp_id: result?.messages?.[0]?.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('WhatsApp broadcast error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
