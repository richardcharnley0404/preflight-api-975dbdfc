const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

const RAILWAY_API = "https://preflight-api-production.up.railway.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  // Extract the proof token from ?token=xxx or ?path=/v1/proof/xxx
  const token = url.searchParams.get("token");
  const rawPath = url.searchParams.get("path");

  let railwayUrl: string;

  if (token) {
    railwayUrl = `${RAILWAY_API}/v1/proof/${token}`;
  } else if (rawPath) {
    railwayUrl = `${RAILWAY_API}${rawPath.startsWith("/") ? rawPath : `/${rawPath}`}`;
  } else {
    return new Response(
      JSON.stringify({ error: "Missing token or path parameter" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    console.log("[proof-proxy] Fetching:", railwayUrl);
    const res = await fetch(railwayUrl);

    // Stream the response through, preserving content type
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const body = await res.arrayBuffer();

    return new Response(body, {
      status: res.status,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("[proof-proxy] Error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch proof", detail: String(err) }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
