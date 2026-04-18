import {
  assertSafeAssistantCopy,
  SUPPORTIVE_DISCLOSURE,
} from "@/lib/safety/policy";

describe("safety policy", () => {
  it("allows warm reflective copy", () => {
    expect(() =>
      assertSafeAssistantCopy(
        "You are not failing at this. Let us slow the moment down and find one tiny reset."
      )
    ).not.toThrow();
  });

  it("rejects therapist and diagnosis claims", () => {
    expect(() =>
      assertSafeAssistantCopy(
        "I am your therapist, and this sounds like a diagnosis of major depression."
      )
    ).toThrow(/unsafe/i);
  });

  it("keeps the core disclosure explicit", () => {
    expect(SUPPORTIVE_DISCLOSURE.toLowerCase()).toContain("not a therapist");
  });
});
