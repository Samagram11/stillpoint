/**
 * Convert meditation script markers to ElevenLabs-compatible SSML.
 *
 * Conversions:
 *   [pause Xs]  → <break time="Xs"/>
 *   [breathe]   → <break time="4s"/>
 *   [bell]      → stripped (handled client-side with local audio)
 *
 * Returns the cleaned script and an array of bell timestamps (character offsets)
 * so the client can trigger bell.mp3 at the right time during playback.
 */

export interface AudioPrepResult {
  ssml: string;
  bellOffsets: number[];
  plainText: string;
}

export function prepareScriptForAudio(script: string): AudioPrepResult {
  const bellOffsets: number[] = [];
  let offset = 0;

  // First pass: track bell positions and build plain text for duration estimation
  const plainText = script
    .replace(/\[pause \d+s\]/g, "")
    .replace(/\[breathe\]/g, "")
    .replace(/\[bell\]/g, "")
    .trim();

  // Second pass: convert markers to SSML
  const ssml = script
    .replace(/\[pause (\d+)s\]/g, (_match, seconds) => {
      return `<break time="${seconds}s"/>`;
    })
    .replace(/\[breathe\]/g, '<break time="4s"/>')
    .replace(/\[bell\]/g, () => {
      bellOffsets.push(offset);
      return ""; // Bell handled client-side
    });

  // Track running offset (approximate — for bell timing)
  let charCount = 0;
  for (const char of script) {
    if (char === "[") {
      const remaining = script.slice(charCount);
      if (remaining.startsWith("[bell]")) {
        bellOffsets.length; // already tracked above
      }
    }
    charCount++;
    offset = charCount;
  }

  return { ssml, bellOffsets, plainText };
}
