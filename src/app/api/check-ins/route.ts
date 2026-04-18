import { NextResponse } from "next/server";

import { getDefaultRuntime, submitCheckIn } from "@/lib/services/mooddrop-runtime";
import { SESSION_COOKIE_NAME, getCurrentGuestSession } from "@/lib/server-session";
import { parseCheckInFormData } from "@/lib/validation/mooddrop";
import { createGuestSession } from "@/lib/services/mooddrop-runtime";

export async function POST(request: Request) {
  const runtime = getDefaultRuntime();
  const input = await parseCheckInFormData(await request.formData());
  let session = await getCurrentGuestSession();
  const createdSession = !session;

  if (!session) {
    session = await createGuestSession(runtime);
  }

  const bundle = await submitCheckIn(runtime, session.id, input);
  const response = NextResponse.json(bundle);

  if (createdSession) {
    response.cookies.set(SESSION_COOKIE_NAME, session.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}
