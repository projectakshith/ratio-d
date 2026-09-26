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

    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;

    if (!file || file.size < 300) {
      return NextResponse.json(
        { error: "Audio was too short or empty. Please speak for at least 1 second." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioFile = new File([buffer], "audio.wav", { type: "audio/wav" });

    // Build multipart/form-data for Sarvam STT
    const sarvamFormData = new FormData();
    sarvamFormData.append("file", audioFile);
    sarvamFormData.append("model", "saaras:v4");
    sarvamFormData.append("mode", "transcribe");

    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
      },
      body: sarvamFormData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.log("--> Sarvam STT Error response:", response.status, errText);
      return NextResponse.json(
        { error: `Sarvam STT error: ${response.status} - ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const transcript = data?.transcript || "";

    return NextResponse.json({
      transcript,
      language_code: data?.language_code,
    });
  } catch (error: any) {
    console.error("Sarvam STT route error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
