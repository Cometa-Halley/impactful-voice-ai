import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const METHODOLOGY_PROMPTS: Record<string, string> = {
  sinek: `You are Presencia's Script Architect using the Sinek "Start with Why" methodology.

Structure the script in three clear sections:
1. WHY — The deeper purpose and belief behind the message
2. HOW — The unique approach or process that brings the purpose to life
3. WHAT — The tangible offer, product, or idea

Guidelines:
- Open with a powerful statement of belief or purpose
- Build emotional conviction before introducing the practical details
- Close by reinforcing the WHY to inspire action
- Maintain an authentic, passionate, and visionary tone throughout`,

  obama: `You are Presencia's Script Architect using the Obama "Connect" methodology.

Structure the script in four sections:
1. PERSONAL STORY — An anchoring personal experience
2. CONFLICT — The challenge or turning point
3. UNIVERSAL TRUTH — A shared value that connects speaker to audience
4. CALL TO UNITY — A collective call to reflection or action

Guidelines:
- Use vivid sensory details in the storytelling
- Build narrative arc with tension and resolution
- Connect personal experience to universal human values
- Use rhythmic pacing, pauses, and rhetorical repetition
- Close with inclusive, unifying language`,

  robbins: `You are Presencia's Script Architect using the Robbins "Activate" methodology.

Structure the script in four sections:
1. PATTERN INTERRUPT — A bold statement or question that breaks the status quo
2. PAIN POINT — Expose the real problem or limiting belief
3. VISION — Paint the transformation and breakthrough
4. ACTION COMMAND — A specific, immediate next step

Guidelines:
- Open with maximum energy and urgency
- Use direct, commanding language
- Create emotional peaks and valleys
- Make the call to action concrete, specific, and time-bound
- Maintain relentless forward momentum`,

  jobs: `You are Presencia's Script Architect using the Jobs "Present" methodology.

Structure the script in four sections:
1. PROBLEM — Set the stage by framing a problem the audience recognizes
2. SOLUTION — Introduce your answer with clarity and simplicity
3. DEMO/PROOF — Show concrete evidence, data, or demonstration
4. ONE MORE THING — A memorable, theatrical closing reveal

Guidelines:
- Use simple, jargon-free language
- Build dramatic tension before each reveal
- Show, don't tell — favor concrete examples over abstractions
- Create a "wow" moment that the audience will remember
- End with a clean, quotable statement`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { methodology, answers, format, duration, language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const methodologyPrompt = METHODOLOGY_PROMPTS[methodology];
    if (!methodologyPrompt) throw new Error(`Unknown methodology: ${methodology}`);

    const langInstruction = language
      ? `\nIMPORTANT: You MUST generate your entire response in the following language code: ${language}. ALL text (directions and dialogue) must be in that language.`
      : '';

    const systemPrompt = `${methodologyPrompt}

Format: ${format || 'vertical'} video
Duration: ${duration || '60s'}

CRITICAL OUTPUT RULES:
- You MUST return ONLY a valid JSON object. No markdown, no code fences, no extra text.
- The JSON must follow this EXACT structure:
{
  "title": "Title of the video",
  "segments": [
    { "type": "direction", "text": "Stage direction or tone indicator" },
    { "type": "dialogue", "text": "Exact spoken text the user should read aloud" }
  ]
}
- Use "direction" segments for stage cues (pauses, energy, tone, camera instructions).
- Use "dialogue" segments for the ACTUAL words the user will speak on camera.
- Adapt the total dialogue length to fit ${duration || '60s'} of natural speaking.
- Never include brackets, asterisks, or markdown formatting inside any segment text.${langInstruction}`;

    const userMessage = `Here are my answers to the methodology questions:

${answers.map((a: string, i: number) => `Q${i + 1}: ${a}`).join('\n\n')}

Generate my complete script now as a JSON object.`;

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
          { role: "user", content: userMessage },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? "";

    // Strip markdown fences if present
    let jsonStr = rawContent.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    }

    // Parse and validate
    const parsed = JSON.parse(jsonStr);
    if (!parsed.segments || !Array.isArray(parsed.segments)) {
      throw new Error("AI returned invalid structure: missing segments array");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-script error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
