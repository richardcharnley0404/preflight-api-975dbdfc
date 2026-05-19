import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RAILWAY_API = "https://preflight-api.printautomation.co.uk";

function resolveRailwayPath(rawPath: string | null, fallbackPath: string): string {
  const candidate = rawPath?.trim() ? rawPath.trim() : fallbackPath;
  const ensuredLeadingSlash = candidate.startsWith("/") ? candidate : `/${candidate}`;

  if (ensuredLeadingSlash === "/api/jobs" || ensuredLeadingSlash.startsWith("/api/jobs/")) {
    return ensuredLeadingSlash.replace("/api/jobs", "/v1/jobs");
  }

  return ensuredLeadingSlash;
}

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
      console.log("[api-jobs] Full webhook object from caller:", JSON.stringify(payload.webhook));

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
      const railwayPath = resolveRailwayPath(url.searchParams.get("path"), "/v1/jobs");
      console.log("[api-jobs] Railway target path:", railwayPath);
      console.log("[api-jobs] Forwarding to Railway:", `${RAILWAY_API}${railwayPath}`);
      const res = await fetch(`${RAILWAY_API}${railwayPath}`, {
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

      // Look up the user_id from the API key prefix
      if (res.ok && body.job_id) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Resolve user_id from api_keys table using the key prefix
        let resolvedUserId: string | null = null;
        if (apiKey) {
          // Try matching prefix (first 8 chars of the key)
          const keyPrefix = apiKey.slice(0, 8);
          const { data: keyRow } = await supabase
            .from("api_keys")
            .select("user_id")
            .like("prefix", `${keyPrefix}%`)
            .is("revoked_at", null)
            .limit(1)
            .maybeSingle();
          if (keyRow?.user_id) {
            resolvedUserId = keyRow.user_id;
            console.log("[api-jobs] Resolved user_id from API key prefix:", resolvedUserId);
          } else {
            console.log("[api-jobs] No user_id found for key prefix:", keyPrefix);
          }
        }

        const upsertRow: Record<string, unknown> = {
          job_id: body.job_id,
          status: "queued",
        };
        if (payload.artwork?.filename) upsertRow.filename = payload.artwork.filename;
        if (callerWebhookUrl) upsertRow.callback_url = callerWebhookUrl;
        if (resolvedUserId) upsertRow.user_id = resolvedUserId;

        const { error: upsertError } = await supabase
          .from("jobs")
          .upsert(upsertRow, { onConflict: "job_id" });
        console.log("[api-jobs] Upsert result:", upsertError ? upsertError.message : "ok");
      }

      return new Response(JSON.stringify(body), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET — forward query params to Railway for list/detail
    const railwayPath = resolveRailwayPath(url.searchParams.get("path"), "/v1/jobs");
    console.log("[api-jobs] Railway target path:", railwayPath);

    const res = await fetch(`${RAILWAY_API}${railwayPath}`, {
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
