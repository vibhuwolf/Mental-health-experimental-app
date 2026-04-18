import {
  createGuestSession,
  createRuntime,
  submitCheckIn,
} from "@/lib/services/mooddrop-runtime";

describe("check-in flow", () => {
  it("supports a quick check-in with only mood and intensity", async () => {
    const runtime = createRuntime({ mode: "memory" });
    const session = await createGuestSession(runtime);

    const response = await submitCheckIn(runtime, session.id, {
      mood: "sunny",
      intensity: 2,
      spiralRequested: false,
    });

    expect(response.result.kind).toBe("insight");
    expect(response.checkIn.text).toBeNull();
  });

  it("returns an insight result for a safe text-first check-in", async () => {
    const runtime = createRuntime({ mode: "memory" });
    const session = await createGuestSession(runtime);

    const response = await submitCheckIn(runtime, session.id, {
      mood: "foggy",
      intensity: 3,
      text: "PRIVATE-TOKEN I am overloaded from school and group chats, but I still want to reset tonight.",
      songTitle: "Saturn",
      songArtist: "SZA",
      spiralRequested: false,
    });

    expect(response.result.kind).toBe("insight");
    if (response.result.kind !== "insight") {
      throw new Error("Expected an insight result.");
    }
    expect(response.risk.level).toBe("safe");
    expect(response.result.disclaimer.toLowerCase()).toContain(
      "supportive reflection tool"
    );
    expect(response.result.microAction.length).toBeGreaterThan(10);
    expect(response.result.shareCard.summary).not.toContain("PRIVATE-TOKEN");
    expect(response.result.shareCard.summary.length).toBeGreaterThan(10);
  });

  it("routes elevated-risk content into spiral support", async () => {
    const runtime = createRuntime({ mode: "memory" });
    const session = await createGuestSession(runtime);

    const response = await submitCheckIn(runtime, session.id, {
      mood: "heavy",
      intensity: 5,
      text: "I want to hurt myself and I do not want to be here anymore.",
      spiralRequested: false,
    });

    expect(response.result.kind).toBe("spiral");
    if (response.result.kind !== "spiral") {
      throw new Error("Expected a spiral result.");
    }
    expect(response.risk.level).toBe("elevated");
    expect(response.result.reachOutPath.toLowerCase()).toContain("trusted");
  });

  it("falls back safely when audio transcription fails", async () => {
    const runtime = createRuntime({
      mode: "memory",
      aiOverrides: {
        async transcribeAudio() {
          return {
            transcript: null,
            error: "transcription_unavailable",
          };
        },
      },
    });
    const session = await createGuestSession(runtime);

    const response = await submitCheckIn(runtime, session.id, {
      mood: "wired",
      intensity: 4,
      text: "I am buzzing after the fight and need to come down.",
      spiralRequested: false,
      audioFile: {
        name: "rant.webm",
        type: "audio/webm",
        size: 1024,
      },
    });

    expect(response.result.kind).toBe("insight");
    if (response.result.kind !== "insight") {
      throw new Error("Expected an insight result.");
    }
    expect(response.checkIn.transcript).toBeNull();
    expect(response.checkIn.transcriptionError).toBe("transcription_unavailable");
  });
});
