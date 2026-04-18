import OpenAI, { toFile } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { env, hasOpenAiAudio, hasOpenAiText } from "@/lib/env";
import { spiralModeCopy } from "@/lib/safety/copy";
import {
  assertSafeAssistantCopy,
  assertSafeObjectCopy,
  normalizeFreeText,
  SUPPORTIVE_DISCLOSURE,
} from "@/lib/safety/policy";
import type {
  AudioFileInput,
  CheckInBundle,
  CheckInInput,
  CheckInRecord,
  EmotionalArcPoint,
  InsightResult,
  RiskResult,
  ShareCardViewModel,
  WeeklyReplay,
} from "@/types/mooddrop";

const insightSchema = z.object({
  emotionalSummary: z.string().min(12).max(160),
  likelyTrigger: z.string().min(8).max(140),
  microAction: z.string().min(12).max(180),
  reflectionPrompt: z.string().min(12).max(180),
});

const replaySchema = z.object({
  themes: z.array(z.string().min(3).max(80)).max(4),
  triggers: z.array(z.string().min(3).max(80)).max(4),
  whatHelped: z.array(z.string().min(3).max(80)).max(4),
  celebrationNote: z.string().min(12).max(180),
  therapyPrepBullets: z.tuple([
    z.string().min(8),
    z.string().min(8),
    z.string().min(8),
  ]),
  toneLine: z.string().min(12).max(140),
});

export interface AiProvider {
  transcribeAudio(audioFile: AudioFileInput): Promise<{
    transcript: string | null;
    error: string | null;
  }>;
  classifyRisk(input: {
    text: string;
    mood: CheckInInput["mood"];
    intensity: number;
    spiralRequested: boolean;
  }): Promise<RiskResult>;
  generateInsight(input: {
    checkIn: CheckInRecord;
    combinedText: string;
    recentBundles: CheckInBundle[];
  }): Promise<InsightResult>;
  generateWeeklyReplay(input: {
    sessionId: string;
    bundles: CheckInBundle[];
    windowStart: string;
    windowEnd: string;
  }): Promise<
    Pick<
      WeeklyReplay,
      | "themes"
      | "triggers"
      | "whatHelped"
      | "celebrationNote"
      | "therapyPrepBullets"
      | "toneLine"
      | "emotionalArc"
      | "shareCard"
    >
  >;
}

const elevatedRiskPatterns = [
  /\bkill myself\b/i,
  /\bsuicid(?:e|al)\b/i,
  /\bhurt myself\b/i,
  /\bself harm\b/i,
  /\bdo not want to be here\b/i,
  /\bdon't want to be here\b/i,
  /\bwant to disappear forever\b/i,
  /\bend it all\b/i,
];

const groundingActions = [
  "Take one full glass of water, then sit somewhere with both feet on the floor for ninety seconds.",
  "Open a window or step outside for one minute and let your breathing slow before you decide the next step.",
  "Put your phone down, roll your shoulders once, and name five things you can see in the room.",
];

const microActions = [
  "Mute the noisiest tab, take a two-song walk, and come back only after your body feels one notch quieter.",
  "Write the one thing that feels heaviest, then cross out everything that does not need tonight.",
  "Set a ten-minute soft reset: water, fresh air, and one low-stakes task that proves the day is still moveable.",
];

function truncateSentence(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function buildShareCard(title: string, summary: string): ShareCardViewModel {
  return assertSafeObjectCopy({
    title: assertSafeAssistantCopy(title),
    summary: assertSafeAssistantCopy(truncateSentence(summary, 150)),
    privacyNote: assertSafeAssistantCopy(
      "Summary only. Raw notes and voice transcripts stay private."
    ),
  });
}

function buildInsightShareCard(
  emotionalSummary: string,
  microAction: string
): ShareCardViewModel {
  return buildShareCard(
    "My MOODDROP signal",
    `${emotionalSummary} Next step: ${microAction}`
  );
}

function buildReplayShareCard(
  toneLine: string,
  whatHelped: string[],
  themes: string[]
): ShareCardViewModel {
  const supportingLine =
    whatHelped[0] ??
    themes[0] ??
    "This week still left enough signal to reflect on with more honesty.";

  return buildShareCard(
    "My weekly Mood Replay",
    `${toneLine} What helped most: ${supportingLine}`
  );
}

function buildEmotionalArc(bundles: CheckInBundle[]): EmotionalArcPoint[] {
  return [...bundles]
    .sort((left, right) =>
      left.checkIn.createdAt.localeCompare(right.checkIn.createdAt)
    )
    .slice(-7)
    .map((bundle) => ({
      label: new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
      }).format(new Date(bundle.checkIn.createdAt)),
      mood: bundle.checkIn.mood,
      intensity: bundle.checkIn.intensity,
    }));
}

