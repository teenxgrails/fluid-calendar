import { logger } from "@/lib/logger";

const LOG_SOURCE = "ClientPublicSignup";

export async function isPublicSignupEnabledClient(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/public-signup", {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Public signup check failed with ${response.status}`);
    }
    const data = (await response.json()) as { enabled?: boolean };
    return data.enabled === true;
  } catch (error) {
    logger.error(
      "Failed to check public signup availability",
      { error: error instanceof Error ? error.message : "Unknown error" },
      LOG_SOURCE
    );
    return false;
  }
}
