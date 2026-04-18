import { getSupportiveDisclosure } from "@/lib/safety/copy";

export function SafetyDisclosure({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-xs leading-5 text-[var(--muted-foreground)] ${className}`}
    >
      {getSupportiveDisclosure()}
    </p>
  );
}