function getOpenAiClient() {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
}

function inferTrigger(
  text: string,
  checkIn: Pick<CheckInRecord, "songTitle" | "songArtist">
) {
  const normalized = normalizeFreeText(text).toLowerCase();

  if (normalized.includes("school") || normalized.includes("class")) {
    return "school pressure and social spillover";
  }

  if (normalized.includes("deadline") || normalized.includes("work")) {
    return "a stack of pressure with not enough breathing room";
  }

  if (normalized.includes("chat") || normalized.includes("message")) {
    return "social noise and unread-message tension";
  }

  if (checkIn.songTitle) {
    return `the emotional tone around ${checkIn.songTitle}${checkIn.songArtist ? ` by ${checkIn.songArtist}` : ""}`;
  }

  return "a mix of emotional noise and low recovery time";
}

function inferSummary(checkIn: CheckInRecord, combinedText: string) {
  const text = normalizeFreeText(combinedText).toLowerCase();

  if (checkIn.mood === "heavy") {
    return "You sound emotionally weighted down and close to overload.";
  }

  if (checkIn.mood === "wired") {
    return "Your energy feels sharp, overactivated, and hard to settle.";
  }

  if (checkIn.mood === "overthinking") {
    return "Your brain is looping faster than your body can recover.";
  }

  if (text.includes("lighter") || checkIn.mood === "hopeful") {
    return "There is real softness here, even if the day was not easy.";
  }

  return "You seem stretched between pressure and the need for a clean reset.";
}

function selectMicroAction(
  checkIn: CheckInRecord,
  combinedText: string,
  recentBundles: CheckInBundle[]
) {
  const text = normalizeFreeText(combinedText).toLowerCase();
  const repeatedHighIntensity = recentBundles.filter(
    (bundle) => bundle.checkIn.intensity >= 4
  ).length;
  const repeatedMood = recentBundles.filter(
    (bundle) => bundle.checkIn.mood === checkIn.mood
  ).length;

  if (repeatedHighIntensity >= 2 || repeatedMood >= 2) {
    return "Shrink the next fifteen minutes: dim the brightest screen, drink water, and do one tiny task before reopening the whole emotional tab stack.";
  }

  if (text.includes("music") || checkIn.songTitle) {
    return "Use one steady song on purpose, not on loop, then let the silence after it tell you what still feels loud.";
  }

  if (checkIn.audioUrl) {
    return "Replay your own voice note once, pull out the one sentence that felt truest, and let that be the only part you solve tonight.";
  }

  return microActions[(checkIn.intensity + combinedText.length) % microActions.length];
}

function fallbackInsight(
  checkIn: CheckInRecord,
  combinedText: string,
  recentBundles: CheckInBundle[]
): InsightResult {
  const summary = inferSummary(checkIn, combinedText);
  const likelyTrigger = inferTrigger(combinedText, checkIn);
  const microAction = selectMicroAction(checkIn, combinedText, recentBundles);
  const reflectionPrompt =
    checkIn.intensity >= 4
      ? "What is the smallest part of tonight that actually needs your attention, and what can wait until tomorrow?"
      : "What helped you feel even ten percent more like yourself this week?";

  return assertSafeObjectCopy({
    kind: "insight" as const,
    emotionalSummary: assertSafeAssistantCopy(summary),
    likelyTrigger: assertSafeAssistantCopy(
      `The strongest signal looks like ${likelyTrigger}.`
    ),
    microAction: assertSafeAssistantCopy(microAction),
    reflectionPrompt: assertSafeAssistantCopy(reflectionPrompt),
    shareCard: buildInsightShareCard(summary, microAction),
    disclaimer: SUPPORTIVE_DISCLOSURE,
  });
}

