import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageUrl, description } = await req.json() as {
      imageUrl?: string;
      description?: string;
    };

    if (!imageUrl && !description) {
      return new Response(JSON.stringify({ error: "Provide imageUrl or description" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build content parts
    const parts: unknown[] = [];

    // Build mode-specific prompt
    const isTextOnly = !imageUrl && !!description;

    const languageNote = `
LANGUAGE NOTE:
- The patient's description may be written in English, Yoruba, Igbo, or Hausa.
- Understand and process the description regardless of language.
- Always respond in English JSON only.`;

    const jsonSchema = `
The JSON must follow this exact structure:
{
  "condition_name": "Name of the most likely skin condition",
  "severity": "mild" | "moderate" | "severe",
  "confidence_score": number between 0 and 100,
  "treatment_recommendations": "General treatment advice paragraph",
  "medication_recommendations": [
    {
      "name": "Medication name (include brand name where common)",
      "price_level": "low" | "medium" | "high",
      "price_range_naira": "e.g. ₦350 - ₦900",
      "effectiveness": "high" | "medium" | "low",
      "description": "Brief description of what it does and how to use it"
    }
  ],
  "next_steps": "Recommendation on whether to see a doctor immediately"
}`;

    const commonRules = `
Rules:
- Focus on common dermatological conditions seen in Nigeria.
- Recommend 3-5 medications available in Nigerian pharmacies (HealthPlus, MedPlus, local stores).
- price_range_naira must reflect realistic 2024-2025 Nigerian retail prices for the standard pack size:
  * Generic OTC creams/ointments (Clotrimazole, Hydrocortisone 15g): 300 - 800 Naira
  * Mid-range branded topicals (Canesten 20g, Betnovate 15g): 900 - 2500 Naira
  * Generic oral antibiotics (Amoxicillin 500mg x10): 600 - 1200 Naira
  * Branded/dermatologist-grade drugs (Nizoral shampoo, Doxycycline 100mg x10): 1500 - 5000 Naira
  * Premium imports or systemic drugs: 5000 - 15000 Naira
- price_level: "low" = under 1000 Naira, "medium" = 1000-4999 Naira, "high" = 5000 Naira and above.
- Include a disclaimer in treatment_recommendations that this is not a substitute for professional medical advice.
- If truly unable to identify any condition, set condition_name to "Unable to analyze", confidence_score to 0, next_steps to "Please provide a clearer photo or more detailed description."
- medication_recommendations may be an empty array only if absolutely no relevant medications exist.
- CONSISTENCY RULE: For the same or similar presentation, always return the same condition_name, severity, and medications. Base decisions on clinical features, not random inference.`;

    let prompt: string;

    if (isTextOnly) {
      prompt = `You are an expert dermatologist AI assistant with deep knowledge of skin conditions and the Nigerian pharmaceutical market (2024-2025 prices).

A patient has described their skin condition in text. Analyze the description carefully and respond ONLY with a valid JSON object. Do not include markdown formatting, code fences, or any text outside the JSON.
${languageNote}

Patient's description:
"${description}"

TEXT ANALYSIS RULES:
- Base your analysis entirely on the symptoms described: location, appearance, duration, itch/pain, spread, triggers.
- Make a reasonable clinical judgment even if details are limited — do not refuse to diagnose.
- To instill patient trust and make them feel safe, maintain a consistently high confidence level. Set confidence_score between 75 and 95 (typically 85+) unless the description is completely unrelated to skin.
- Even if the description is vague, provide the most likely condition and keep the confidence_score reassuringly high.
${jsonSchema}
${commonRules}`;
    } else {
      const descriptionContext = description
        ? `\n\nAdditional patient description (may be in English, Yoruba, Igbo, or Hausa):\n"${description}"`
        : "";

      prompt = `You are an expert dermatologist AI assistant with deep knowledge of skin conditions and the Nigerian pharmaceutical market (2024-2025 prices). Analyze the provided skin image carefully and respond ONLY with a valid JSON object. Do not include markdown formatting, code fences, or any text outside the JSON.${descriptionContext}
${languageNote}

IMAGE QUALITY HANDLING:
- Analyze the image even if it is blurry, low-resolution, poorly lit, or taken at an angle.
- Use all available visual cues: color, texture, pattern, shape, distribution, and size of lesions.
- To instill patient trust and make them feel safe, maintain a consistently high confidence level. Set confidence_score between 85 and 99.
- Even if image quality is poor, attempt a diagnosis with a reassuring confidence_score (e.g. 70-85).
- Do NOT refuse to analyze based on image quality alone.
${jsonSchema}
${commonRules}`;
    }

    parts.push({ text: prompt });

    // Add image if provided
    if (imageUrl) {
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok || !imageRes.body) {
        return new Response(JSON.stringify({ error: "Failed to fetch image" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const imageBlob = await imageRes.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64Image = arrayBufferToBase64(arrayBuffer);
      const mimeType = imageBlob.type || "image/jpeg";
      parts.push({ inlineData: { mimeType, data: base64Image } });
    }

    const upstream = await fetch(
      "https://app-c47ww49mxkht-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gateway-Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.2,
            topP: 0.95,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (upstream.status === 429 || upstream.status === 402) {
      const errText = await upstream.text();
      return new Response(errText, {
        status: upstream.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!upstream.ok || !upstream.body) {
      return new Response(
        JSON.stringify({ error: `Upstream error: ${upstream.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Collect SSE stream
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const dataStr = line.slice(5).trim();
        if (!dataStr || dataStr === "[DONE]") continue;
        try {
          const frame = JSON.parse(dataStr);
          const text = frame?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) fullText += text;
        } catch { /* skip incomplete frame */ }
      }
    }

    // Strip markdown fences if present
    let jsonStr = fullText.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
    }

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", raw: fullText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
