import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ShareSummaryCard } from "@/components/share-summary-card";
import { SafetyDisclosure } from "@/components/safety-disclosure";
import { Button } from "@/components/ui/button";
import {
  getCheckInBundle,
  getDefaultRuntime,
  logPageView,
} from "@/lib/services/mooddrop-runtime";
import { getCurrentGuestSession } from "@/lib/server-session";
import { formatDateLabel } from "@/lib/utils";

export default async function CheckInResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentGuestSession();
  if (!session) {
    redirect("/check-in");
  }

  const { id } = await params;
  const bundle = await getCheckInBundle(getDefaultRuntime(), id);

  if (!bundle || bundle.checkIn.sessionId !== session.id) {
    notFound();
  }

  if (bundle.result.kind === "spiral") {
    redirect(`/spiral?checkIn=${bundle.checkIn.id}`);
  }

  await logPageView(getDefaultRuntime(), session.id, "insight_rendered", {
    checkInId: bundle.checkIn.id,
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="space-y-6">
        <div className="rounded-[2rem] bg-[var(--foreground)] p-6 text-[var(--foreground-on-dark)] shadow-[0_30px_70px_rgba(16,16,34,0.24)]">
          <p className="text-xs uppercase tracking-[0.28em] text-white/45">
            Insight
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight">
            {bundle.result.emotionalSummary}
          </h1>
          <p className="mt-6 text-sm uppercase tracking-[0.28em] text-white/45">
            Likely trigger
          </p>
          <p className="mt-2 text-lg leading-8 text-white/88">
            {bundle.result.likelyTrigger}
          </p>
        </div>

        <ShareSummaryCard
          title={bundle.result.shareCard.title}
          summary={bundle.result.shareCard.summary}
          privacyNote={bundle.result.shareCard.privacyNote}
        />
      </section>

      <section className="space-y-4 rounded-[2rem] bg-white/84 p-6 shadow-[0_24px_60px_rgba(16,16,34,0.08)]">
        <div className="rounded-[1.6rem] bg-[rgba(255,106,77,0.08)] p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            One micro-action
          </p>
          <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            {bundle.result.microAction}
          </p>
        </div>

        <div className="rounded-[1.6rem] bg-[rgba(16,16,34,0.05)] p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Reflection prompt
          </p>
          <p className="mt-3 text-lg leading-8 text-[var(--foreground)]">
            {bundle.result.reflectionPrompt}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard">
            <Button>Go to dashboard</Button>
          </Link>
          <Link href="/replay">
            <Button variant="secondary">Open replay studio</Button>
          </Link>
        </div>

        <p className="text-sm text-[var(--muted-foreground)]">
          Logged {formatDateLabel(bundle.checkIn.createdAt)} - intensity{" "}
          {bundle.checkIn.intensity}/5
        </p>
        <SafetyDisclosure />
      </section>
    </div>
  );
}
