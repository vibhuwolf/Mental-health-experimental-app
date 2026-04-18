"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ShareSummaryCard({
  title,
  summary,
  privacyNote,
}: {
  title: string;
  summary: string;
  privacyNote: string;
}) {
  const [status, setStatus] = useState("");

  const shareText = `${title}\n${summary}\n\nMOODDROP — supportive reflection, not therapy.`;

  const handleShare = async () => {
    setStatus("");

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: shareText,
        });
        setStatus("Shared with summary only.");
        return;
      }

      await navigator.clipboard.writeText(shareText);
      setStatus("Summary copied.");
    } catch {
      setStatus("Sharing did not go through. You can still copy the summary manually.");
    }
  };

  return (
    <div className="rounded-[1.6rem] border border-[rgba(16,16,34,0.08)] bg-white/86 p-5 shadow-[0_16px_40px_rgba(16,16,34,0.06)]">
      <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted-foreground)]">
        Shareable summary
      </p>
      <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="mt-3 text-base leading-7 text-[var(--foreground)]">
        {summary}
      </p>
      <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
        {privacyNote}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={handleShare}>
          Copy or share
        </Button>
        {status ? (
          <span className="text-sm text-[var(--muted-foreground)]">{status}</span>
        ) : null}
      </div>
    </div>
  );
}
