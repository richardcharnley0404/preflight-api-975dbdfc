import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RAILWAY_API = "https://preflight-api-production.up.railway.app";

function normalizeApiKey(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.replace(/^Bearer\s+/i, "");
}

function keyFingerprint(value: string | null) {
  if (!value) {
    return { present: false };
  }

  return {
    present: true,
    length: value.length,
    prefix: value.slice(0, 4),
    suffix: value.slice(-4),
    hadWhitespace: value !== value.trim(),
    hadBearerPrefix: /^Bearer\s+/i.test(value),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!["POST", "GET"].includes(req.method)) {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawApiKey = req.headers.get("x-api-key") ?? req.headers.get("authorization");
  const apiKey = normalizeApiKey(rawApiKey);
  console.log("[api-jobs] Caller key metadata:", JSON.stringify(keyFingerprint(rawApiKey)));

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
      console.log("[api-jobs] POST received, payload keys:", Object.keys(payload));

      // Capture caller's webhook URL before overwriting
      const callerWebhookUrl = payload.webhook?.url || null;
      console.log("[api-jobs] Caller webhook URL:", callerWebhookUrl);

      // Always inject this app's webhook so Railway calls back here
      const webhookSecret = Deno.env.get("PREFLIGHT_WEBHOOK_SECRET");
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const internalWebhookUrl = `${supabaseUrl}/functions/v1/preflight-webhook`;
      console.log("[api-jobs] Injecting webhook URL:", internalWebhookUrl);

      payload.webhook = {
        url: internalWebhookUrl,
        secret: webhookSecret || "",
      };

      // Forward to Railway
      console.log("[api-jobs] Forwarding to Railway:", `${RAILWAY_API}/api/jobs`);
      const res = await fetch(`${RAILWAY_API}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      console.log("[api-jobs] Railway response status:", res.status, "body:", JSON.stringify(body));

      // If Railway accepted the job and the caller provided a webhook,
      // store it in the jobs table so preflight-webhook can forward results
      if (res.ok && callerWebhookUrl && body.job_id) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        const { error: upsertError } = await supabase
          .from("jobs")
          .upsert(
            { job_id: body.job_id, callback_url: callerWebhookUrl, status: "queued" },
            { onConflict: "job_id" }
          );
        console.log("[api-jobs] Upsert result:", upsertError ? upsertError.message : "ok");
      }

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
        "Authorization": `Bearer ${apiKey}`,
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
