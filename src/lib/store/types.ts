import type {
  AnalyticsEvent,
  CheckInBundle,
  CheckInRecord,
  CheckInResult,
  CreateCheckInRecordInput,
  GuestSession,
  RiskResult,
  WeeklyReplay,
} from "@/types/mooddrop";

export interface FinalizeCheckInInput {
  transcript: string | null;
  transcriptionError: string | null;
  risk: RiskResult;
  result: CheckInResult;
}

export interface AppStore {
  createGuestSession(): Promise<GuestSession>;
  getGuestSession(sessionId: string): Promise<GuestSession | null>;
  touchGuestSession(sessionId: string): Promise<void>;
  createCheckIn(input: CreateCheckInRecordInput): Promise<CheckInRecord>;
  finalizeCheckIn(
    checkInId: string,
    payload: FinalizeCheckInInput
  ): Promise<CheckInBundle>;
  getCheckInBundle(checkInId: string): Promise<CheckInBundle | null>;
  listRecentCheckIns(sessionId: string, limit: number): Promise<CheckInBundle[]>;
  listCheckInsForWindow(
    sessionId: string,
    windowStartIso: string
  ): Promise<CheckInBundle[]>;
  getLatestWeeklyReplay(sessionId: string): Promise<WeeklyReplay | null>;
  saveWeeklyReplay(replay: WeeklyReplay): Promise<WeeklyReplay>;
  logAnalytics(event: AnalyticsEvent): Promise<void>;
}
