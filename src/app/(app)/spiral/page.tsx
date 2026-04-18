import Link from "next/link";

import { SafetyDisclosure } from "@/components/safety-disclosure";
import { SessionBootButton } from "@/components/session-boot-button";
import { Button } from "@/components/ui/button";
import {
  getCheckInBundle,
  getDefaultRuntime,
  logPageView,
} from "@/lib/services/mooddrop-runtime";
import { getCurrentGuestSession } from "@/lib/server-session";

export default async function SpiralPage({
  searchParams,
}: {
  searchParams: Promise<{ checkIn?: string; direct?: string }>;
}) {
  const params = await searchParams;
  const session = await getCurrentGuestSession();

  if (!session && !params.direct) {
    return (
      <div className="rounded-[2rem] bg-white/80 p-6 shadow-[0_24px_60px_rgba(16,16,34,0.08)]">
        <h1 className="font-[family-name:var(--font-serif)] text-5xl leading-[0.95] tracking-[-0.04em]">
          Spiral mode lives inside your private space.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted-foreground)]">
          Open a guest session and you can come straight back here whenever the moment gets too loud.
        </p>
        <div className="mt-6">
          <SessionBootButton href="/spiral?direct=1" label="Open private spiral mode" />
        </div>
      </div>
    );
  }

  let headline = "Keep this moment small and safe.";
  let groundingAction =
    "Plant both feet, unclench your jaw, and name five things you can see before you decide the next move.";
  let reachOutPath =
    "Text or call a trusted person and tell them you need steady company right now. If you are in immediate danger, contact local emergency support now.";
  let note =
    "You do not have to solve the whole week right now. One grounded step is enough.";

  if (params.checkIn && session) {
    const bundle = await getCheckInBundle(getDefaultRuntime(), params.checkIn);
    if (bundle?.checkIn.sessionId === session.id && bundle.result.kind === "spiral") {
      headline = bundle.result.headline;
      groundingAction = bundle.result.groundingAction;
      reachOutPath = bundle.result.reachOutPath;
      note = bundle.result.note;
    }
  }

  if (session) {
    await logPageView(getDefaultRuntime(), session.id, "spiral_rendered", {
      direct: Boolean(params.direct),
      fromCheckIn: Boolean(params.checkIn),
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[2rem] bg-[linear-gradient(180deg,#1b1730,#0f1020)] p-6 text-[var(--foreground-on-dark)] shadow-[0_30px_70px_rgba(9,10,22,0.35)]">
        <p className="text-xs uppercase tracking-[0.32em] text-white/45">
          Spiral mode
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-serif)] text-5xl leading-[0.95] tracking-[-0.04em]">
          {headline}
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-8 text-white/78">{note}</p>
      </section>

      <section className="space-y-4 rounded-[2rem] bg-white/84 p-6 shadow-[0_24px_60px_rgba(16,16,34,0.08)]">
        <div className="rounded-[1.6rem] bg-[rgba(255,106,77,0.08)] p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            One grounding action
          </p>
          <p className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            {groundingAction}
          </p>
        </div>
        <div className="rounded-[1.6rem] bg-[rgba(16,16,34,0.05)] p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            One reach-out path
          </p>
          <p className="mt-3 text-lg leading-8 text-[var(--foreground)]">
            {reachOutPath}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/check-in">
            <Button>Back to check-in</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">Go to dashboard</Button>
          </Link>
        </div>
        <SafetyDisclosure />
      </section>
    </div>
  );
}
