import { CheckInComposer } from "@/components/check-in/check-in-composer";
import { SessionBootButton } from "@/components/session-boot-button";
import { SafetyDisclosure } from "@/components/safety-disclosure";
import { getCurrentGuestSession } from "@/lib/server-session";

export default async function CheckInPage() {
  const session = await getCurrentGuestSession();

  if (!session) {
    return (
      <div className="rounded-[2rem] bg-white/80 p-6 shadow-[0_24px_60px_rgba(16,16,34,0.08)]">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
          Private space required
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-serif)] text-5xl leading-[0.95] tracking-[-0.04em]">
          Open your private check-in space first.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted-foreground)]">
          MOODDROP keeps this flow private by default. Start a guest session, then your drops and replay stay tied to the same space.
        </p>
        <div className="mt-6">
          <SessionBootButton href="/check-in" label="Start a private session" />
        </div>
        <SafetyDisclosure className="mt-5 max-w-xl" />
      </div>
    );
  }

  return <CheckInComposer />;
}
