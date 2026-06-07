import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
  }

  // Parse request
  let input: string;
  let voice: string;
  let responseFormat: string;
  try {
    const body = await req.json();
    input = body.input;
    voice = body.voice ?? "heart";
    responseFormat = body.response_format ?? "mp3";
    if (!input || typeof input !== "string" || input.trim().length === 0) {
      throw new Error("Missing or empty input");
    }
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Invalid request body", detail: (e as Error).message }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // Call TTS API
  let upstream: Response;
  try {
    upstream = await fetch(
      "https://app-c47ww49mxkht-api-GYX1lzGw01Xa.gateway.appmedo.com/v1/audio/speech",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gateway-Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ input, voice, response_format: responseFormat }),
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "TTS API unreachable", detail: (e as Error).message }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // Forward quota/balance errors verbatim
  if (upstream.status === 429 || upstream.status === 402) {
    const errText = await upstream.text();
    return new Response(errText, {
      status: upstream.status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!upstream.ok) {
    return new Response(
      JSON.stringify({ error: `TTS upstream error: ${upstream.status}` }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // Upload binary audio to Supabase Storage
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const ext = responseFormat ?? "mp3";
  const filePath = `diagnosis-audio/${crypto.randomUUID()}.${ext}`;

  const { data, error: storageError } = await supabase.storage
    .from("generated-media")
    .upload(filePath, upstream.body!, {
      contentType: "audio/mpeg",
      cacheControl: "3600",
      duplex: "half",
    } as RequestInit & { cacheControl: string; upsert?: boolean });

  if (storageError) {
    return new Response(
      JSON.stringify({ error: `Storage upload failed: ${storageError.message}` }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const { data: urlData } = supabase.storage.from("generated-media").getPublicUrl(filePath);

  return new Response(
    JSON.stringify({ audioUrl: urlData.publicUrl, path: data.path }),
    { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
  );
});
