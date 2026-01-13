
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { events } = await req.json();
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const processedEvents = events.map((event: any) => ({
      session_id: event.sessionId,
      ip_address: req.headers.get("x-forwarded-for")?.split(",")[0],
      user_agent: req.headers.get("user-agent"),
      city: req.headers.get("x-vercel-ip-city") || "Unknown",
      country: req.headers.get("x-vercel-ip-country") || "Unknown",
      referrer: event.referrer,
      utm_source: event.utmSource,
      utm_medium: event.utmMedium,
      utm_campaign: event.utmCampaign,
      page_url: event.pageUrl,
      event_type: event.eventType,
      element_selector: event.elementSelector,
    }));

    const { error } = await supabaseAdmin.from("visitors").insert(processedEvents);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
