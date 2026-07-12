import { NextRequest, NextResponse } from "next/server";

import { decryptSecret, encryptSecret } from "@/services/ai/encryption";
import {
  exchangeCustomAIOAuthCode,
  getCustomAIOAuthConfig,
  hashOAuthState,
} from "@/services/ai/oauth";
import { AIProvider } from "@prisma/client";

import { authenticateRequest } from "@/lib/auth/api-auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const LOG_SOURCE = "ai-oauth-callback";

function redirectToSettings(
  redirectUri: string,
  result: "connected" | "failed"
) {
  const destination = new URL("/settings", redirectUri);
  destination.searchParams.set("ai-oauth", result);
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request, LOG_SOURCE);
  if ("response" in auth) return auth.response;

  const state = request.nextUrl.searchParams.get("state");
  if (!state) {
    return NextResponse.json({ error: "Missing OAuth state" }, { status: 400 });
  }

  const oauthState = await prisma.aIOAuthState.findUnique({
    where: { stateHash: hashOAuthState(state) },
  });
  if (
    !oauthState ||
    oauthState.userId !== auth.userId ||
    oauthState.provider !== AIProvider.CUSTOM ||
    oauthState.expiresAt <= new Date()
  ) {
    if (oauthState?.userId === auth.userId) {
      await prisma.aIOAuthState.delete({ where: { id: oauthState.id } });
    }
    return NextResponse.json(
      { error: "Invalid or expired OAuth state" },
      { status: 400 }
    );
  }

  // Consume the one-use state before talking to the remote token endpoint.
  const consumed = await prisma.aIOAuthState.deleteMany({
    where: { id: oauthState.id, userId: auth.userId },
  });
  if (consumed.count !== 1) {
    return redirectToSettings(oauthState.redirectUri, "failed");
  }

  if (request.nextUrl.searchParams.get("error")) {
    return redirectToSettings(oauthState.redirectUri, "failed");
  }

  const code = request.nextUrl.searchParams.get("code");
  const codeVerifier = decryptSecret(oauthState.encryptedCodeVerifier);
  if (!code || !codeVerifier) {
    return redirectToSettings(oauthState.redirectUri, "failed");
  }

  try {
    const config = getCustomAIOAuthConfig();
    if (!config) return redirectToSettings(oauthState.redirectUri, "failed");

    const tokens = await exchangeCustomAIOAuthCode({
      config,
      code,
      redirectUri: oauthState.redirectUri,
      codeVerifier,
    });

    await prisma.aIOAuthConnection.upsert({
      where: {
        userId_provider: { userId: auth.userId, provider: AIProvider.CUSTOM },
      },
      create: {
        userId: auth.userId,
        provider: AIProvider.CUSTOM,
        encryptedAccessToken: encryptSecret(tokens.accessToken),
        encryptedRefreshToken: tokens.refreshToken
          ? encryptSecret(tokens.refreshToken)
          : null,
        tokenType: tokens.tokenType,
        scope: tokens.scope,
        expiresAt: tokens.expiresAt,
      },
      update: {
        encryptedAccessToken: encryptSecret(tokens.accessToken),
        encryptedRefreshToken: tokens.refreshToken
          ? encryptSecret(tokens.refreshToken)
          : null,
        tokenType: tokens.tokenType,
        scope: tokens.scope,
        expiresAt: tokens.expiresAt,
      },
    });

    return redirectToSettings(oauthState.redirectUri, "connected");
  } catch (error) {
    logger.error(
      "Failed to complete Custom AI OAuth",
      { error: error instanceof Error ? error.message : String(error) },
      LOG_SOURCE
    );
    return redirectToSettings(oauthState.redirectUri, "failed");
  }
}
