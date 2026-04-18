import { NextResponse } from "next/server";

import {
  createGuestSession,
  getDefaultRuntime,
  getGuestSession,
} from "@/lib/services/mooddrop-runtime";
import {
  getSessionIdFromCookies,
  SESSION_COOKIE_NAME,
} from "@/lib/server-session";

export async function POST() {
  const runtime = getDefaultRuntime();
  const existingSessionId = await getSessionIdFromCookies();
  const existing = existingSessionId
    ? await getGuestSession(existingSessionId, runtime)
    : null;
  const session = existing ?? (await createGuestSession(runtime));
  const response = NextResponse.json({ session });

  response.cookies.set(SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
