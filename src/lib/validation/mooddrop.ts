import { z } from "zod";

import { normalizeFreeText } from "@/lib/safety/policy";
import { moodValues } from "@/types/mooddrop";

const optionalText = z
  .string()
  .trim()
  .max(600)
  .optional()
  .transform((value) => {
    const normalized = normalizeFreeText(value);
    return normalized || undefined;
  });

export const audioFileInputSchema = z.object({
  name: z.string().min(1),
  type: z.string().startsWith("audio/"),
  size: z.number().int().min(1).max(15_000_000),
  bytes: z.instanceof(Uint8Array).optional(),
});

export const checkInInputSchema = z.object({
  mood: z.enum(moodValues),
  intensity: z.number().int().min(1).max(5),
  text: optionalText,
  songTitle: optionalText,
  songArtist: optionalText,
  spiralRequested: z.boolean().default(false),
  audioFile: audioFileInputSchema.optional(),
});

export const sessionCookieSchema = z.string().min(10).max(128);

export async function parseCheckInFormData(formData: FormData) {
  const audio = formData.get("audioFile");
  let audioFile:
    | {
        name: string;
        type: string;
        size: number;
        bytes: Uint8Array;
      }
    | undefined;

  if (audio instanceof File && audio.size > 0) {
    audioFile = {
      name: audio.name || "voice-note.webm",
      type: audio.type || "audio/webm",
      size: audio.size,
      bytes: new Uint8Array(await audio.arrayBuffer()),
    };
  }

  return checkInInputSchema.parse({
    mood: formData.get("mood"),
    intensity: Number(formData.get("intensity")),
    text: formData.get("text")?.toString(),
    songTitle: formData.get("songTitle")?.toString(),
    songArtist: formData.get("songArtist")?.toString(),
    spiralRequested: formData.get("spiralRequested")?.toString() === "true",
    audioFile,
  });
}
