import { NextResponse } from "next/server";

import { isPublicSignupEnabled } from "@/lib/auth/public-signup";
import { logger } from "@/lib/logger";

const LOG_SOURCE = "PublicSignupAPI";

export async function GET() {
  try {
    return NextResponse.json({ enabled: await isPublicSignupEnabled() });
  } catch (error) {
    logger.error(
      "Failed to check public signup setting",
      { error: error instanceof Error ? error.message : "Unknown error" },
      LOG_SOURCE
    );
    return NextResponse.json({ enabled: false }, { status: 500 });
  }
}
