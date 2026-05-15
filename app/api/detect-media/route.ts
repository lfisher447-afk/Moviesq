import { NextRequest, NextResponse } from "next/server";
import { detectMediaFromImage } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }
    
    let mimeType = "image/png";
    let base64Data = image;

    const matches = image.match(/^data:([^;]+);base64,([\s\S]*)$/);
    if (matches) {
      mimeType = matches[1];
      base64Data = matches[2];
    } else if (image.includes("base64,")) {
      const parts = image.split("base64,", 2);
      if (parts.length === 2) {
        const meta = parts[0];
        base64Data = parts[1];
        const mimeMatch = meta.match(/:([^;]+);/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
      }
    }

    const result = await detectMediaFromImage(base64Data, mimeType);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error in detect-media route:", error);
    return NextResponse.json(
      { error: "Failed to process image detection" },
      { status: 500 }
    );
  }
}
