import { NextRequest, NextResponse } from "next/server";

/**
 * Fetches the user's available voices from ElevenLabs.
 * Free-tier users only have access to voices they've created/cloned,
 * not the shared library voices.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = process.env.ELEVENLABS_API_KEY || body.apiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: "No ElevenLabs API key provided." },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        { error: `ElevenLabs API error (${response.status}): ${errorBody}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const voices = (data.voices ?? []).map(
      (v: { voice_id: string; name: string; labels?: Record<string, string>; category?: string }) => ({
        id: v.voice_id,
        name: v.name,
        description: v.labels?.description ?? v.category ?? "",
      })
    );

    return NextResponse.json({ voices });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch voices." },
      { status: 500 }
    );
  }
}
