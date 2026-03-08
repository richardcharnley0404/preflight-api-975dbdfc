import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

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

  // Verify webhook secret
  const secret = req.headers.get("x-webhook-secret");
  const expectedSecret = Deno.env.get("PREFLIGHT_WEBHOOK_SECRET");

  if (!expectedSecret || secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    const { job_id, status, passed, proof_url, checks, user_id, filename } = payload;

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

    // Build the upsert row — only include user_id/filename if provided
    // Rewrite proof_url to use our proof-proxy so callers see a clean URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    let proxiedProofUrl = proof_url;
    if (proof_url) {
      // Extract token from Railway URL like .../v1/proof/TOKEN
      const match = proof_url.match(/\/v1\/proof\/(.+)$/);
      if (match) {
        proxiedProofUrl = `${supabaseUrl}/functions/v1/proof-proxy?token=${match[1]}`;
      }
    }

    const row: Record<string, unknown> = {
      job_id,
      status,
      passed,
      proof_url: proxiedProofUrl,
      checks,
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

    // If this job has a callback_url, forward the results to the caller
    console.log("[preflight-webhook] callback_url on job row:", data?.callback_url ?? "NONE");
    if (data?.callback_url) {
      const callbackPayload = {
        event: status === "completed" ? "job.completed" : "job.failed",
        job_id,
        status,
        passed,
        checks,
        proof_url: proxiedProofUrl,
        filename,
        completed_at: row.completed_at,
      };
      console.log("[preflight-webhook] Forwarding to callback_url:", data.callback_url);
      console.log("[preflight-webhook] Callback payload:", JSON.stringify(callbackPayload));
      try {
        const cbRes = await fetch(data.callback_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(callbackPayload),
        });
        console.log("[preflight-webhook] Callback response status:", cbRes.status);
      } catch (callbackErr) {
        // Log but don't fail — the job was saved successfully
        console.error("[preflight-webhook] Failed to forward to callback_url:", callbackErr);
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
