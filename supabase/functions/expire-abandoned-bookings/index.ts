import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    // Find abandoned bookings: initiated + pending payment, older than 2 hours
    const { data: abandoned, error: fetchError } = await supabase
      .from("bookings")
      .select("id, full_name, email, trip_id, batch_id, num_travelers, total_amount, created_at")
      .eq("booking_status", "initiated")
      .eq("payment_status", "pending")
      .lt("created_at", twoHoursAgo);

    if (fetchError) {
      throw new Error(`Failed to fetch abandoned bookings: ${fetchError.message}`);
    }

    if (!abandoned || abandoned.length === 0) {
      return new Response(
        JSON.stringify({ message: "No abandoned bookings to expire", expired: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const expiredIds = abandoned.map((b) => b.id);

    // Mark them as expired — no seat deduction since seats were never reserved for initiated bookings
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        booking_status: "expired",
        payment_status: "expired",
        updated_at: new Date().toISOString(),
      })
      .in("id", expiredIds);

    if (updateError) {
      throw new Error(`Failed to expire bookings: ${updateError.message}`);
    }

    console.log(`Expired ${expiredIds.length} abandoned bookings:`, expiredIds);

    return new Response(
      JSON.stringify({
        message: `Expired ${expiredIds.length} abandoned booking(s)`,
        expired: expiredIds.length,
        booking_ids: expiredIds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in expire-abandoned-bookings:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
