import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_20px_50px_rgba(255,106,77,0.25)] hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(255,106,77,0.32)]",
  secondary:
    "bg-[rgba(16,16,34,0.08)] text-[var(--foreground)] hover:bg-[rgba(16,16,34,0.12)]",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:bg-[rgba(16,16,34,0.06)]",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition duration-300 disabled:cursor-not-allowed disabled:opacity-60",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