function fallbackReplay(
  bundles: CheckInBundle[],
  windowStart: string,
  windowEnd: string
) {
  if (bundles.length === 0) {
    const toneLine = `Your replay window from ${new Date(windowStart).toLocaleDateString()} to ${new Date(windowEnd).toLocaleDateString()} is still blank, which means the next honest drop becomes the anchor.`;
    const whatHelped = [
      "Even one honest check-in next week will start building signal.",
    ];

    return assertSafeObjectCopy({
      themes: [] as string[],
      triggers: [] as string[],
      whatHelped,
      emotionalArc: [] as EmotionalArcPoint[],
      celebrationNote:
        "You opened the app. That still counts as choosing awareness over autopilot.",
      therapyPrepBullets: [
        "What moments this week felt hardest to name?",
        "Which time of day usually held the most tension?",
        "What kind of support felt easiest to accept?",
      ] as [string, string, string],
      toneLine,
      shareCard: buildReplayShareCard(toneLine, whatHelped, []),
    });
  }

  const themeCounts = new Map<string, number>();
  const triggerCounts = new Map<string, number>();
  const helpedCounts = new Map<string, number>();

  for (const bundle of bundles) {
    const summary =
      bundle.result.kind === "insight"
        ? bundle.result.emotionalSummary
        : bundle.result.headline;
    const trigger =
      bundle.result.kind === "insight"
        ? bundle.result.likelyTrigger.replace(
            /^The strongest signal looks like /,
            ""
          )
        : bundle.risk.reason;

    themeCounts.set(summary, (themeCounts.get(summary) ?? 0) + 1);
    triggerCounts.set(trigger, (triggerCounts.get(trigger) ?? 0) + 1);

    const text = normalizeFreeText(
      [bundle.checkIn.text, bundle.checkIn.transcript].filter(Boolean).join(" ")
    ).toLowerCase();

    if (text.includes("walk")) {
      helpedCounts.set(
        "walking gave your nervous system more space",
        (helpedCounts.get("walking gave your nervous system more space") ?? 0) +
          1
      );
    }
    if (text.includes("sleep") || text.includes("rest")) {
      helpedCounts.set(
        "rest keeps showing up as recovery, not laziness",
        (helpedCounts.get("rest keeps showing up as recovery, not laziness") ??
          0) + 1
      );
    }
    if (text.includes("music") || bundle.checkIn.songTitle) {
      helpedCounts.set(
        "music is acting like an emotional bridge, not just background noise",
        (helpedCounts.get(
          "music is acting like an emotional bridge, not just background noise"
        ) ?? 0) + 1
      );
    }
  }

  const themes = [...themeCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([theme]) => theme);
  const triggers = [...triggerCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([trigger]) => trigger);
  const whatHelped = [...helpedCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([helped]) => helped);
  const toneLine =
    "Your week keeps circling the same few pressure points, but there are also clear moments where your body responded well to softer resets.";

  return assertSafeObjectCopy({
    themes,
    triggers,
    whatHelped:
      whatHelped.length > 0
        ? whatHelped
        : ["Short resets and less noise seem to help more than forcing a full fix."],
    emotionalArc: buildEmotionalArc(bundles),
    celebrationNote:
      "You kept leaving signal instead of letting the whole week blur together. That is real self-awareness, not a small thing.",
    therapyPrepBullets: [
      "What kind of pressure showed up the most across the week?",
      "Which trigger felt bigger than it looked from the outside?",
      "What actually helped you come down faster, even once?",
    ] as [string, string, string],
    toneLine,
    shareCard: buildReplayShareCard(toneLine, whatHelped, themes),
  });
}

async function openAiInsight(
  checkIn: CheckInRecord,
  combinedText: string,
  recentBundles: CheckInBundle[]
) {
  if (!hasOpenAiText) {
    return null;
  }

  const client = getOpenAiClient();
  if (!client) {
    return null;
  }

  const response = await client.responses.parse({
    model: env.OPENAI_MODEL!,
    instructions:
      "You are writing supportive emotional reflection for MOODDROP. Be warm, sharp, non-clinical, and concise. Never diagnose, never claim to be a therapist, never offer crisis counseling, and never use manipulative retention language. Return clean JSON only.",
    input: `Check-in mood: ${checkIn.mood}\nIntensity: ${checkIn.intensity}\nText: ${combinedText}\nSong: ${checkIn.songTitle ?? "none"} / ${checkIn.songArtist ?? "none"}\nRecent history:\n${JSON.stringify(
      recentBundles.map((bundle) => ({
        mood: bundle.checkIn.mood,
        intensity: bundle.checkIn.intensity,
        summary:
          bundle.result.kind === "insight"
            ? bundle.result.emotionalSummary
            : bundle.result.headline,
      })),
      null,
      2
    )}`,
    text: {
      format: zodTextFormat(insightSchema, "mooddrop_insight"),
    },
  });

  return response.output_parsed;
}

