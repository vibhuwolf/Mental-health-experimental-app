import Link from "next/link";

import { SafetyDisclosure } from "@/components/safety-disclosure";
import { SessionBootButton } from "@/components/session-boot-button";
import { Button } from "@/components/ui/button";
import {
  getDashboardView,
  getDefaultRuntime,
} from "@/lib/services/mooddrop-runtime";
import { getCurrentGuestSession } from "@/lib/server-session";
import { formatDateLabel } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getCurrentGuestSession();

  if (!session) {
    return (
      <div className="rounded-[2rem] bg-white/80 p-6 shadow-[0_24px_60px_rgba(16,16,34,0.08)]">
        <h1 className="font-[family-name:var(--font-serif)] text-5xl leading-[0.95] tracking-[-0.04em]">
          Your dashboard starts after the first honest drop.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted-foreground)]">
          Start a private session, check in once, and the replay studio starts
          building from there.
        </p>
        <div className="mt-6">
          <SessionBootButton
            href="/check-in"
            label="Start my first 60-second check-in"
          />
        </div>
      </div>
    );
  }

  const dashboard = await getDashboardView(getDefaultRuntime(), session.id);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] bg-[var(--foreground)] p-6 text-[var(--foreground-on-dark)] shadow-[0_30px_70px_rgba(16,16,34,0.24)]">
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">
            Private dashboard
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-serif)] text-5xl leading-[0.95] tracking-[-0.04em]">
            The more honest the signal, the sharper the pattern.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-white/78">
            Use this space to jump back into a quick check-in, see your latest
            read, and open Mood Replay Studio when enough signal is there.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/check-in">
              <Button>New 60-second check-in</Button>
            </Link>
            <Link href="/replay">
              <Button variant="secondary">Open replay studio</Button>
            </Link>
          </div>
        </div>

        <div className="space-y-4 rounded-[2rem] bg-white/84 p-6 shadow-[0_24px_60px_rgba(16,16,34,0.08)]">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              Healthy re-engagement
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {dashboard.consistencyCard.title}
            </h2>
            <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
              {dashboard.consistencyCard.description}
            </p>
          </div>

          <div className="rounded-[1.6rem] bg-[rgba(255,106,77,0.08)] p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              Replay unlock
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--foreground)]">
              {dashboard.replayPreview
                ? dashboard.replayPreview.shareSummary
                : "A few honest drops unlock themes, emotional arcs, and therapy-prep bullets that actually feel usable."}
            </p>
          </div>

          <SafetyDisclosure />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4 rounded-[2rem] bg-white/84 p-6 shadow-[0_24px_60px_rgba(16,16,34,0.08)]">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Latest signal
          </p>
          {dashboard.latestResult ? (
            <div className="rounded-[1.5rem] bg-[rgba(255,106,77,0.08)] p-5">
              <p className="text-xl font-semibold text-[var(--foreground)]">
                {dashboard.latestResult.kind === "insight"
                  ? dashboard.latestResult.emotionalSummary
                  : dashboard.latestResult.headline}
              </p>
              {dashboard.latestResult.kind === "insight" ? (
                <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
                  {dashboard.latestResult.shareCard.summary}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[1.5rem] bg-[rgba(16,16,34,0.05)] p-5">
              <p className="text-lg font-semibold text-[var(--foreground)]">
                No signal yet.
              </p>
              <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">
                Your first check-in unlocks the latest-signal card, replay preview,
                and the calm consistency read above.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] bg-white/84 p-6 shadow-[0_24px_60px_rgba(16,16,34,0.08)]">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Recent drops
          </p>
          <div className="mt-4 space-y-3">
            {dashboard.recentCheckIns.length > 0 ? (
              dashboard.recentCheckIns.map((item) => (
                <Link
                  key={item.id}
                  href={
                    item.kind === "spiral"
                      ? `/spiral?checkIn=${item.id}`
                      : `/check-in/${item.id}`
                  }
                  className="block rounded-[1.4rem] bg-[rgba(16,16,34,0.05)] px-4 py-4 transition hover:bg-[rgba(16,16,34,0.08)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[var(--foreground)]">
                        {item.summary}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {item.mood} - intensity {item.intensity}/5
                      </p>
                    </div>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {formatDateLabel(item.createdAt)}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.4rem] bg-[rgba(16,16,34,0.05)] px-4 py-4">
                <p className="text-lg font-semibold text-[var(--foreground)]">
                  Nothing here yet.
                </p>
                <p className="mt-2 text-base leading-7 text-[var(--muted-foreground)]">
                  Check in once and the dashboard starts turning your drops into
                  something readable instead of scattered.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
