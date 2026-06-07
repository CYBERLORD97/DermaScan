import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
    if (!apiKey) {
      throw new Error("Missing INTEGRATIONS_API_KEY");
    }

    // Forward to LemonFox STT API
    const upstreamFormData = new FormData();
    upstreamFormData.append("file", file);
    upstreamFormData.append("response_format", "json");

    const response = await fetch(
      "https://app-c47ww49mxkht-api-DY8MNQoqOnMa.gateway.appmedo.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          "X-Gateway-Authorization": `Bearer ${apiKey}`,
        },
        body: upstreamFormData,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Upstream STT error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Transcription failed", details: errText }), {
        status: response.status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("STT Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