async function openAiReplay(
  bundles: CheckInBundle[],
  windowStart: string,
  windowEnd: string
) {
  if (!hasOpenAiText) {
    return null;
  }

  const client = getOpenAiClient();
  if (!client) {
    return null;
  }

  const compact = bundles.map((bundle) => ({
    mood: bundle.checkIn.mood,
    intensity: bundle.checkIn.intensity,
    text: bundle.checkIn.text,
    transcript: bundle.checkIn.transcript,
    result: bundle.result,
    risk: bundle.risk,
  }));

  const response = await client.responses.parse({
    model: env.OPENAI_MODEL!,
    instructions:
      "You create a weekly emotional replay for MOODDROP. Keep it reflective, non-clinical, specific, and emotionally intelligent. Never diagnose or imply treatment. Return clean JSON only with exactly three therapy-prep bullets.",
    input: `Replay window: ${windowStart} -> ${windowEnd}\nEntries:\n${JSON.stringify(
      compact,
      null,
      2
    )}`,
    text: {
      format: zodTextFormat(replaySchema, "mooddrop_replay"),
    },
  });

  return response.output_parsed;
}

export function createAiProvider(): AiProvider {
  return {
    async transcribeAudio(audioFile) {
      if (!hasOpenAiAudio || !audioFile.bytes) {
        return {
          transcript: null,
          error: audioFile.bytes ? "transcription_unavailable" : null,
        };
      }

      const client = getOpenAiClient();
      if (!client) {
        return {
          transcript: null,
          error: "transcription_unavailable",
        };
      }

      try {
        const transcription = await client.audio.transcriptions.create({
          file: await toFile(audioFile.bytes, audioFile.name, {
            type: audioFile.type,
          }),
          model: env.OPENAI_AUDIO_MODEL!,
        });

        return {
          transcript: transcription.text,
          error: null,
        };
      } catch {
        return {
          transcript: null,
          error: "transcription_unavailable",
        };
      }
    },

    async classifyRisk(input) {
      if (input.spiralRequested) {
        return {
          level: "elevated",
          reason: "The user asked to enter spiral mode directly.",
          escalatedAt: new Date().toISOString(),
        };
      }

      const normalized = normalizeFreeText(input.text);
      const matched = elevatedRiskPatterns.find((pattern) =>
        pattern.test(normalized)
      );

      if (matched) {
        return {
          level: "elevated",
          reason:
            "The check-in includes language that may point to immediate self-harm risk or acute danger.",
          escalatedAt: new Date().toISOString(),
        };
      }

      if (input.intensity >= 5 && input.mood === "heavy") {
        return {
          level: "elevated",
          reason:
            "The check-in reads as emotionally acute and needs a calmer support path first.",
          escalatedAt: new Date().toISOString(),
        };
      }

      return {
        level: "safe",
        reason:
          "No urgent-risk signals were detected before normal reflective support.",
        escalatedAt: new Date().toISOString(),
      };
    },

    async generateInsight(input) {
      const generated = await openAiInsight(
        input.checkIn,
        input.combinedText,
        input.recentBundles
      );

      if (generated) {
        return assertSafeObjectCopy({
          kind: "insight" as const,
          emotionalSummary: assertSafeAssistantCopy(generated.emotionalSummary),
          likelyTrigger: assertSafeAssistantCopy(generated.likelyTrigger),
          microAction: assertSafeAssistantCopy(generated.microAction),
          reflectionPrompt: assertSafeAssistantCopy(generated.reflectionPrompt),
          shareCard: buildInsightShareCard(
            generated.emotionalSummary,
            generated.microAction
          ),
          disclaimer: SUPPORTIVE_DISCLOSURE,
        });
      }

      return fallbackInsight(
        input.checkIn,
        input.combinedText,
        input.recentBundles
      );
    },

    async generateWeeklyReplay(input) {
      const generated = await openAiReplay(
        input.bundles,
        input.windowStart,
        input.windowEnd
      );

      if (generated) {
        return assertSafeObjectCopy({
          ...generated,
          emotionalArc: buildEmotionalArc(input.bundles),
          shareCard: buildReplayShareCard(
            generated.toneLine,
            generated.whatHelped,
            generated.themes
          ),
        });
      }

      return fallbackReplay(input.bundles, input.windowStart, input.windowEnd);
    },
  };
}

export function buildSpiralSupportResult(reason: string) {
  return assertSafeObjectCopy({
    kind: "spiral" as const,
    headline: spiralModeCopy.headline,
    groundingAction:
      groundingActions[Math.abs(reason.length) % groundingActions.length] ??
      spiralModeCopy.defaultGroundingAction,
    reachOutPath: spiralModeCopy.defaultReachOutPath,
    note: spiralModeCopy.note,
    disclaimer: SUPPORTIVE_DISCLOSURE,
  });
}
