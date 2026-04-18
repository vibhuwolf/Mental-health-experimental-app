import { nanoid } from "nanoid";

import type {
  AnalyticsEvent,
  CheckInBundle,
  CheckInRecord,
  CreateCheckInRecordInput,
  GuestSession,
  WeeklyReplay,
} from "@/types/mooddrop";
import type { AppStore } from "@/lib/store/types";
import { stableNow } from "@/lib/utils";

interface MemoryState {
  sessions: Map<string, GuestSession>;
  checkIns: Map<string, CheckInRecord>;
  bundles: Map<string, CheckInBundle>;
  replays: Map<string, WeeklyReplay>;
  analytics: AnalyticsEvent[];
}

function createState(): MemoryState {
  return {
    sessions: new Map(),
    checkIns: new Map(),
    bundles: new Map(),
    replays: new Map(),
    analytics: [],
  };
}

const globalState =
  (globalThis as { __MOODDROP_MEMORY__?: MemoryState }).__MOODDROP_MEMORY__ ??
  createState();

(globalThis as { __MOODDROP_MEMORY__?: MemoryState }).__MOODDROP_MEMORY__ =
  globalState;

function createGuest(): GuestSession {
  const now = stableNow();

  return {
    id: `sess_${nanoid(10)}`,
    profileId: `profile_${nanoid(10)}`,
    createdAt: now,
    lastSeenAt: now,
  };
}

function createCheckInRecord(input: CreateCheckInRecordInput): CheckInRecord {
  return {
    id: `drop_${nanoid(10)}`,
    sessionId: input.sessionId,
    mood: input.mood,
    intensity: input.intensity,
    text: input.text,
    songTitle: input.songTitle,
    songArtist: input.songArtist,
    spiralRequested: input.spiralRequested,
    transcript: null,
    transcriptionError: null,
    audioUrl: input.audioUrl,
    audioMimeType: input.audioMimeType,
    audioSize: input.audioSize,
    status: "pending",
    createdAt: stableNow(),
  };
}

export function createMemoryStore(shared = false): AppStore {
  const state = shared ? globalState : createState();

  return {
    async createGuestSession() {
      const session = createGuest();
      state.sessions.set(session.id, session);
      return session;
    },

    async getGuestSession(sessionId) {
      return state.sessions.get(sessionId) ?? null;
    },

    async touchGuestSession(sessionId) {
      const current = state.sessions.get(sessionId);
      if (!current) {
        return;
      }

      state.sessions.set(sessionId, {
        ...current,
        lastSeenAt: stableNow(),
      });
    },

    async createCheckIn(input) {
      const record = createCheckInRecord(input);
      state.checkIns.set(record.id, record);
      return record;
    },

    async finalizeCheckIn(checkInId, payload) {
      const existing = state.checkIns.get(checkInId);
      if (!existing) {
        throw new Error("Check-in not found.");
      }

      const checkIn: CheckInRecord = {
        ...existing,
        transcript: payload.transcript,
        transcriptionError: payload.transcriptionError,
        status: "complete",
      };

      const bundle: CheckInBundle = {
        checkIn,
        risk: payload.risk,
        result: payload.result,
      };

      state.checkIns.set(checkInId, checkIn);
      state.bundles.set(checkInId, bundle);

      return bundle;
    },

    async getCheckInBundle(checkInId) {
      return state.bundles.get(checkInId) ?? null;
    },

    async listRecentCheckIns(sessionId, limit) {
      return [...state.bundles.values()]
        .filter((bundle) => bundle.checkIn.sessionId === sessionId)
        .sort((left, right) =>
          right.checkIn.createdAt.localeCompare(left.checkIn.createdAt)
        )
        .slice(0, limit);
    },

    async listCheckInsForWindow(sessionId, windowStartIso) {
      return [...state.bundles.values()]
        .filter(
          (bundle) =>
            bundle.checkIn.sessionId === sessionId &&
            bundle.checkIn.createdAt >= windowStartIso
        )
        .sort((left, right) =>
          left.checkIn.createdAt.localeCompare(right.checkIn.createdAt)
        );
    },

    async getLatestWeeklyReplay(sessionId) {
      return (
        [...state.replays.values()]
          .filter((replay) => replay.sessionId === sessionId)
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ??
        null
      );
    },

    async saveWeeklyReplay(replay) {
      state.replays.set(replay.id, replay);
      return replay;
    },

    async logAnalytics(event) {
      state.analytics.push(event);
    },
  };
}
