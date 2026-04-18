import { NextResponse } from "next/server";

import { getDashboardView, getDefaultRuntime } from "@/lib/services/mooddrop-runtime";
import { getCurrentGuestSession } from "@/lib/server-session";

export async function GET() {
  const session = await getCurrentGuestSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dashboard = await getDashboardView(getDefaultRuntime(), session.id);
  return NextResponse.json(dashboard);
}
