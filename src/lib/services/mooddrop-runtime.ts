import { nanoid } from "nanoid";

import { createAiProvider, buildSpiralSupportResult } from "@/lib/ai/provider";
import { hasPostgres } from "@/lib/env";
import { getSupportiveDisclosure, buildConsistencyCard } from "@/lib/safety/copy";
import { normalizeFreeText } from "@/lib/safety/policy";
import { saveAudioFile } from "@/lib/store/audio-store";
import { createMemoryStore } from "@/lib/store/memory-store";
import { createPostgresStore } from "@/lib/store/postgres-store";
import type { AppStore } from "@/lib/store/types";
import { checkInInputSchema } from "@/lib/validation/mooddrop";
import type {
  AnalyticsEvent,
  CheckInInput,
  DashboardViewModel,
  WeeklyReplay,
} from "@/types/mooddrop";
import { stableNow } from "@/lib/utils";

type RuntimeMode = "auto" | "memory" | "postgres";

export interface MooddropRuntime {
  store: AppStore;
  ai: ReturnType<typeof createAiProvider>;
}

export interface CreateRuntimeOptions {
  mode?: RuntimeMode;
  aiOverrides?: Partial<ReturnType<typeof createAiProvider>>;
}

function createDefaultStore(mode: RuntimeMode) {
  if (mode === "memory") {
    return createMemoryStore();
  }

  if (mode === "postgres") {
    return createPostgresStore();
  }

  if (hasPostgres) {
    try {
      return createPostgresStore();
    } catch {
      return createMemoryStore(true);
    }
  }

  return createMemoryStore(true);
}

export function createRuntime(options: CreateRuntimeOptions = {}): MooddropRuntime {
  const ai = createAiProvider();

  return {
    store: createDefaultStore(options.mode ?? "auto"),
    ai: {
      ...ai,
      ...options.aiOverrides,
    },
  };
}

const defaultRuntime = createRuntime();

function buildAnalyticsEvent(
  sessionId: string,
  eventName: AnalyticsEvent["eventName"],
  payload: AnalyticsEvent["payload"]
): AnalyticsEvent {
  return {
    id: `evt_${nanoid(10)}`,
    sessionId,
    eventName,
    payload,
    createdAt: stableNow(),
  };
}

export async function createGuestSession(runtime: MooddropRuntime = defaultRuntime) {
  const session = await runtime.store.createGuestSession();

  await runtime.store.logAnalytics(
    buildAnalyticsEvent(session.id, "session_started", {
      profileId: session.profileId,
    })
  );

  return session;
}

export async function getGuestSession(
  sessionId: string,
  runtime: MooddropRuntime = defaultRuntime
) {
  const session = await runtime.store.getGuestSession(sessionId);
  if (session) {
    await runtime.store.touchGuestSession(sessionId);
  }
  return session;
}

function combineCheckInText(input: CheckInInput, transcript: string | null) {
  return normalizeFreeText([input.text, transcript].filter(Boolean).join(" "));
}

export async function submitCheckIn(
  runtime: MooddropRuntime,
  sessionId: string,
  input: CheckInInput
) {
  const validated = checkInInputSchema.parse(input);
  const session = await runtime.store.getGuestSession(sessionId);

  if (!session) {
    throw new Error("Guest session not found.");
  }

  let audioUrl: string | null = null;
  let transcript: string | null = null;
  let transcriptionError: string | null = null;

  if (validated.audioFile) {
    const storedAudio = await saveAudioFile(validated.audioFile);
    audioUrl = storedAudio.url;

    const transcription = await runtime.ai.transcribeAudio(validated.audioFile);
    transcript = transcription.transcript;
    transcriptionError = transcription.error;
  }

  const record = await runtime.store.createCheckIn({
    sessionId,
    mood: validated.mood,
    intensity: validated.intensity,
    text: validated.text ?? null,
    songTitle: validated.songTitle ?? null,
    songArtist: validated.songArtist ?? null,
    spiralRequested: validated.spiralRequested ?? false,
    audioUrl,
    audioMimeType: validated.audioFile?.type ?? null,
    audioSize: validated.audioFile?.size ?? null,
  });

  const combinedText = combineCheckInText(validated, transcript);
  const recentBundles = await runtime.store.listRecentCheckIns(sessionId, 4);
  const risk = await runtime.ai.classifyRisk({
    text: combinedText,
    mood: validated.mood,
    intensity: validated.intensity,
    spiralRequested: validated.spiralRequested ?? false,
  });

  const result =
    risk.level === "elevated"
      ? buildSpiralSupportResult(risk.reason)
      : await runtime.ai.generateInsight({
          checkIn: {
            ...record,
            transcript,
          },
          combinedText,
          recentBundles,
        });

  const finalized = await runtime.store.finalizeCheckIn(record.id, {
    transcript,
    transcriptionError,
    risk,
    result,
  });

  await runtime.store.logAnalytics(
    buildAnalyticsEvent(sessionId, "check_in_submitted", {
      kind: finalized.result.kind,
      mood: finalized.checkIn.mood,
      intensity: finalized.checkIn.intensity,
      hasAudio: Boolean(validated.audioFile),
    })
  );

  if (finalized.result.kind === "spiral") {
    await runtime.store.logAnalytics(
      buildAnalyticsEvent(sessionId, "risk_routed", {
        reason: finalized.risk.reason,
      })
    );
  }

  return finalized;
}

