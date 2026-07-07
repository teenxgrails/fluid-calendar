import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";

const LOG_SOURCE = "RegisterAPI";

export async function POST() {
  logger.warn(
    "Public registration attempted in single-user mode",
    {},
    LOG_SOURCE
  );

  return NextResponse.json(
    { error: "Public registration is disabled for this single-user planner" },
    { status: 403 }
  );
}
