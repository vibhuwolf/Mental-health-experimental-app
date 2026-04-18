import { SessionBootButton } from "@/components/session-boot-button";
import { ShareSummaryCard } from "@/components/share-summary-card";
import { SafetyDisclosure } from "@/components/safety-disclosure";
import {
  buildWeeklyReplay,
  getDefaultRuntime,
  logPageView,
} from "@/lib/services/mooddrop-runtime";
import { getCurrentGuestSession } from "@/lib/server-session";

export default async function ReplayPage() {
  const session = await getCurrentGuestSession();

  if (!session) {
    return (
      <div className="rounded-[2rem] bg-white/80 p-6 shadow-[0_24px_60px_rgba(16,16,34,0.08)]">
        <h1 className="font-[family-name:var(--font-serif)] text-5xl leading-[0.95] tracking-[-0.04em]">
          The replay studio needs a little signal first.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted-foreground)]">
          Start a private session, leave a few honest drops, and the week turns
          into themes, patterns, and therapy-prep bullets you can actually use.
        </p>
        <div className="mt-6">
          <SessionBootButton href="/check-in" label="Start and check in" />
        </div>
      </div>
    );
  }

  const replay = await buildWeeklyReplay(getDefaultRuntime(), session.id);
  await logPageView(getDefaultRuntime(), session.id, "replay_viewed", {
    themes: replay.themes.length,
  });

  const hasStudioData = replay.emotionalArc.length > 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <div className="rounded-[2rem] bg-[var(--foreground)] p-6 text-[var(--foreground-on-dark)] shadow-[0_30px_70px_rgba(16,16,34,0.24)]">
          <p className="text-xs uppercase tracking-[0.32em] text-white/45">
            Mood Replay Studio
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-serif)] text-5xl leading-[0.95] tracking-[-0.04em]">
            {replay.toneLine}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-white/78">
            This is the weekly read: what kept repeating, what helped most, and
            what is worth carrying into a deeper conversation.
          </p>
        </div>

        <ShareSummaryCard
          title={replay.shareCard.title}
          summary={replay.shareCard.summary}
          privacyNote={replay.shareCard.privacyNote}
        />
      </section>

      {!hasStudioData ? (
        <section className="rounded-[2rem] bg-white/84 p-6 shadow-[0_24px_60px_rgba(16,16,34,0.08)]">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            What unlocks next
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            One or two more honest drops will make this studio feel personal.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
            The replay already keeps your privacy-safe summary and therapy-prep
            structure ready. More check-ins unlock the emotional arc, repeating
            triggers, and what-helped patterns.
          </p>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-6 rounded-[2rem] bg-white/84 p-6 shadow-[0_24px_60px_rgba(16,16,34,0.08)]">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              Emotional arc
            </p>
            <div className="mt-4 grid gap-3">
              {replay.emotionalArc.length > 0 ? (
                replay.emotionalArc.map((point) => (
                  <div
                    key={`${point.label}-${point.mood}-${point.intensity}`}
                    className="rounded-[1.4rem] bg-[rgba(16,16,34,0.05)] px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                          {point.label}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                          {point.mood}
                        </p>
                      </div>
                      <div className="w-32">
                        <div className="h-2 rounded-full bg-[rgba(16,16,34,0.08)]">
                          <div
                            className="h-2 rounded-full bg-[var(--accent)]"
                            style={{ width: `${point.intensity * 20}%` }}
                          />
                        </div>
                        <p className="mt-2 text-right text-sm text-[var(--muted-foreground)]">
                          intensity {point.intensity}/5
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-base leading-7 text-[var(--muted-foreground)]">
                  Your next few drops will turn this into a readable emotional arc.
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              Top repeating triggers
            </p>
            <ul className="mt-3 space-y-3">
              {replay.triggers.length > 0 ? (
                replay.triggers.map((trigger) => (
                  <li
                    key={trigger}
                    className="rounded-[1.3rem] bg-[rgba(16,16,34,0.05)] px-4 py-4 text-base text-[var(--foreground)]"
                  >
                    {trigger}
                  </li>
                ))
              ) : (
                <li className="rounded-[1.3rem] bg-[rgba(16,16,34,0.05)] px-4 py-4 text-base text-[var(--muted-foreground)]">
                  Triggers get clearer after a few more honest drops.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-6 rounded-[2rem] bg-white/84 p-6 shadow-[0_24px_60px_rgba(16,16,34,0.08)]">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              What helped most
            </p>
            <ul className="mt-3 space-y-3">
              {replay.whatHelped.map((item) => (
                <li
                  key={item}
                  className="rounded-[1.3rem] bg-[rgba(16,16,34,0.05)] px-4 py-4 text-base text-[var(--foreground)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[1.6rem] bg-[rgba(255,106,77,0.08)] p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              Celebration / win
            </p>
            <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
              {replay.celebrationNote}
            </p>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              Therapy-prep bullets
            </p>
            <ol className="mt-3 space-y-3">
              {replay.therapyPrepBullets.map((item) => (
                <li
                  key={item}
                  className="rounded-[1.3rem] bg-[rgba(16,16,34,0.05)] px-4 py-4 text-base text-[var(--foreground)]"
                >
                  {item}
                </li>
              ))}
            </ol>
          </div>

          <SafetyDisclosure />
        </div>
      </section>
    </div>
  );
}
