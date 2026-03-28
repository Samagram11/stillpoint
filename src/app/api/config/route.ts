import { NextResponse } from "next/server";

/**
 * Returns which API keys are configured via environment variables.
 * This lets the client skip the BYOK setup screen on personal deploys.
 * Never exposes the actual key values.
 */
export async function GET() {
  return NextResponse.json({
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasElevenLabsKey: !!process.env.ELEVENLABS_API_KEY,
  });
}