function toReplay(
  sessionId: string,
  windowStart: string,
  windowEnd: string,
  payload: Pick<
    WeeklyReplay,
    | "themes"
    | "triggers"
    | "whatHelped"
    | "celebrationNote"
    | "therapyPrepBullets"
    | "toneLine"
    | "emotionalArc"
    | "shareCard"
  >
): WeeklyReplay {
  return {
    id: `replay_${nanoid(10)}`,
    sessionId,
    windowStart,
    windowEnd,
    themes: payload.themes,
    triggers: payload.triggers,
    whatHelped: payload.whatHelped,
    emotionalArc: payload.emotionalArc,
    celebrationNote: payload.celebrationNote,
    therapyPrepBullets: payload.therapyPrepBullets,
    toneLine: payload.toneLine,
    shareCard: payload.shareCard,
    disclaimer: getSupportiveDisclosure(),
    createdAt: stableNow(),
  };
}

export async function buildWeeklyReplay(
  runtime: MooddropRuntime,
  sessionId: string
) {
  const session = await runtime.store.getGuestSession(sessionId);
  if (!session) {
    throw new Error("Guest session not found.");
  }

  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - 7);
  const windowStartIso = windowStart.toISOString();
  const windowEndIso = now.toISOString();
  const bundles = await runtime.store.listCheckInsForWindow(sessionId, windowStartIso);
  const payload = await runtime.ai.generateWeeklyReplay({
    sessionId,
    bundles,
    windowStart: windowStartIso,
    windowEnd: windowEndIso,
  });
  const replay = toReplay(sessionId, windowStartIso, windowEndIso, payload);

  return runtime.store.saveWeeklyReplay(replay);
}

export async function getCheckInBundle(
  runtime: MooddropRuntime,
  checkInId: string
) {
  return runtime.store.getCheckInBundle(checkInId);
}

export async function getDashboardView(
  runtime: MooddropRuntime,
  sessionId: string
): Promise<DashboardViewModel> {
  const recent = await runtime.store.listRecentCheckIns(sessionId, 5);
  const replay = await runtime.store.getLatestWeeklyReplay(sessionId);
  const days = new Set(
    recent.map((bundle) => bundle.checkIn.createdAt.slice(0, 10))
  ).size;

  return {
    sessionId,
    latestResult: recent[0]?.result ?? null,
    recentCheckIns: recent.map((bundle) => ({
      id: bundle.checkIn.id,
      mood: bundle.checkIn.mood,
      intensity: bundle.checkIn.intensity,
      createdAt: bundle.checkIn.createdAt,
      summary:
        bundle.result.kind === "insight"
          ? bundle.result.emotionalSummary
          : bundle.result.headline,
      kind: bundle.result.kind,
    })),
    replayAvailable: Boolean(replay ?? recent.length),
    replayPreview: replay
      ? {
          themes: replay.themes.slice(0, 3),
          celebrationNote: replay.celebrationNote,
          shareSummary: replay.shareCard.summary,
        }
      : null,
    consistencyCard: buildConsistencyCard(days),
  };
}

export async function logPageView(
  runtime: MooddropRuntime,
  sessionId: string,
  eventName: AnalyticsEvent["eventName"],
  payload: AnalyticsEvent["payload"] = {}
) {
  await runtime.store.logAnalytics(
    buildAnalyticsEvent(sessionId, eventName, payload)
  );
}

export function getDefaultRuntime() {
  return defaultRuntime;
}
