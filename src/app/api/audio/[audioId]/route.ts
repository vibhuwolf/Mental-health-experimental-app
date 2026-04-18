import { NextResponse } from "next/server";

import { getMemoryAudioBlob } from "@/lib/store/audio-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ audioId: string }> }
) {
  const { audioId } = await context.params;
  const blob = getMemoryAudioBlob(audioId);

  if (!blob) {
    return NextResponse.json({ error: "Audio not found" }, { status: 404 });
  }

  const body = new ArrayBuffer(blob.bytes.byteLength);
  new Uint8Array(body).set(blob.bytes);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": blob.type,
      "Cache-Control": "private, max-age=60",
    },
  });
}
