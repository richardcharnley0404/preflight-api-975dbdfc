import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RAILWAY_API = "https://preflight-api-production.up.railway.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST (submit job) and GET (list/get jobs)
  if (!["POST", "GET"].includes(req.method)) {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Pass through X-API-Key — Railway validates it
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing X-API-Key header" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const url = new URL(req.url);

  try {
    if (req.method === "POST") {
      const payload = await req.json();

      // Only inject default webhook if caller didn't provide one
      if (!payload.webhook?.url) {
        const webhookSecret = Deno.env.get("PREFLIGHT_WEBHOOK_SECRET");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        payload.webhook = {
          url: `${supabaseUrl}/functions/v1/preflight-webhook`,
          secret: webhookSecret || "",
        };
      }

      // Forward to Railway
      const res = await fetch(`${RAILWAY_API}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json();

      return new Response(JSON.stringify(body), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET — forward query params to Railway for list/detail
    const path = url.searchParams.get("path") || "/api/jobs";
    const res = await fetch(`${RAILWAY_API}${path}`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
      },
    });

    const body = await res.json();
    return new Response(JSON.stringify(body), {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid request", detail: String(err) }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
