import { and, desc, eq, gte } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getDb } from "@/db/client";
import {
  analyticsEvents,
  checkIns,
  guestSessions,
  insights,
  profiles,
  riskEvents,
  weeklyReplays,
} from "@/db/schema";
import type { AppStore } from "@/lib/store/types";
import type {
  CheckInBundle,
  CheckInRecord,
  GuestSession,
  WeeklyReplay,
} from "@/types/mooddrop";

function mapCheckIn(record: typeof checkIns.$inferSelect): CheckInRecord {
  return {
    id: record.id,
    sessionId: record.sessionId,
    mood: record.mood as CheckInRecord["mood"],
    intensity: record.intensity,
    text: record.text,
    songTitle: record.songTitle,
    songArtist: record.songArtist,
    spiralRequested: record.spiralRequested,
    transcript: record.transcript,
    transcriptionError: record.transcriptionError,
    audioUrl: record.audioUrl,
    audioMimeType: record.audioMimeType,
    audioSize: record.audioSize,
    status: record.status as CheckInRecord["status"],
    createdAt: record.createdAt.toISOString(),
  };
}

async function mapBundle(checkInId: string) {
  const db = getDb();
  if (!db) {
    throw new Error("Database is not configured.");
  }

  const [record] = await db
    .select()
    .from(checkIns)
    .where(eq(checkIns.id, checkInId))
    .limit(1);

  if (!record) {
    return null;
  }

  const [risk] = await db
    .select()
    .from(riskEvents)
    .where(eq(riskEvents.checkInId, checkInId))
    .orderBy(desc(riskEvents.createdAt))
    .limit(1);

  const [insight] = await db
    .select()
    .from(insights)
    .where(eq(insights.checkInId, checkInId))
    .orderBy(desc(insights.createdAt))
    .limit(1);

  if (!risk || !insight) {
    return null;
  }

  return {
    checkIn: mapCheckIn(record),
    risk: {
      level: risk.level as CheckInBundle["risk"]["level"],
      reason: risk.reason,
      escalatedAt: risk.createdAt.toISOString(),
    },
    result: insight.payload as CheckInBundle["result"],
  } satisfies CheckInBundle;
}

export function createPostgresStore(): AppStore {
  const db = getDb();
  if (!db) {
    throw new Error("Database is not configured.");
  }

  return {
    async createGuestSession() {
      const now = new Date();
      const session: GuestSession = {
        id: `sess_${nanoid(10)}`,
        profileId: `profile_${nanoid(10)}`,
        createdAt: now.toISOString(),
        lastSeenAt: now.toISOString(),
      };

      await db.insert(profiles).values({
        id: session.profileId,
        label: "Guest",
      });

      await db.insert(guestSessions).values({
        id: session.id,
        profileId: session.profileId,
        createdAt: now,
        lastSeenAt: now,
      });

      return session;
    },

    async getGuestSession(sessionId) {
      const [session] = await db
        .select()
        .from(guestSessions)
        .where(eq(guestSessions.id, sessionId))
        .limit(1);

      if (!session) {
        return null;
      }

      return {
        id: session.id,
        profileId: session.profileId,
        createdAt: session.createdAt.toISOString(),
        lastSeenAt: session.lastSeenAt.toISOString(),
      };
    },

    async touchGuestSession(sessionId) {
      await db
        .update(guestSessions)
        .set({
          lastSeenAt: new Date(),
        })
        .where(eq(guestSessions.id, sessionId));
    },

    async createCheckIn(input) {
      const id = `drop_${nanoid(10)}`;

      await db.insert(checkIns).values({
        id,
        sessionId: input.sessionId,
        mood: input.mood,
        intensity: input.intensity,
        text: input.text,
        songTitle: input.songTitle,
        songArtist: input.songArtist,
        spiralRequested: input.spiralRequested,
        audioUrl: input.audioUrl,
        audioMimeType: input.audioMimeType,
        audioSize: input.audioSize,
        status: "pending",
      });

      const [created] = await db
        .select()
        .from(checkIns)
        .where(eq(checkIns.id, id))
        .limit(1);

      if (!created) {
        throw new Error("Failed to create check-in.");
      }

      return mapCheckIn(created);
    },

    async finalizeCheckIn(checkInId, payload) {
      await db
        .update(checkIns)
        .set({
          transcript: payload.transcript,
          transcriptionError: payload.transcriptionError,
          status: "complete",
        })
        .where(eq(checkIns.id, checkInId));

      await db.insert(riskEvents).values({
        id: `risk_${nanoid(10)}`,
        checkInId,
        level: payload.risk.level,
        reason: payload.risk.reason,
        payload: payload.risk,
      });

      await db.insert(insights).values({
        id: `ins_${nanoid(10)}`,
        checkInId,
        kind: payload.result.kind,
        payload: payload.result,
      });

      const bundle = await mapBundle(checkInId);
      if (!bundle) {
        throw new Error("Failed to finalize check-in.");
      }

      return bundle;
    },

    async getCheckInBundle(checkInId) {
      return mapBundle(checkInId);
    },

    async listRecentCheckIns(sessionId, limit) {
      const records = await db
        .select({ id: checkIns.id })
        .from(checkIns)
        .where(eq(checkIns.sessionId, sessionId))
        .orderBy(desc(checkIns.createdAt))
        .limit(limit);

      const bundles = await Promise.all(records.map((record) => mapBundle(record.id)));
      return bundles.filter((value): value is CheckInBundle => Boolean(value));
    },

    async listCheckInsForWindow(sessionId, windowStartIso) {
      const records = await db
        .select({ id: checkIns.id })
        .from(checkIns)
        .where(
          and(
            eq(checkIns.sessionId, sessionId),
            gte(checkIns.createdAt, new Date(windowStartIso))
          )
        )
        .orderBy(desc(checkIns.createdAt));

      const bundles = await Promise.all(records.map((record) => mapBundle(record.id)));
      return bundles.filter((value): value is CheckInBundle => Boolean(value));
    },

    async getLatestWeeklyReplay(sessionId) {
      const [record] = await db
        .select()
        .from(weeklyReplays)
        .where(eq(weeklyReplays.sessionId, sessionId))
        .orderBy(desc(weeklyReplays.createdAt))
        .limit(1);

      if (!record) {
        return null;
      }

      return record.payload as WeeklyReplay;
    },

    async saveWeeklyReplay(replay) {
      await db.insert(weeklyReplays).values({
        id: replay.id,
        sessionId: replay.sessionId,
        windowStart: new Date(replay.windowStart),
        windowEnd: new Date(replay.windowEnd),
        payload: replay,
      });

      return replay;
    },

    async logAnalytics(event) {
      await db.insert(analyticsEvents).values({
        id: event.id,
        sessionId: event.sessionId,
        eventName: event.eventName,
        payload: event.payload,
        createdAt: new Date(event.createdAt),
      });
    },
  };
}
