import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ANALYSIS_PROMPTS: Record<string, string> = {
  sinek: `You are Presencia's Performance Analyst using the Sinek methodology.

Evaluate the speaker's delivery against these criteria:
1. Clarity of purpose (WHY) — Did the speaker clearly communicate their deeper belief?
2. Emotional conviction — Did they sound authentically passionate?
3. Logical flow WHY → HOW → WHAT — Was the structure maintained?
4. Inspirational closing — Did the ending reinforce the WHY and inspire action?`,

  obama: `You are Presencia's Performance Analyst using the Obama methodology.

Evaluate the speaker's delivery against these criteria:
1. Emotional authenticity — Was the personal story genuinely vulnerable?
2. Narrative arc — Was there a clear setup → conflict → resolution?
3. Audience connection — Did the story connect to universal human experience?
4. Rhythmic pacing — Were pauses, repetition, and crescendos used effectively?`,

  robbins: `You are Presencia's Performance Analyst using the Robbins methodology.

Evaluate the speaker's delivery against these criteria:
1. Energy and intensity — Was the vocal energy commanding and dynamic?
2. Urgency creation — Did the speaker create emotional peaks?
3. Transformation clarity — Was the promised breakthrough specific and believable?
4. Call to action strength — Was the action step concrete, specific, and immediate?`,

  jobs: `You are Presencia's Performance Analyst using the Jobs methodology.

Evaluate the speaker's delivery against these criteria:
1. Problem clarity — Was the problem framed simply and compellingly?
2. Dramatic pacing — Were reveals and transitions theatrical and well-timed?
3. Proof quality — Was there concrete demonstration or evidence shown?
4. Memorable close — Did the "one more thing" create a lasting impression?`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { methodology, script, transcription, language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const analysisPrompt = ANALYSIS_PROMPTS[methodology];
    if (!analysisPrompt) throw new Error(`Unknown methodology: ${methodology}`);

    const langInstruction = language === 'es'
      ? '\n\nIMPORTANT: You MUST write ALL text fields (area, suggestion, summary) in Spanish.'
      : '';

    const systemPrompt = `${analysisPrompt}${langInstruction}

You MUST respond by calling the "submit_analysis" tool with structured scores and suggestions. Do not respond with plain text.`;

    const userMessage = `ORIGINAL SCRIPT:
${script}

ACTUAL DELIVERY (transcription):
${transcription}

Analyze the performance: compare the delivery against the script and methodology criteria. Score each dimension and provide specific, actionable suggestions for improvement.`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "submit_analysis",
              description: "Submit the structured performance analysis with scores and suggestions.",
              parameters: {
                type: "object",
                properties: {
                  hook_score: { type: "number", description: "Opening hook effectiveness (1-10)" },
                  clarity_score: { type: "number", description: "Message clarity and structure (1-10)" },
                  energy_score: { type: "number", description: "Vocal energy and delivery dynamics (1-10)" },
                  coherence_score: { type: "number", description: "Adherence to methodology structure (1-10)" },
                  cta_strength: { type: "number", description: "Call-to-action effectiveness (1-10)" },
                  overall_score: { type: "number", description: "Overall performance score (1-10)" },
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        area: { type: "string", description: "Area of improvement" },
                        suggestion: { type: "string", description: "Specific actionable suggestion" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["area", "suggestion", "priority"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string", description: "2-3 sentence overall assessment" },
                },
                required: ["hook_score", "clarity_score", "energy_score", "coherence_score", "cta_strength", "overall_score", "suggestions", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_analysis" } },
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

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "submit_analysis") {
      throw new Error("AI did not return structured analysis");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-performance error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
