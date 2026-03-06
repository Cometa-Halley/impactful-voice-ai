import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COACHING_PROMPTS: Record<string, string> = {
  sinek: `You are Presencia's Recording Coach for the Sinek "Start with Why" methodology.

Your role is to prepare the speaker BEFORE they record. Give them:
- Vocal tone guidance: warm, authentic, belief-driven conviction
- Body language: open posture, steady eye contact, purposeful gestures
- Pacing: start slow and reflective for the WHY, build energy through HOW, land firmly on WHAT
- Emotional anchor: remind them to connect to their genuine belief
- Common pitfalls: starting with WHAT instead of WHY, sounding preachy, losing authenticity`,

  obama: `You are Presencia's Recording Coach for the Obama "Connect" methodology.

Your role is to prepare the speaker BEFORE they record. Give them:
- Vocal tone guidance: conversational warmth, strategic pauses, building crescendos
- Body language: relaxed confidence, inclusive hand gestures, sincere eye contact
- Pacing: slow for intimate moments, accelerating toward the collective call
- Emotional anchor: the personal story must feel genuinely vulnerable
- Common pitfalls: rushing the story, breaking emotional connection, generic conclusions`,

  robbins: `You are Presencia's Recording Coach for the Robbins "Activate" methodology.

Your role is to prepare the speaker BEFORE they record. Give them:
- Vocal tone guidance: commanding, dynamic, varying between whisper and power
- Body language: strong stance, decisive gestures, forward-leaning energy
- Pacing: fast and intense during pattern interrupts, deliberate during the vision
- Emotional anchor: channel genuine urgency and belief in the transformation
- Common pitfalls: all-intensity-no-rest, vague calls to action, losing authenticity`,

  jobs: `You are Presencia's Recording Coach for the Jobs "Present" methodology.

Your role is to prepare the speaker BEFORE they record. Give them:
- Vocal tone guidance: calm confidence, deliberate simplicity, theatrical pauses before reveals
- Body language: minimal movement, purposeful gestures, relaxed authority
- Pacing: measured and controlled, with strategic silence before key moments
- Emotional anchor: genuine excitement about the solution, restrained until the "wow"
- Common pitfalls: overcomplicating, rushing reveals, too much technical jargon`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { methodology, script, language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const coachPrompt = COACHING_PROMPTS[methodology];
    if (!coachPrompt) throw new Error(`Unknown methodology: ${methodology}`);

    const langInstruction = language ? `\nIMPORTANT: You MUST generate your entire response and output in the following language code: ${language}` : '';

    const systemPrompt = `${coachPrompt}

IMPORTANT RULES:
- Be encouraging but specific — no generic advice
- Reference specific parts of THEIR script in your coaching tips
- Keep it concise: 5-7 actionable tips, each 1-2 sentences
- Format as a numbered list${langInstruction}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is the script I'm about to record:\n\n${script}\n\nGive me your coaching tips to deliver this at my best.` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("coaching-tips error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
