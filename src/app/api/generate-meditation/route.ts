import { NextRequest, NextResponse } from "next/server";
import { MEDITATION_TYPES } from "@/lib/meditationTypes";
import type { MeditationType } from "@/lib/types";

const SYSTEM_PROMPT = `You are a meditation guide. You write 5-minute guided meditations that build specific psychological and emotional capacities.

CRITICAL RULES:
- NEVER mention specific life details, situations, people, or places
- NEVER reference technology, AI, apps, or conversations
- NEVER use the word "journey"
- NEVER use cliches: "in this moment," "simply notice," "allow yourself"
- Use universal language that resonates because of WHAT it addresses, not HOW specifically it describes someone's life
- The personalization is in the SELECTION of the right capacity — the meditation itself should feel like it could be in a beautifully printed book

Write ~700 words at a slow, gentle pace.

Markers:
- [pause 3s] [pause 5s] [pause 8s] [pause 10s] — silence
- [breathe] — breath cue (inhale-exhale cycle)
- [bell] — at the very end only

Structure:
1. Arrival (grounding in body and breath, ~100 words)
2. Invitation (introducing the capacity gently, ~100 words)
3. Practice (core meditation work, ~300 words)
4. Integration (weaving the capacity into felt experience, ~100 words)
5. Return (coming back to the room with a quiet intention, ~100 words)

Tone: Warm, grounded, unhurried. Like a trusted friend who is also very wise. Not clinical. Not spiritual-performative. Not saccharine. Not overly poetic. Grounded and real.

IMPORTANT: Also generate a title and one-sentence description.
- Title: 2-4 words, poetic but not precious. Examples: "Empty Hands," "The Thread Holds," "Solid Ground"
- Description: One sentence, ~10-15 words. States the capacity, not the technique.

Return your response as JSON:
{
  "title": "...",
  "description": "...",
  "script": "... (the full meditation text with markers)"
}`;

interface GenerationRequest {
  apiKey: string;
  meditationType: MeditationType;
  capacities: Array<{
    capacity: string;
    description: string;
  }>;
  emotionalTone: string;
  bodyContext?: string;
  strengthSignals?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerationRequest;

    // Env var takes precedence (personal deploy), then BYOK from request
    const apiKey = process.env.ANTHROPIC_API_KEY || body.apiKey;

    if (!apiKey || !body.meditationType) {
      return NextResponse.json(
        { error: "Missing required fields: apiKey and meditationType" },
        { status: 400 }
      );
    }

    const typeInfo = MEDITATION_TYPES[body.meditationType];
    if (!typeInfo) {
      return NextResponse.json(
        { error: "Invalid meditation type" },
        { status: 400 }
      );
    }

    const capacityContext = body.capacities?.length
      ? `Capacities to address:\n${body.capacities.map((c) => `- ${c.capacity}: ${c.description}`).join("\n")}`
      : "No specific capacities provided. Generate based on the type's general purpose.";

    const userPrompt = `Generate a "${typeInfo.name}" meditation.

Type purpose: ${typeInfo.tagline}
Type approach: ${typeInfo.approach}

${capacityContext}

Emotional tone of this person: ${body.emotionalTone || "Not specified"}
${body.bodyContext ? `Body context: ${body.bodyContext}` : ""}
${body.strengthSignals ? `Strengths already present: ${body.strengthSignals}` : ""}

Remember: universal language only. No specific life details. The script should feel like it belongs in a printed book.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const status = response.status;

      if (status === 401) {
        return NextResponse.json(
          { error: "Invalid Anthropic API key." },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: `Anthropic API error (${status}): ${errorBody}` },
        { status }
      );
    }

    const data = await response.json();
    const textBlock = data.content?.find(
      (block: { type: string }) => block.type === "text"
    );

    if (!textBlock?.text) {
      return NextResponse.json(
        { error: "Unexpected response format from Anthropic API" },
        { status: 502 }
      );
    }

    const jsonStr = textBlock.text
      .replace(/^```json?\s*/m, "")
      .replace(/```\s*$/m, "")
      .trim();

    const meditation = JSON.parse(jsonStr) as {
      title: string;
      description: string;
      script: string;
    };

    if (!meditation.title || !meditation.script) {
      return NextResponse.json(
        { error: "Meditation generation produced incomplete results." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      title: meditation.title,
      description: meditation.description ?? "",
      script: meditation.script,
      type: body.meditationType,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse meditation response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error during meditation generation." },
      { status: 500 }
    );
  }
}
