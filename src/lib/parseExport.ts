/**
 * Client-side Claude conversation export parser.
 *
 * Implements the theme-extractor skill's input preparation rules:
 * - Human messages only (strip assistant responses)
 * - Strip technical content (code blocks, tool calls, JSON, file paths)
 * - Recency weighting (last 30d full, 30-90d sampled, 90d+ excluded)
 * - Token budget cap (~40,000 tokens ≈ ~160,000 chars at ~4 chars/token)
 */

const TOKEN_BUDGET_CHARS = 160_000; // ~40K tokens × 4 chars/token
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/** Minimal shape of a Claude export conversation */
interface RawConversation {
  uuid?: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
  chat_messages?: RawMessage[];
}

interface RawMessage {
  sender?: string;
  text?: string;
  created_at?: string;
  content?: Array<{ type?: string; text?: string }>;
}

export interface PreparedExcerpt {
  title: string;
  date: string;
  messages: string[];
}

export interface ParseResult {
  excerpts: PreparedExcerpt[];
  stats: {
    totalConversations: number;
    includedConversations: number;
    totalMessages: number;
    approximateTokens: number;
  };
  warnings: string[];
}

/** Strip code blocks, file paths, JSON blobs, and tool-call artifacts */
function stripTechnicalContent(text: string): string {
  return (
    text
      // Remove fenced code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove inline code
      .replace(/`[^`]+`/g, "")
      // Remove file paths (e.g., /Users/foo/bar.ts, ./src/lib)
      .replace(/(?:\/[\w.-]+){2,}/g, "")
      // Remove JSON-like blobs
      .replace(/\{[\s\S]{50,}?\}/g, "")
      // Remove tool use markers
      .replace(/<tool_use>[\s\S]*?<\/tool_use>/g, "")
      .replace(/<result>[\s\S]*?<\/result>/g, "")
      // Collapse whitespace
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/** Extract text content from a message, handling both flat text and content arrays */
function extractMessageText(msg: RawMessage): string {
  if (msg.text) return msg.text;
  if (Array.isArray(msg.content)) {
    return msg.content
      .filter((block) => block.type === "text" && block.text)
      .map((block) => block.text as string)
      .join("\n");
  }
  return "";
}

/** Determine conversation date from available fields */
function getConversationDate(conv: RawConversation): Date {
  const dateStr = conv.updated_at ?? conv.created_at;
  if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date(0); // Unknown date — will be excluded by recency filter
}

/** Check if a message is from the human */
function isHumanMessage(msg: RawMessage): boolean {
  return msg.sender === "human" || msg.sender === "user";
}

export function parseExport(raw: Record<string, unknown>[]): ParseResult {
  const now = Date.now();
  const warnings: string[] = [];

  // Cast to our minimal expected shape
  const conversations = raw as unknown as RawConversation[];

  // Sort by date (newest first)
  const sorted = [...conversations].sort(
    (a, b) => getConversationDate(b).getTime() - getConversationDate(a).getTime()
  );

  const excerpts: PreparedExcerpt[] = [];
  let totalChars = 0;
  let totalMessages = 0;

  for (const conv of sorted) {
    const convDate = getConversationDate(conv);
    const ageMs = now - convDate.getTime();

    // Exclude conversations older than 90 days
    if (ageMs > NINETY_DAYS_MS) continue;

    const messages = conv.chat_messages ?? [];
    const humanMessages = messages.filter(isHumanMessage);

    if (humanMessages.length === 0) continue;

    // For 30-90 day old conversations, sample every other message
    const sampled =
      ageMs > THIRTY_DAYS_MS
        ? humanMessages.filter((_, i) => i % 2 === 0)
        : humanMessages;

    const cleaned = sampled
      .map((msg) => stripTechnicalContent(extractMessageText(msg)))
      .filter((text) => text.length > 10); // Drop trivially short messages

    if (cleaned.length === 0) continue;

    const excerptChars = cleaned.reduce((sum, t) => sum + t.length, 0);

    // Respect token budget
    if (totalChars + excerptChars > TOKEN_BUDGET_CHARS) {
      // Try to fit partial — take what we can
      const remaining = TOKEN_BUDGET_CHARS - totalChars;
      if (remaining > 200) {
        const partial: string[] = [];
        let partialChars = 0;
        for (const msg of cleaned) {
          if (partialChars + msg.length > remaining) break;
          partial.push(msg);
          partialChars += msg.length;
        }
        if (partial.length > 0) {
          excerpts.push({
            title: conv.name ?? "Untitled conversation",
            date: convDate.toISOString().split("T")[0],
            messages: partial,
          });
          totalMessages += partial.length;
        }
      }
      break; // Budget exhausted
    }

    excerpts.push({
      title: conv.name ?? "Untitled conversation",
      date: convDate.toISOString().split("T")[0],
      messages: cleaned,
    });
    totalChars += excerptChars;
    totalMessages += cleaned.length;
  }

  if (excerpts.length < 5) {
    warnings.push(
      "Limited conversation history found. Meditations will be less personalized — upload again after more conversations for deeper results."
    );
  }

  if (excerpts.length === 0) {
    warnings.push(
      "No usable conversation content found. Make sure you uploaded a Claude data export (JSON)."
    );
  }

  return {
    excerpts,
    stats: {
      totalConversations: conversations.length,
      includedConversations: excerpts.length,
      totalMessages,
      approximateTokens: Math.round(totalChars / 4),
    },
    warnings,
  };
}
