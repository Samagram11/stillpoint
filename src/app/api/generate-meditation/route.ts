import { NextRequest, NextResponse } from "next/server";
import { MEDITATION_APPROACHES } from "@/lib/meditationTypes";
import type { MeditationApproach } from "@/lib/types";

const SYSTEM_PROMPT = `You are a meditation guide. You write 5-minute guided meditations that build specific psychological and emotional capacities.

CRITICAL RULES:
- NEVER mention specific life details, situations, people, or places
- NEVER reference technology, AI, apps, or conversations
- NEVER use the word "journey"
- NEVER use cliches: "in this moment," "simply notice," "allow yourself"
- Use universal language that resonates because of WHAT it addresses, not HOW specifically it describes someone's life

PERSONALIZATION:
The meditation should feel personal without being specific. Someone who just finished this meditation should feel like the guide understood exactly what they're going through — even though no details of their life were mentioned. The specificity comes from the emotional precision of the language, not from naming situations.

Let the capacity name and meditation seed guide the imagery and emotional arc. The meditation should feel like it was written for someone who needs exactly this — not a generic script with a label changed.

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

CREATIVE FREEDOM:
- Choose a breath pattern that serves this specific capacity and approach
- Let imagery emerge from the capacity, not from a template
- Two meditations on the same capacity should feel different
- Do not default to formulaic patterns

IMPORTANT: Also generate a title and one-sentence description.
- Title: 2-4 words, poetic but not precious. Examples: "Empty Hands," "Still Moving," "Solid Ground"
- Description: One sentence, ~10-15 words. States the capacity, not the technique.

Return your response as JSON:
{
  "title": "...",
  "description": "...",
  "script": "... (the full meditation text with markers)"
}`;

interface GenerationRequest {
  apiKey: string;
  approach: MeditationApproach;
  capacity: string;
  capacityDescription: string;
  meditationSeed: string;
  emotionalTone: string;
  bodyContext?: string;
  strengthSignals?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerationRequest;

    // Env var takes precedence (personal deploy), then BYOK from request
    const apiKey = process.env.ANTHROPIC_API_KEY || body.apiKey;

    if (!apiKey || !body.approach) {
      return NextResponse.json(
        { error: "Missing required fields: apiKey and approach" },
        { status: 400 }
      );
    }

    const approachInfo = MEDITATION_APPROACHES[body.approach];
    if (!approachInfo) {
      return NextResponse.json(
        { error: "Invalid meditation approach" },
        { status: 400 }
      );
    }

    const userPrompt = `Generate a meditation using the "${approachInfo.name}" approach.

Approach: ${approachInfo.description}
Technique: ${approachInfo.technique}

Capacity to build: ${body.capacity}
${body.capacityDescription ? `What this means: ${body.capacityDescription}` : ""}

Meditation seed (let this guide your imagery and tone):
"${body.meditationSeed}"

Emotional tone of this person: ${body.emotionalTone || "Not specified"}
${body.bodyContext ? `Body context: ${body.bodyContext}` : ""}
${body.strengthSignals ? `Strengths already present: ${body.strengthSignals}` : ""}

Remember: universal language only. No specific life details. But make it feel deeply personal — like it was written for someone who needs exactly this capacity right now.`;

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

    const raw = textBlock.text;
    const fenceMatch = raw.match(/```json?\s*\n?([\s\S]*?)```/);
    const jsonStr = fenceMatch
      ? fenceMatch[1].trim()
      : raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);

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
      approach: body.approach,
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
