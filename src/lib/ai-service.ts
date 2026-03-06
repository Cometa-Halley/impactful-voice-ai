import { supabase } from '@/integrations/supabase/client';
import type { MethodologyKey } from './methodologies';

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// ── SSE stream helper ──────────────────────────────────────────────

async function streamFromEdge({
  functionName,
  body,
  onDelta,
  onDone,
}: {
  functionName: string;
  body: Record<string, unknown>;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(`${FUNCTIONS_URL}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `Error ${resp.status}`);
  }

  if (!resp.body) throw new Error('No response body');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') {
        onDone();
        return;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buffer = line + '\n' + buffer;
        break;
      }
    }
  }

  // Flush remaining
  if (buffer.trim()) {
    for (let raw of buffer.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (!raw.startsWith('data: ')) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

// ── Public API ──────────────────────────────────────────────────────

export interface GenerateScriptParams {
  methodology: MethodologyKey;
  answers: string[];
  format?: 'vertical' | 'horizontal';
  duration?: '30s' | '60s';
  language?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
}

export async function generateScript({ methodology, answers, format, duration, language, onDelta, onDone }: GenerateScriptParams) {
  return streamFromEdge({
    functionName: 'generate-script',
    body: { methodology, answers, format, duration, language },
    onDelta,
    onDone,
  });
}

export interface RefineScriptParams {
  methodology: MethodologyKey;
  script: string;
  instruction: string;
  history?: Array<{ role: string; content: string }>;
  language?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
}

export async function refineScript({ methodology, script, instruction, history, language, onDelta, onDone }: RefineScriptParams) {
  return streamFromEdge({
    functionName: 'refine-script',
    body: { methodology, script, instruction, history, language },
    onDelta,
    onDone,
  });
}

export interface CoachingTipsParams {
  methodology: MethodologyKey;
  script: string;
  language?: string;
  onDelta: (text: string) => void;
  onDone: () => void;
}

export async function getCoachingTips({ methodology, script, language, onDelta, onDone }: CoachingTipsParams) {
  return streamFromEdge({
    functionName: 'coaching-tips',
    body: { methodology, script, language },
    onDelta,
    onDone,
  });
}

export interface AnalysisResult {
  hook_score: number;
  clarity_score: number;
  energy_score: number;
  coherence_score: number;
  cta_strength: number;
  overall_score: number;
  suggestions: Array<{ area: string; suggestion: string; priority: 'high' | 'medium' | 'low' }>;
  summary: string;
}

export async function analyzePerformance(
  methodology: MethodologyKey,
  script: string,
  transcription: string,
): Promise<AnalysisResult> {
  const { data, error } = await supabase.functions.invoke('analyze-performance', {
    body: { methodology, script, transcription },
  });

  if (error) throw new Error(error.message || 'Analysis failed');
  return data as AnalysisResult;
}
