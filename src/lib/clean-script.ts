/**
 * Script segment as returned by the generate-script edge function.
 */
export interface ScriptSegment {
  type: 'direction' | 'dialogue';
  text: string;
}

export interface StructuredScript {
  title: string;
  segments: ScriptSegment[];
}

/**
 * Parses a structured script from a raw string (JSON, possibly wrapped in
 * markdown fences) or from an already-parsed object.
 */
export function parseStructuredScript(input: string | StructuredScript): StructuredScript {
  if (typeof input !== 'string') return input;

  let cleaned = input.trim();
  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }

  return JSON.parse(cleaned) as StructuredScript;
}

/**
 * Extracts ONLY the dialogue segments from a structured script and joins them
 * into a single clean string (no stage directions, no markdown artefacts).
 *
 * Accepts either a raw JSON string or an already-parsed StructuredScript.
 */
export function cleanScriptForTeleprompter(input: string | StructuredScript): string {
  try {
    const script = parseStructuredScript(input);
    return script.segments
      .filter(s => s.type === 'dialogue')
      .map(s => s.text.trim())
      .filter(Boolean)
      .join(' ');
  } catch {
    // Fallback: if input isn't valid JSON, strip brackets/asterisks the old way
    return input
      .toString()
      .replace(/\[.*?\]/gs, '')
      .replace(/\*\*.*?\*\*/gs, '')
      .replace(/\n{3,}/g, '\n\n')
      .split('\n')
      .map(l => l.trimEnd())
      .join('\n')
      .trim();
  }
}

/**
 * Builds a human-readable display version of the structured script,
 * with directions shown in [brackets] and dialogue as plain text.
 */
export function formatScriptForDisplay(input: string | StructuredScript): string {
  try {
    const script = parseStructuredScript(input);
    return script.segments
      .map(s => s.type === 'direction' ? `[${s.text}]` : s.text)
      .join('\n\n');
  } catch {
    return input.toString();
  }
}
