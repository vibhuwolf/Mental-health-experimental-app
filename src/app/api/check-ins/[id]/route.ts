import { NextResponse } from "next/server";

import { getCheckInBundle, getDefaultRuntime } from "@/lib/services/mooddrop-runtime";
import { getCurrentGuestSession } from "@/lib/server-session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentGuestSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const bundle = await getCheckInBundle(getDefaultRuntime(), id);

  if (!bundle || bundle.checkIn.sessionId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(bundle);
}
