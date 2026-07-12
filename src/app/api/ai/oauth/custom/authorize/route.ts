import { NextRequest, NextResponse } from "next/server";

import { encryptSecret } from "@/services/ai/encryption";
import {
  aiOAuthStateTtlMs,
  buildAuthorizationUrl,
  createOAuthState,
  createPkceVerifier,
  getCustomAIOAuthConfig,
  getCustomAIOAuthRedirectUri,
  hashOAuthState,
} from "@/services/ai/oauth";
import { AIProvider } from "@prisma/client";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "ai-oauth-authorize";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  try {
    const config = getCustomAIOAuthConfig();
    if (!config) {
      return NextResponse.json(
        { error: "Custom AI OAuth has not been configured by this planner." },
        { status: 503 }
      );
    }

    const state = createOAuthState();
    const codeVerifier = createPkceVerifier();
    const redirectUri = getCustomAIOAuthRedirectUri();

    await prisma.$transaction([
      prisma.aIOAuthState.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      }),
      prisma.aIOAuthState.create({
        data: {
          userId: auth.userId,
          provider: AIProvider.CUSTOM,
          stateHash: hashOAuthState(state),
          encryptedCodeVerifier: encryptSecret(codeVerifier),
          redirectUri,
          expiresAt: new Date(Date.now() + aiOAuthStateTtlMs),
        },
      }),
    ]);

    return NextResponse.redirect(
      buildAuthorizationUrl({ config, redirectUri, state, codeVerifier })
    );
  } catch (error) {
    logger.error(
      "Failed to start Custom AI OAuth",
      { error: error instanceof Error ? error.message : String(error) },
      LOG_SOURCE
    );
    return NextResponse.json(
      { error: "Could not start Custom AI OAuth" },
      { status: 500 }
    );
  }
}
