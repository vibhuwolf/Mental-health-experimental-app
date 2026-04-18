"use client";

import { motion } from "framer-motion";

import { SafetyDisclosure } from "@/components/safety-disclosure";
import { SessionBootButton } from "@/components/session-boot-button";
import {
  appPromise,
  howItWorksSteps,
  landingSampleInsight,
  landingSampleReplay,
} from "@/lib/safety/copy";

export function LandingPoster() {
  return (
    <div className="relative overflow-hidden px-4 py-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="relative mx-auto min-h-[calc(100svh-2rem)] max-w-6xl overflow-hidden rounded-[2.25rem] border border-white/50 bg-[linear-gradient(180deg,rgba(255,249,244,0.98),rgba(255,243,236,0.94))] px-5 py-6 shadow-[0_30px_100px_rgba(30,18,12,0.12)] sm:px-8 sm:py-8"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,126,98,0.12),transparent_34%),radial-gradient(circle_at_20%_70%,rgba(255,216,196,0.28),transparent_24%)]" />

        <header className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted-foreground)]">
              MOODDROP
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted-foreground)]">
              Private emotional signal for messy student life, voice-note spirals,
              and weekly clarity.
            </p>
          </div>

          <SessionBootButton
            href="/dashboard"
            label="Open private dashboard"
            pendingLabel="Opening dashboard..."
            variant="ghost"
            className="min-h-10 px-4"
            wrapperClassName="items-end"
          />
        </header>

        <section className="relative mt-8 grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-end">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-[rgba(16,16,34,0.08)] bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
              Start in under a minute
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl font-[family-name:var(--font-serif)] text-6xl leading-[0.92] tracking-[-0.05em] text-[var(--foreground)] sm:text-7xl">
                Drop how you feel.
                <br />
                Get one sharp signal back.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
                {appPromise}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SessionBootButton
                href="/check-in"
                label="Start a 60-second check-in"
                pendingLabel="Opening check-in..."
              />
              <SessionBootButton
                href="/spiral?direct=1"
                label="Open calm mode"
                pendingLabel="Opening calm mode..."
                variant="secondary"
              />
            </div>

            <div className="grid gap-3 rounded-[1.8rem] border border-white/65 bg-white/55 p-4 backdrop-blur sm:grid-cols-3">
              {howItWorksSteps.map((step, index) => (
                <div key={step} className="rounded-[1.35rem] bg-white/70 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                    0{index + 1}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            <SafetyDisclosure className="max-w-2xl" />
          </div>

          <div className="space-y-4">
            <div className="rounded-[2rem] bg-[var(--foreground)] p-6 text-[var(--foreground-on-dark)] shadow-[0_24px_70px_rgba(16,16,34,0.24)]">
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">
                Sample outcome
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">
                {landingSampleInsight.title}
              </h2>
              <p className="mt-4 text-lg leading-8 text-white/82">
                {landingSampleInsight.summary}
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_24px_60px_rgba(16,16,34,0.08)]">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
                Mood Replay Studio
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {landingSampleReplay.summary}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {landingSampleReplay.themes.map((theme) => (
                  <span
                    key={theme}
                    className="rounded-full bg-[rgba(255,106,77,0.1)] px-4 py-2 text-sm text-[var(--foreground)]"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
