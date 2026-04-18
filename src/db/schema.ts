import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const guestSessions = pgTable("guest_sessions", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const checkIns = pgTable("check_ins", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => guestSessions.id, { onDelete: "cascade" }),
  mood: text("mood").notNull(),
  intensity: integer("intensity").notNull(),
  text: text("text"),
  songTitle: text("song_title"),
  songArtist: text("song_artist"),
  spiralRequested: boolean("spiral_requested").notNull().default(false),
  transcript: text("transcript"),
  transcriptionError: text("transcription_error"),
  audioUrl: text("audio_url"),
  audioMimeType: text("audio_mime_type"),
  audioSize: integer("audio_size"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insights = pgTable("insights", {
  id: text("id").primaryKey(),
  checkInId: text("check_in_id")
    .notNull()
    .references(() => checkIns.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const riskEvents = pgTable("risk_events", {
  id: text("id").primaryKey(),
  checkInId: text("check_in_id")
    .notNull()
    .references(() => checkIns.id, { onDelete: "cascade" }),
  level: text("level").notNull(),
  reason: text("reason").notNull(),
  payload: jsonb("payload")
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const weeklyReplays = pgTable("weekly_replays", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => guestSessions.id, { onDelete: "cascade" }),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  windowEnd: timestamp("window_end", { withTimezone: true }).notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => guestSessions.id, { onDelete: "cascade" }),
  eventName: text("event_name").notNull(),
  payload: jsonb("payload")
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const guestSessionsRelations = relations(guestSessions, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [guestSessions.profileId],
    references: [profiles.id],
  }),
  checkIns: many(checkIns),
  weeklyReplays: many(weeklyReplays),
  analyticsEvents: many(analyticsEvents),
}));
