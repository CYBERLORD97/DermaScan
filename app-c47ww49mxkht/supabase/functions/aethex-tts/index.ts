import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-aethex-key",
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
    const aethexKey = req.headers.get("x-aethex-key");
    const body = await req.json();
    const { input, voice } = body;

    if (!input || input.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Missing input text" }), { status: 400, headers: CORS_HEADERS });
    }

    console.log(`[Aethex TTS] voice=${voice}`);

    // Call REAL Aethex AI TTS API
    const response = await fetch(
      "https://api.aethexai.com/api/v1/tts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${aethexKey}`,
        },
        body: JSON.stringify({
          text: input,
          voice_id: voice,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: "TTS failed", details: errText }), {
        status: response.status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Return the audio blob directly to the client
    const audioBlob = await response.blob();
    return new Response(audioBlob, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "audio/wav",
      },
    });
  } catch (error: any) {
    console.error("Aethex TTS Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
