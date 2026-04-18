export const moodValues = [
  "hopeful",
  "sunny",
  "foggy",
  "overthinking",
  "wired",
  "heavy",
] as const;

export type MoodValue = (typeof moodValues)[number];

export type RiskLevel = "safe" | "elevated";
export type CheckInStatus = "pending" | "complete";

export interface GuestSession {
  id: string;
  profileId: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface AudioFileInput {
  name: string;
  type: string;
  size: number;
  bytes?: Uint8Array;
}

export interface CheckInInput {
  mood: MoodValue;
  intensity: number;
  text?: string;
  songTitle?: string;
  songArtist?: string;
  spiralRequested?: boolean;
  audioFile?: AudioFileInput;
}

export interface CheckInRecord {
  id: string;
  sessionId: string;
  mood: MoodValue;
  intensity: number;
  text: string | null;
  songTitle: string | null;
  songArtist: string | null;
  spiralRequested: boolean;
  transcript: string | null;
  transcriptionError: string | null;
  audioUrl: string | null;
  audioMimeType: string | null;
  audioSize: number | null;
  status: CheckInStatus;
  createdAt: string;
}

export interface RiskResult {
  level: RiskLevel;
  reason: string;
  escalatedAt: string;
}

export interface ShareCardViewModel {
  title: string;
  summary: string;
  privacyNote: string;
}

export interface InsightResult {
  kind: "insight";
  emotionalSummary: string;
  likelyTrigger: string;
  microAction: string;
  reflectionPrompt: string;
  shareCard: ShareCardViewModel;
  disclaimer: string;
}

export interface SpiralSupportResult {
  kind: "spiral";
  headline: string;
  groundingAction: string;
  reachOutPath: string;
  note: string;
  disclaimer: string;
}

export type CheckInResult = InsightResult | SpiralSupportResult;

export interface CheckInBundle {
  checkIn: CheckInRecord;
  risk: RiskResult;
  result: CheckInResult;
}

export interface EmotionalArcPoint {
  label: string;
  mood: MoodValue;
  intensity: number;
}

export interface WeeklyReplay {
  id: string;
  sessionId: string;
  windowStart: string;
  windowEnd: string;
  themes: string[];
  triggers: string[];
  whatHelped: string[];
  emotionalArc: EmotionalArcPoint[];
  celebrationNote: string;
  therapyPrepBullets: [string, string, string];
  toneLine: string;
  shareCard: ShareCardViewModel;
  disclaimer: string;
  createdAt: string;
}

export interface DashboardItem {
  id: string;
  mood: MoodValue;
  intensity: number;
  createdAt: string;
  summary: string;
  kind: CheckInResult["kind"];
}

export interface DashboardViewModel {
  sessionId: string;
  recentCheckIns: DashboardItem[];
  latestResult: CheckInResult | null;
  replayAvailable: boolean;
  replayPreview: {
    themes: string[];
    celebrationNote: string;
    shareSummary: string;
  } | null;
  consistencyCard: {
    title: string;
    description: string;
  };
}

export interface AnalyticsEvent {
  id: string;
  sessionId: string;
  eventName:
    | "session_started"
    | "check_in_submitted"
    | "risk_routed"
    | "insight_rendered"
    | "spiral_rendered"
    | "replay_viewed";
  payload: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export interface CreateCheckInRecordInput {
  sessionId: string;
  mood: MoodValue;
  intensity: number;
  text: string | null;
  songTitle: string | null;
  songArtist: string | null;
  spiralRequested: boolean;
  audioUrl: string | null;
  audioMimeType: string | null;
  audioSize: number | null;
}
