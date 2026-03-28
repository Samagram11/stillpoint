import type { PreparedExcerpt } from "./parseExport";

/**
 * Format prepared excerpts into the prompt payload for the extract-themes API route.
 * This runs client-side — only the formatted text is sent to the server.
 */
export function formatExcerptsForExtraction(
  excerpts: PreparedExcerpt[]
): string {
  return excerpts
    .map(
      (excerpt) =>
        `--- Conversation: "${excerpt.title}" (${excerpt.date}) ---\n${excerpt.messages.join("\n\n")}`
    )
    .join("\n\n");
}
