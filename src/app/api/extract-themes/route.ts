import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a therapeutic analyst identifying what psychological and emotional capacities a person needs to develop right now.

You will receive excerpts from a person's AI conversation history. Your job is NOT to summarize their problems. Your job is to identify what CAPACITIES they need — the skills, mindsets, and resilience patterns that would most help them navigate their current life.

Think like a wise therapist: "What does this person need to practice? What muscle do they need to build? What would serve them most right now?"

Output a JSON object:
{
  "primary_capacities": [
    {
      "capacity": "Short name (e.g., 'presence despite distance')",
      "description": "What this capacity means for this person",
      "evidence": "What in their conversations suggests they need this",
      "intensity": "high|medium|low"
    }
  ],
  "secondary_capacities": [...],
  "emotional_tone": "The overall emotional weather — e.g., 'carrying a lot with grace but running low', 'determined but fragmented', 'grieving while performing strength'",
  "body_context": "Any physical/health context that should inform body-based meditations",
  "strength_signals": "Evidence of resilience, competence, or self-awareness already present"
}

Rules:
- Extract 3-5 primary capacities, 2-3 secondary
- Be specific to THIS person, not generic
- Focus on the last 30 days most heavily
- Do not invent or assume — only extract what is explicitly present
- Frame everything as what they NEED, not what they're STRUGGLING with
- The output should feel like a therapist's private notes, not a diagnosis`;

interface ExtractionRequest {
  excerpts: string;
  apiKey: string;
}

interface CapacityItem {
  capacity: string;
  description: string;
  evidence: string;
  intensity: "high" | "medium" | "low";
}

interface ExtractionResponse {
  primary_capacities: CapacityItem[];
  secondary_capacities: CapacityItem[];
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
      !extraction.primary_capacities?.length ||
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
