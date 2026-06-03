import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RAILWAY_BASE = "https://preflight-api.printautomation.co.uk";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Extract target path
  const url = new URL(req.url);
  const path = url.searchParams.get("path");

  if (!path || !(path.startsWith("/api/") || path.startsWith("/v1/"))) {
    return new Response(
      JSON.stringify({ error: "Invalid or missing path parameter" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // /v1/products is a public catalogue — skip auth
  const isPublic = path === "/v1/products" || path.startsWith("/v1/products?");

  const authHeader = req.headers.get("Authorization");
  if (!isPublic) {
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }


  // Forward request to Railway
  const targetUrl = `${RAILWAY_BASE}${path}`;
  const forwardHeaders: Record<string, string> = {
    "Content-Type": req.headers.get("Content-Type") || "application/json",
  };
  if (authHeader) forwardHeaders.Authorization = authHeader;

  const fetchOptions: RequestInit = {
    method: req.method,
    headers: forwardHeaders,
  };


  // Forward body for non-GET requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    const contentType = req.headers.get("Content-Type") || "";
    if (contentType.includes("multipart/form-data")) {
      // For file uploads, forward the raw body and let the browser-set content-type through
      fetchOptions.body = await req.arrayBuffer();
      forwardHeaders["Content-Type"] = contentType;
    } else {
      fetchOptions.body = await req.text();
    }
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Upstream request failed", detail: String(err) }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
