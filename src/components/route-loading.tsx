export function RouteLoading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] bg-[rgba(255,249,244,0.92)] p-6 shadow-[0_24px_60px_rgba(16,16,34,0.08)]">
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-serif)] text-5xl leading-[0.95] tracking-[-0.04em] text-[var(--foreground)]">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
        {description}
      </p>
    </div>
  );
}
