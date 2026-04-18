import {
  buildWeeklyReplay,
  createGuestSession,
  createRuntime,
  getDashboardView,
  submitCheckIn,
} from "@/lib/services/mooddrop-runtime";

describe("dashboard view", () => {
  it("includes replay preview guidance with a share-safe summary", async () => {
    const runtime = createRuntime({ mode: "memory" });
    const session = await createGuestSession(runtime);

    await submitCheckIn(runtime, session.id, {
      mood: "foggy",
      intensity: 3,
      text: "PRIVATE-TOKEN I felt weird after class and needed a reset walk.",
      spiralRequested: false,
    });

    await buildWeeklyReplay(runtime, session.id);
    const dashboard = await getDashboardView(runtime, session.id);

    expect(dashboard.replayPreview).not.toBeNull();
    expect(dashboard.replayPreview?.shareSummary).toBeTruthy();
    expect(dashboard.replayPreview?.shareSummary).not.toContain("PRIVATE-TOKEN");
  });
});
