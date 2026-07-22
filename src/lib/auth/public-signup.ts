import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "PublicSignup";

export async function isPublicSignupEnabled(): Promise<boolean> {
  try {
    const systemSettings = await prisma.systemSettings.findFirst({
      select: { publicSignup: true },
    });

    // Registration is open by default. An administrator can still disable it
    // explicitly from System Settings after the initial setup.
    return systemSettings?.publicSignup ?? true;
  } catch (error) {
    logger.error(
      "Failed to read public signup setting",
      { error: error instanceof Error ? error.message : "Unknown error" },
      LOG_SOURCE
    );
    return false;
  }
}
