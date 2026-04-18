import { cookies } from "next/headers";

import {
  createGuestSession,
  getDefaultRuntime,
  getGuestSession,
} from "@/lib/services/mooddrop-runtime";
import { sessionCookieSchema } from "@/lib/validation/mooddrop";

export const SESSION_COOKIE_NAME = "mooddrop_guest";

export async function getSessionIdFromCookies() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const parsed = sessionCookieSchema.safeParse(raw);

  return parsed.success ? parsed.data : null;
}

export async function getCurrentGuestSession() {
  const sessionId = await getSessionIdFromCookies();
  if (!sessionId) {
    return null;
  }

  return getGuestSession(sessionId, getDefaultRuntime());
}

export async function ensureGuestSession() {
  const existing = await getCurrentGuestSession();
  if (existing) {
    return existing;
  }

  return createGuestSession(getDefaultRuntime());
}
