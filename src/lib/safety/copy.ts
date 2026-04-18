import {
  assertSafeAssistantCopy,
  assertSafeObjectCopy,
  SUPPORTIVE_DISCLOSURE,
} from "@/lib/safety/policy";

export const appPromise =
  "A private emotional check-in that turns messy moments into one useful signal fast.";

export const howItWorksSteps = [
  "Check in",
  "Get signal",
  "See your patterns",
] as const;

export const landingSampleInsight = assertSafeObjectCopy({
  title: "What a fast result feels like",
  summary:
    "You sound stretched between school pressure and social noise. Next step: make the next fifteen minutes smaller instead of trying to fix the whole week.",
});

export const landingSampleReplay = assertSafeObjectCopy({
  title: "What a replay can surface",
  summary:
    "Your week kept spiking around unread-message tension, but walking and softer resets kept helping more than forcing yourself through it.",
  themes: ["social noise", "deadline pressure", "late-night overthinking"] as const,
});

export const spiralModeCopy = assertSafeObjectCopy({
  eyebrow: "Spiral mode",
  headline: assertSafeAssistantCopy("Keep this moment small and safe."),
  note: assertSafeAssistantCopy(
    "You do not have to solve the whole week right now. One grounded step is enough."
  ),
  defaultGroundingAction: assertSafeAssistantCopy(
    "Plant both feet, unclench your jaw, and name five things you can see before you decide the next move."
  ),
  defaultReachOutPath: assertSafeAssistantCopy(
    "Text or call a trusted person and tell them you need steady company right now. If you are in immediate danger, contact local emergency support now."
  ),
});

export function buildConsistencyCard(daysWithCheckIns: number) {
  if (daysWithCheckIns <= 1) {
    return {
      title: "Fresh start energy",
      description:
        "One honest drop is enough to start the pattern. Keep returning when it helps, not because a streak tells you to.",
    };
  }

  if (daysWithCheckIns <= 3) {
    return {
      title: "Patterns are starting to show",
      description:
        "You have checked in on a few different days, which is enough to notice signal without forcing consistency theater.",
    };
  }

  return {
    title: "You have real emotional signal",
    description:
      "These drops are building a clearer replay of what drains you, what steadies you, and what deserves attention next.",
  };
}

export function getSupportiveDisclosure() {
  return SUPPORTIVE_DISCLOSURE;
}
