# MOODDROP

MOODDROP is a mobile-first emotional intelligence MVP built for a hackathon demo. It lets users check in with mood, intensity, text, song context, and optional voice notes, then routes the input through a risk gate before returning either a warm reflective insight or a calmer spiral-mode support view.

## What is in this MVP

- Guest-session entry with secure cookie-backed private spaces
- Daily check-in flow with mood tap, intensity, text, song context, and in-browser voice-note recording
- Fast first-use flow with a 60-second quick check-in as the default path
- Conservative risk classification before normal insight generation
- Dedicated spiral mode screen for elevated-risk or direct spiral entry
- Weekly Mood Replay Studio with emotional arcs, themes, triggers, what helped, celebration note, a share-safe summary, and exactly 3 therapy-prep bullets
- Dashboard with recent drops, latest insight snapshot, replay preview, and neutral consistency framing
- Privacy-safe share summaries for insights and replay outputs
- Typed service layer, Zod validation, Drizzle schema, and optional OpenAI + Supabase integrations

## Safety defaults

- MOODDROP always discloses that it is a supportive reflection tool, not a therapist, diagnosis engine, or emergency service
- Elevated-risk language routes to spiral mode before casual reflective output
- The copy layer blocks therapist claims, diagnosis claims, crisis-counseling claims, and dependency-forming language
- Healthy re-engagement is insight-driven, not streak-driven

## Local run

1. Install dependencies: `cmd /c npm.cmd install`
2. Copy `.env.example` to `.env.local` if you want production integrations
3. Start the app: `cmd /c npm.cmd run dev`
4. Open `http://localhost:3000`

For a steadier local demo build, use:

- `cmd /c npm.cmd run demo`

Without env vars, the app still works in demo mode using:

- in-memory guest sessions and check-in storage
- heuristic insight and replay generation
- in-memory voice-note blob serving at `/api/audio/[audioId]`

## Optional production integrations

### Postgres + Drizzle

Set `DATABASE_URL` to enable the Postgres-backed store and use:

- `cmd /c npm.cmd run db:generate`

### OpenAI

Set:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_AUDIO_MODEL`

If these are not set, MOODDROP falls back to deterministic local heuristics for insight, replay, and transcription handling.

### Supabase storage

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_AUDIO_BUCKET`

If these are not set, voice-note uploads stay in the in-memory demo blob store.

## Verification

- `cmd /c npm.cmd run lint`
- `cmd /c npm.cmd run typecheck`
- `cmd /c npm.cmd test`
- `cmd /c npm.cmd run build`
