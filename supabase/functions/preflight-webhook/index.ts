import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret, x-webhook-signature",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function computeHmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const expectedSecret = Deno.env.get("PREFLIGHT_WEBHOOK_SECRET");
  if (!expectedSecret) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Read raw body once — required for HMAC verification before JSON parse
  const rawBody = await req.text();

  // Prefer HMAC signature; fall back to legacy shared-secret
  const signatureHeader = req.headers.get("x-webhook-signature");
  let authed = false;

  if (signatureHeader) {
    const match = signatureHeader.match(/^sha256=([a-f0-9]+)$/i);
    if (match) {
      const expectedHex = await computeHmacSha256Hex(expectedSecret, rawBody);
      authed = timingSafeEqual(match[1].toLowerCase(), expectedHex.toLowerCase());
    }
  } else {
    const sharedSecret = req.headers.get("x-webhook-secret");
    authed = !!sharedSecret && timingSafeEqual(sharedSecret, expectedSecret);
  }

  if (!authed) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = JSON.parse(rawBody);
    const {
      job_id,
      status,
      passed,
      proof_url,
      checks,
      user_id,
      filename,
      summary,
      page_issues,
      fixed_artwork,
    } = payload;

    if (!job_id) {
      return new Response(JSON.stringify({ error: "Missing job_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rewrite proof_url to use our proof-proxy so callers see a clean URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    let proxiedProofUrl = proof_url;
    if (proof_url) {
      const match = proof_url.match(/\/v1\/proof\/(.+)$/);
      if (match) {
        proxiedProofUrl = `${supabaseUrl}/functions/v1/proof-proxy?token=${match[1]}`;
      }
    }

    const fullResults = {
      passed,
      summary,
      checks,
      page_issues,
      fixed_artwork,
      proof_url: proxiedProofUrl,
    };

    const row: Record<string, unknown> = {
      job_id,
      status,
      passed,
      proof_url: proxiedProofUrl,
      checks,
      results: fullResults,
      completed_at: new Date().toISOString(),
    };

    if (user_id) row.user_id = user_id;
    if (filename) row.filename = filename;

    const { data, error } = await supabase
      .from("jobs")
      .upsert(row, { onConflict: "job_id" })
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Upsert failed", details: error.message }),
        {
          status: error.message.includes("user_id") ? 400 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Forward to caller's callback_url if present, and track delivery
    console.log("[preflight-webhook] callback_url on job row:", data?.callback_url ?? "NONE");
    if (data?.callback_url) {
      const callbackPayload = {
        event: status === "completed" ? "job.completed" : "job.failed",
        job_id,
        status,
        passed,
        summary,
        checks,
        page_issues,
        fixed_artwork,
        proof_url: proxiedProofUrl,
        filename,
        completed_at: row.completed_at,
      };
      console.log("[preflight-webhook] Forwarding to callback_url:", data.callback_url);
      let delivered = false;
      try {
        const cbRes = await fetch(data.callback_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(callbackPayload),
        });
        delivered = cbRes.ok;
        console.log("[preflight-webhook] Callback response status:", cbRes.status);
      } catch (callbackErr) {
        console.error("[preflight-webhook] Failed to forward to callback_url:", callbackErr);
      }

      const { error: updateErr } = await supabase
        .from("jobs")
        .update({ webhook_delivered: delivered })
        .eq("job_id", job_id);
      if (updateErr) {
        console.error("[preflight-webhook] Failed to update webhook_delivered:", updateErr.message);
      }
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
