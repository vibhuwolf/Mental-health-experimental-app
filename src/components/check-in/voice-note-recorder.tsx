"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export interface VoiceSelection {
  file: File;
  url: string;
}

export function VoiceNoteRecorder({
  value,
  onChange,
}: {
  value: VoiceSelection | null;
  onChange: (next: VoiceSelection | null) => void;
}) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (value?.url) {
        URL.revokeObjectURL(value.url);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [value]);

  const startRecording = async () => {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not support voice-note recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const file = new File([blob], "mooddrop-voice-note.webm", {
          type: blob.type,
        });
        const url = URL.createObjectURL(blob);
        onChange({ file, url });
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setError("Microphone access was blocked. You can still use text and song input.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const clearRecording = () => {
    if (value?.url) {
      URL.revokeObjectURL(value.url);
    }
    onChange(null);
  };

  return (
    <div className="space-y-4 rounded-[1.6rem] bg-white/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Voice note
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Record a raw rant instead of forcing perfect words.
          </p>
        </div>
        <div className="flex gap-2">
          {isRecording ? (
            <Button type="button" onClick={stopRecording}>
              Stop
            </Button>
          ) : (
            <Button type="button" onClick={startRecording} variant="secondary">
              Record
            </Button>
          )}
          {value ? (
            <Button type="button" onClick={clearRecording} variant="ghost">
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      {value ? (
        <div className="space-y-3">
          <audio className="w-full" controls src={value.url}>
            Your browser does not support audio playback.
          </audio>
          <p className="text-sm text-[var(--muted-foreground)]">
            Voice note saved. If transcription is unavailable, MOODDROP still
            uses the rest of your check-in.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
