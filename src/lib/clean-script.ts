/**
 * Strips stage directions, time markers and section labels from an AI-generated
 * script so only the spoken text remains.
 *
 * Removes:
 *  - Content inside square brackets (including the brackets): [Close up…]
 *  - Content inside double asterisks (including the markers): **0:00-0:15**
 *  - Resulting blank lines are collapsed
 */
export function cleanScriptForTeleprompter(raw: string): string {
  return raw
    // Remove [...] blocks (including multiline)
    .replace(/\[.*?\]/gs, '')
    // Remove **...** blocks
    .replace(/\*\*.*?\*\*/gs, '')
    // Collapse multiple blank lines into one
    .replace(/\n{3,}/g, '\n\n')
    // Trim leading/trailing whitespace per line
    .split('\n')
    .map(l => l.trimEnd())
    .join('\n')
    .trim();
}
