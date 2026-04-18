"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SessionBootButton({
  href = "/check-in",
  label = "Open my private space",
  variant = "primary",
  pendingLabel = "Opening...",
  className,
  wrapperClassName,
}: {
  href?: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  pendingLabel?: string;
  className?: string;
  wrapperClassName?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isBooting, setIsBooting] = useState(false);

  useEffect(() => {
    router.prefetch(href);
  }, [href, router]);

  const handleClick = async () => {
    setError("");
    setIsBooting(true);

    try {
      const response = await fetch("/api/session/guest", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("We could not open your private space yet. Try again.");
      }

      router.push(href);
    } catch (bootError) {
      setError(
        bootError instanceof Error
          ? bootError.message
          : "We could not open your private space yet. Try again."
      );
    } finally {
      setIsBooting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", wrapperClassName)}>
      <Button
        onClick={handleClick}
        disabled={isBooting}
        variant={variant}
        className={className}
      >
        {isBooting ? pendingLabel : label}
      </Button>
      {error ? (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      ) : null}
    </div>
  );
}
