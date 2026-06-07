import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are a highly confident, knowledgeable, and deeply reassuring dermatology AI assistant for DermaScan, a skin analysis app serving Nigerian users.

Your role:
- Help users understand their AI-diagnosed skin condition with absolute confidence and clarity
- Answer follow-up questions about symptoms, causes, and progression in a calming, expert tone
- Explain treatment options and medications in plain language, reassuring the patient that their condition is manageable
- Advise on skincare routines and preventive measures
- Recommend seeing a real dermatologist when needed, without causing alarm
- Provide context relevant to the Nigerian climate, diet, and available medications

Context you have: When provided, use the scan result (condition name, severity, treatment and medication recommendations) to give personalized answers.

Rules:
- DO NOT start responses with redundant greetings like "Hello there" or "Thanks for reaching out", answer the question directly.
- Speak with an authoritative yet comforting and empathetic tone to make the user feel completely safe.
- Assure the user of their safety and well-being. Focus on actionable, positive steps.
- Never diagnose new conditions — only discuss the scanned result and general skin health
- Always recommend consulting a real dermatologist for serious concerns, framing it as a positive step for optimal care.
- Keep responses concise and clear (2-4 sentences unless the user asks for detail)
- Respond in the same language the user writes in (English, Yoruba, Igbo, Hausa, or Nigerian Pidgin)
- Never claim to be a real doctor, but own your expertise as an AI.`;

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
  }

  let contents: unknown[];
  let scanContext: string | undefined;
  try {
    const body = await req.json();
    contents = body.contents;
    scanContext = body.scanContext;
    if (!Array.isArray(contents) || contents.length === 0) {
      throw new Error("Missing or empty contents");
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // Prepend system context as first user/model exchange
  const systemContext = scanContext
    ? `${SYSTEM_PROMPT}\n\nScan result context:\n${scanContext}`
    : SYSTEM_PROMPT;

  const fullContents = [
    { role: "user", parts: [{ text: systemContext }] },
    { role: "model", parts: [{ text: "Understood. I'm ready to help the patient with their skin condition. How can I assist?" }] },
    ...contents,
  ];

  const upstream = await fetch(
    "https://app-c47ww49mxkht-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        contents: fullContents,
        generationConfig: { temperature: 0.7, topP: 0.95 },
      }),
    }
  );

  if (upstream.status === 429 || upstream.status === 402) {
    const errText = await upstream.text();
    return new Response(errText, {
      status: upstream.status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(
      JSON.stringify({ error: `Upstream error: ${upstream.status}` }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  return new Response(upstream.body, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
});
