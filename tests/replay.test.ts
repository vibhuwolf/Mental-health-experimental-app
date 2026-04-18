import {
  buildWeeklyReplay,
  createGuestSession,
  createRuntime,
  submitCheckIn,
} from "@/lib/services/mooddrop-runtime";

describe("weekly replay", () => {
  it("returns a grounded empty replay when there is no data yet", async () => {
    const runtime = createRuntime({ mode: "memory" });
    const session = await createGuestSession(runtime);

    const replay = await buildWeeklyReplay(runtime, session.id);

    expect(replay.themes.length).toBe(0);
    expect(replay.therapyPrepBullets).toHaveLength(3);
    expect(replay.disclaimer.toLowerCase()).toContain("not a therapist");
  });

  it("builds a replay with exactly three therapy-prep bullets", async () => {
    const runtime = createRuntime({ mode: "memory" });
    const session = await createGuestSession(runtime);

    await submitCheckIn(runtime, session.id, {
      mood: "hopeful",
      intensity: 2,
      text: "PRIVATE-TOKEN Walked after class and felt lighter.",
      spiralRequested: false,
    });

    await submitCheckIn(runtime, session.id, {
      mood: "overthinking",
      intensity: 4,
      text: "My trigger keeps being unread messages and deadline stacks.",
      spiralRequested: false,
    });

    const replay = await buildWeeklyReplay(runtime, session.id);

    expect(replay.themes.length).toBeGreaterThan(0);
    expect(replay.triggers.length).toBeGreaterThan(0);
    expect(replay.therapyPrepBullets).toHaveLength(3);
    expect(replay.celebrationNote.length).toBeGreaterThan(10);
    expect(replay.emotionalArc.length).toBe(2);
    expect(replay.shareCard.summary).toBeTruthy();
    expect(replay.shareCard.summary).not.toContain("PRIVATE-TOKEN");
  });
});
