import JSZip from "jszip";

/**
 * Extracts conversations.json from a Claude data export ZIP file.
 * Searches all entries by basename so it works regardless of folder nesting.
 */
export async function extractConversationsFromZip(
  file: File
): Promise<Record<string, unknown>[]> {
  const zip = await JSZip.loadAsync(file);

  // Find conversations.json anywhere in the archive
  let conversationsFile: JSZip.JSZipObject | null = null;
  zip.forEach((relativePath, entry) => {
    if (!entry.dir && relativePath.split("/").pop() === "conversations.json") {
      conversationsFile = entry;
    }
  });

  if (!conversationsFile) {
    throw new Error(
      "No conversations.json found in this ZIP. Make sure you're uploading a Claude data export."
    );
  }

  const text = await (conversationsFile as JSZip.JSZipObject).async("string");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      "conversations.json in the ZIP is not valid JSON."
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      "conversations.json doesn't contain the expected array of conversations."
    );
  }

  return parsed as Record<string, unknown>[];
}
