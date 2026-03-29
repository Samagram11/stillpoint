import { NextRequest, NextResponse } from "next/server";
import type { MeditationApproach } from "@/lib/types";

const SYSTEM_PROMPT = `You are identifying what psychological and emotional capacities a person needs to develop right now, based on their AI conversation history.

Your job is NOT to summarize their problems. It is to identify what CAPACITIES they need — the skills, mindsets, and resilience patterns that would most help them navigate their current life.

Ask yourself: "What does this person need to practice? What muscle do they need to build? What would serve them most right now?"

CRITICAL — TEXTURED CAPACITY NAMES:
Name each capacity in specific, resonant language — not clinical abstractions. The capacity name is the seed for a personalized meditation. It must be vivid enough that the person reading it thinks "yes, that's exactly what I need."

Good: "trusting your preparation when the moment arrives"
Bad: "self-trust"

Good: "letting a decision sit without solving it right now"
Bad: "surrendering control"

Good: "feeling close to someone you can't be with right now"
Bad: "connection across distance"

MEDITATION SEED:
For each capacity, write a one-sentence evocative framing — a poetic seed that captures the emotional heart of the capacity. This seed will guide the meditation writer's imagery and tone.

Example seeds:
- "The preparation is already proof. The readiness lives in your body."
- "You have been holding this with both hands. What happens when you set it down for five minutes?"
- "The distance is real. The connection is also real."

APPROACH RECOMMENDATION:
For each capacity, recommend one of these 5 meditation approaches:
- grounding: Sensory anchoring, breath work, present-moment awareness
- somatic: Body scan, body awareness, physical sensation focus
- visualization: Guided imagery, metaphor, inner landscape
- compassion: Self-directed kindness, warmth, tenderness
- spacious: Open awareness, making room, non-doing, acceptance

BREADTH:
Look across the FULL spectrum of human experience. Do not default to a narrow band. Consider: grief, joy, anger, boundaries, purpose, shame, connection, creativity, rest, courage, acceptance, play, forgiveness, patience, agency, vulnerability, confidence, letting go, presence, gratitude, resilience, self-worth, curiosity, intimacy, solitude.

Output a JSON object:
{
  "capacities": [
    {
      "capacity": "Textured, resonant name",
      "description": "What this capacity means for this person",
      "evidence": "What in their conversations suggests they need this",
      "intensity": "high|medium|low",
      "meditation_seed": "One-sentence evocative framing",
      "recommended_approach": "grounding|somatic|visualization|compassion|spacious",
      "approach_rationale": "Brief reason this approach fits"
    }
  ],
  "emotional_tone": "The overall emotional weather",
  "body_context": "Any physical/health context, or empty string if none",
  "strength_signals": "Evidence of resilience, competence, or self-awareness already present"
}

Rules:
- Extract as many genuine capacities as the evidence supports, typically 3-7
- Order by intensity (highest first)
- Be specific to THIS person, not generic
- Focus on the last 30 days most heavily
- Do not invent or assume — only extract what is explicitly present
- Frame everything as what they NEED TO BUILD, not what's broken
- Capacity names must be vivid and specific, not clinical or abstract
- Each capacity should feel distinct — avoid overlap`;

interface ExtractionRequest {
  excerpts: string;
  apiKey: string;
}

interface CapacityItem {
  capacity: string;
  description: string;
  evidence: string;
  intensity: "high" | "medium" | "low";
  meditation_seed: string;
  recommended_approach: MeditationApproach;
  approach_rationale: string;
}

interface ExtractionResponse {
  capacities: CapacityItem[];
  emotional_tone: string;
  body_context: string;
  strength_signals: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExtractionRequest;

    // Env var takes precedence (personal deploy), then BYOK from request
    const apiKey = process.env.ANTHROPIC_API_KEY || body.apiKey;

    if (!apiKey || !body.excerpts) {
      return NextResponse.json(
        { error: "Missing required fields: apiKey and excerpts" },
        { status: 400 }
      );
    }

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
        messages: [
          {
            role: "user",
            content: `Here are excerpts from my recent AI conversations. Please analyze them and extract what capacities I need to develop right now.\n\n${body.excerpts}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const status = response.status;

      if (status === 401) {
        return NextResponse.json(
          { error: "Invalid Anthropic API key. Please check your key and try again." },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: `Anthropic API error (${status}): ${errorBody}` },
        { status }
      );
    }

    const data = await response.json();

    // Extract the text content from the Claude response
    const textBlock = data.content?.find(
      (block: { type: string }) => block.type === "text"
    );
    if (!textBlock?.text) {
      return NextResponse.json(
        { error: "Unexpected response format from Anthropic API" },
        { status: 502 }
      );
    }

    // Parse the JSON from Claude's response (may be wrapped in markdown code fences)
    const jsonStr = textBlock.text
      .replace(/^```json?\s*/m, "")
      .replace(/```\s*$/m, "")
      .trim();

    const extraction: ExtractionResponse = JSON.parse(jsonStr);

    // Validate required fields
    if (
      !extraction.capacities?.length ||
      !extraction.emotional_tone
    ) {
      return NextResponse.json(
        { error: "Extraction produced incomplete results. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(extraction);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse extraction results. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error during extraction." },
      { status: 500 }
    );
  }
}
