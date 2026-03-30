import { NextRequest, NextResponse } from "next/server";

interface AudioRequest {
  script: string;
  voiceId: string;
  apiKey?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AudioRequest;

    // Env var takes precedence (personal deploy), then BYOK from request
    const apiKey = process.env.ELEVENLABS_API_KEY || body.apiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: "No ElevenLabs API key provided. Audio generation requires an ElevenLabs key." },
        { status: 400 }
      );
    }

    if (!body.script || !body.voiceId) {
      return NextResponse.json(
        { error: "Missing required fields: script and voiceId" },
        { status: 400 }
      );
    }

    // Convert meditation markers to SSML
    const ssmlScript = body.script
      .replace(/\[pause (\d+)s\]/g, '<break time="$1s"/>')
      .replace(/\[breathe\]/g, '<break time="4s"/>')
      .replace(/\[bell\]/g, ""); // Bell handled client-side

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${body.voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: ssmlScript,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.65,
            similarity_boost: 0.75,
            style: 0.35,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      const status = response.status;

      if (status === 401) {
        // Check if it's a quota issue (ElevenLabs returns 401 for this)
        if (errorBody.includes("quota_exceeded")) {
          return NextResponse.json(
            { error: "ElevenLabs credit limit reached. Try a browser voice instead, or upgrade your ElevenLabs plan." },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { error: "Invalid ElevenLabs API key. Please check your key and try again." },
          { status: 401 }
        );
      }

      if (status === 429) {
        return NextResponse.json(
          { error: "ElevenLabs rate limit reached. Please wait a moment and try again." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `ElevenLabs API error (${status}): ${errorBody}` },
        { status }
      );
    }

    // Stream the audio back as base64
    const audioBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({
      audioBase64: base64,
      contentType: "audio/mpeg",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error during audio generation." },
      { status: 500 }
    );
  }
}
