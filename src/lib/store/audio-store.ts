import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

import { env, hasSupabaseStorage, supabaseServerKey } from "@/lib/env";
import type { AudioFileInput } from "@/types/mooddrop";

interface StoredAudio {
  id: string;
  url: string | null;
}

interface MemoryBlob {
  bytes: Uint8Array;
  type: string;
}

const memoryAudioBlobs =
  (globalThis as { __MOODDROP_AUDIO__?: Map<string, MemoryBlob> }).__MOODDROP_AUDIO__ ??
  new Map<string, MemoryBlob>();

(globalThis as { __MOODDROP_AUDIO__?: Map<string, MemoryBlob> }).__MOODDROP_AUDIO__ =
  memoryAudioBlobs;

export async function saveAudioFile(audioFile: AudioFileInput): Promise<StoredAudio> {
  if (hasSupabaseStorage && audioFile.bytes) {
    const client = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseServerKey!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const id = `voice-${nanoid(10)}`;
    const path = `${id}-${audioFile.name}`;

    const { error } = await client.storage
      .from(env.SUPABASE_AUDIO_BUCKET!)
      .upload(path, audioFile.bytes, {
        contentType: audioFile.type,
        upsert: false,
      });

    if (!error) {
      const { data } = client.storage
        .from(env.SUPABASE_AUDIO_BUCKET!)
        .getPublicUrl(path);

      return {
        id,
        url: data.publicUrl,
      };
    }
  }

  const id = `audio_${nanoid(10)}`;
  if (audioFile.bytes) {
    memoryAudioBlobs.set(id, {
      bytes: audioFile.bytes,
      type: audioFile.type,
    });
  }

  return {
    id,
    url: `/api/audio/${id}`,
  };
}

export function getMemoryAudioBlob(id: string) {
  return memoryAudioBlobs.get(id) ?? null;
}
