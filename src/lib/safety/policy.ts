export const SUPPORTIVE_DISCLOSURE =
  "MOODDROP is a supportive reflection tool, not a therapist, diagnosis engine, or emergency service.";

const unsafeAssistantPatterns = [
  /\bI am your therapist\b/i,
  /\bI'm your therapist\b/i,
  /\bdiagnos(?:e|ed|ing)\b/i,
  /\bprescribe\b/i,
  /\btreatment plan\b/i,
  /\bcrisis counseling\b/i,
  /\b24\/7 companion\b/i,
  /\bonly you need me\b/i,
];

export function assertSafeAssistantCopy(copy: string) {
  const normalized = copy.replace(/\s+/g, " ").trim();

  if (!normalized) {
    throw new Error("Unsafe assistant copy: empty output.");
  }

  const matched = unsafeAssistantPatterns.find((pattern) =>
    pattern.test(normalized)
  );

  if (matched) {
    throw new Error(`Unsafe assistant copy matched ${matched}.`);
  }

  return copy;
}

export function assertSafeObjectCopy<T>(value: T) {
  assertSafeAssistantCopy(JSON.stringify(value));
  return value;
}

export function normalizeFreeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}
