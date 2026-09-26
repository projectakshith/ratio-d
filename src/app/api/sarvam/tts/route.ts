import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "SARVAM_API_KEY is not configured in .env" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { text, speaker = "shubh", language_code = "en-IN" } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "text string is required" },
        { status: 400 }
      );
    }

    // Clean text to avoid markdown artifacts in speech
    const cleanText = text
      .replace(/[*_#`~[\]]/g, "")
      .replace(/\n+/g, " ")
      .slice(0, 1500)
      .trim();

    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        text: cleanText,
        language_code: language_code,
        model: "bulbul:v3",
        speaker: speaker,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Sarvam TTS error: ${response.status} - ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const audioBase64 = data?.audios?.[0] || null;

    if (!audioBase64) {
      return NextResponse.json(
        { error: "No audio generated from Sarvam" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      audio: audioBase64,
      format: "wav",
    });
  } catch (error: any) {
    console.error("Sarvam TTS route error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
