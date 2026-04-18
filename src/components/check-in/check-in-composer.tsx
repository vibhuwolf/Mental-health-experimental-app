"use client";

import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useState } from "react";

import { SafetyDisclosure } from "@/components/safety-disclosure";
import {
  VoiceNoteRecorder,
  type VoiceSelection,
} from "@/components/check-in/voice-note-recorder";
import { Button } from "@/components/ui/button";
import { moodValues, type MoodValue } from "@/types/mooddrop";

const moodLabels: Record<MoodValue, string> = {
  hopeful: "Hopeful",
  sunny: "Sunny",
  foggy: "Foggy",
  overthinking: "Overthinking",
  wired: "Wired",
  heavy: "Heavy",
};

export function CheckInComposer() {
  const router = useRouter();
  const [mood, setMood] = useState<MoodValue>("foggy");
  const [intensity, setIntensity] = useState(3);
  const [text, setText] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [voiceNote, setVoiceNote] = useState<VoiceSelection | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState("");

  const deferredText = useDeferredValue(text);
  const wordCount = deferredText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const submit = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("mood", mood);
      formData.set("intensity", String(intensity));
      formData.set("text", text);
      formData.set("songTitle", songTitle);
      formData.set("songArtist", songArtist);
      formData.set("spiralRequested", "false");

      if (voiceNote?.file) {
        formData.set("audioFile", voiceNote.file);
      }

      const response = await fetch("/api/check-ins", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("We could not decode this drop yet.");
      }

      const payload = await response.json();

      startTransition(() => {
        if (payload.result.kind === "spiral") {
          router.push(`/spiral?checkIn=${payload.checkIn.id}`);
          return;
        }

        router.push(`/check-in/${payload.checkIn.id}`);
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We could not decode this drop yet."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressLabel = isSubmitting
    ? voiceNote?.file
      ? "Saving your drop, scanning safety, and decoding your voice note."
      : "Saving your drop, scanning safety, and shaping one useful signal."
    : voiceNote?.file
      ? "Voice note attached. If transcription is unavailable, your check-in still goes through."
      : "Quick mode works with mood and intensity alone. The note is optional.";

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="inline-flex rounded-full border border-[rgba(16,16,34,0.08)] bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
          60-second check-in
        </div>
        <h1 className="font-[family-name:var(--font-serif)] text-5xl leading-[0.96] tracking-[-0.04em] text-[var(--foreground)]">
          Start simple. Add more signal only if you want it.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
          Pick the vibe, set the intensity, add a short note if it helps, and get
          one clear emotional read back.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6 rounded-[2rem] bg-[rgba(255,249,244,0.94)] p-5 shadow-[0_30px_60px_rgba(26,12,6,0.08)]">
          <div className="rounded-[1.5rem] bg-white/70 px-4 py-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Quick mode
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              Mood, intensity, optional note. Song and voice note stay one tap
              away when you want more context.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-[var(--foreground)]">
              Mood right now
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {moodValues.map((item) => {
                const active = item === mood;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMood(item)}
                    className={`rounded-[1.25rem] px-4 py-4 text-left text-sm transition ${
                      active
                        ? "bg-[var(--foreground)] text-[var(--foreground-on-dark)] shadow-[0_20px_40px_rgba(16,16,34,0.2)]"
                        : "bg-white/75 text-[var(--foreground)] hover:bg-white"
                    }`}
                  >
                    {moodLabels[item]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="intensity" className="text-sm font-semibold text-[var(--foreground)]">
                Intensity
              </label>
              <span className="text-sm text-[var(--muted-foreground)]">
                {intensity}/5
              </span>
            </div>
            <input
              id="intensity"
              type="range"
              min={1}
              max={5}
              step={1}
              value={intensity}
              onChange={(event) => setIntensity(Number(event.target.value))}
              className="h-2 w-full accent-[var(--accent)]"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="text" className="text-sm font-semibold text-[var(--foreground)]">
                Optional note
              </label>
              <span className="text-sm text-[var(--muted-foreground)]">
                {wordCount} words
              </span>
            </div>
            <textarea
              id="text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="What happened in one to three lines?"
              className="min-h-28 w-full rounded-[1.5rem] border border-transparent bg-white/75 px-4 py-4 text-base text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[rgba(255,106,77,0.28)] focus:bg-white"
            />
          </div>

          <div className="rounded-[1.6rem] bg-white/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Add more signal
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Bring in a song or a voice note when text is not enough.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowMore((current) => !current)}
              >
                {showMore ? "Hide extras" : "Show extras"}
              </Button>
            </div>

            {showMore ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
                    Song title
                    <input
                      value={songTitle}
                      onChange={(event) => setSongTitle(event.target.value)}
                      className="w-full rounded-[1.2rem] bg-white/80 px-4 py-3 text-base font-normal outline-none transition focus:bg-white"
                      placeholder="What song matches the mood?"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-[var(--foreground)]">
                    Artist
                    <input
                      value={songArtist}
                      onChange={(event) => setSongArtist(event.target.value)}
                      className="w-full rounded-[1.2rem] bg-white/80 px-4 py-3 text-base font-normal outline-none transition focus:bg-white"
                      placeholder="Optional artist"
                    />
                  </label>
                </div>

                <VoiceNoteRecorder value={voiceNote} onChange={setVoiceNote} />
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" onClick={submit} disabled={isSubmitting}>
                {isSubmitting ? "Reading your signal..." : "Decode this drop"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/spiral?direct=1")}
              >
                Open calm mode now
              </Button>
            </div>

            <p className="text-sm text-[var(--muted-foreground)]">
              {progressLabel}
            </p>
            {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          </div>
        </section>

        <aside className="space-y-4 rounded-[2rem] bg-[var(--foreground)] p-5 text-[var(--foreground-on-dark)]">
          <p className="text-xs uppercase tracking-[0.28em] text-white/45">
            What comes back
          </p>
          <div className="space-y-4">
            <div className="rounded-[1.5rem] bg-white/8 p-4">
              <p className="text-sm text-white/60">Right away</p>
              <p className="mt-2 text-lg font-semibold">
                One emotional read, one likely trigger, one micro-action, and one
                reflection prompt.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/8 p-4">
              <p className="text-sm text-white/60">If things feel acute</p>
              <p className="mt-2 text-lg font-semibold">
                Elevated-risk language routes to calmer support before anything casual
                or chatty.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/8 p-4">
              <p className="text-sm text-white/60">Across the week</p>
              <p className="mt-2 text-lg font-semibold">
                Mood Replay Studio turns your drops into patterns, what helped,
                emotional arcs, and three therapy-prep bullets.
              </p>
            </div>
          </div>
          <SafetyDisclosure className="text-white/65" />
        </aside>
      </div>
    </div>
  );
}
