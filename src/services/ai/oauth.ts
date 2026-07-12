import { AIProvider } from "@prisma/client";
import crypto from "crypto";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

import { decryptSecret, encryptSecret } from "./encryption";

const LOG_SOURCE = "ai-oauth";
const STATE_TTL_MS = 10 * 60 * 1000;
const TOKEN_REFRESH_SKEW_MS = 60 * 1000;

export interface CustomAIOAuthConfig {
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  scopes: string[];
}

interface OAuthTokenResponse {
  access_token?: unknown;
  refresh_token?: unknown;
  token_type?: unknown;
  scope?: unknown;
  expires_in?: unknown;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string | null;
  tokenType: string | null;
  scope: string | null;
  expiresAt: Date | null;
}

function isSafeOAuthUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.hostname === "localhost";
  } catch {
    return false;
  }
}

/** Returns null until the custom provider's OAuth client is configured. */
export function getCustomAIOAuthConfig(): CustomAIOAuthConfig | null {
  const authorizationUrl =
    process.env.AI_CUSTOM_OAUTH_AUTHORIZATION_URL?.trim();
  const tokenUrl = process.env.AI_CUSTOM_OAUTH_TOKEN_URL?.trim();
  const clientId = process.env.AI_CUSTOM_OAUTH_CLIENT_ID?.trim();

  if (!authorizationUrl || !tokenUrl || !clientId) return null;

  if (!isSafeOAuthUrl(authorizationUrl) || !isSafeOAuthUrl(tokenUrl)) {
    throw new Error(
      "Custom AI OAuth URLs must use HTTPS (or localhost in development)"
    );
  }

  return {
    authorizationUrl,
    tokenUrl,
    clientId,
    clientSecret:
      process.env.AI_CUSTOM_OAUTH_CLIENT_SECRET?.trim() || undefined,
    scopes: (process.env.AI_CUSTOM_OAUTH_SCOPES || "")
      .split(/[\s,]+/)
      .map((scope) => scope.trim())
      .filter(Boolean),
  };
}

export function getCustomAIOAuthRedirectUri(): string {
  const appUrl = process.env.NEXTAUTH_URL?.trim();
  if (!appUrl || !isSafeOAuthUrl(appUrl)) {
    throw new Error(
      "NEXTAUTH_URL must be an HTTPS URL (or localhost in development) for AI OAuth"
    );
  }

  return new URL("/api/ai/oauth/custom/callback", appUrl).toString();
}

export function hashOAuthState(state: string): string {
  return crypto.createHash("sha256").update(state).digest("hex");
}

export function createOAuthState(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function createPkceVerifier(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export function createPkceChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export function buildAuthorizationUrl(input: {
  config: CustomAIOAuthConfig;
  redirectUri: string;
  state: string;
  codeVerifier: string;
}): string {
  const url = new URL(input.config.authorizationUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", input.config.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("state", input.state);
  url.searchParams.set(
    "code_challenge",
    createPkceChallenge(input.codeVerifier)
  );
  url.searchParams.set("code_challenge_method", "S256");
  if (input.config.scopes.length) {
    url.searchParams.set("scope", input.config.scopes.join(" "));
  }
  return url.toString();
}

function parseTokenResponse(body: OAuthTokenResponse): OAuthTokens {
  if (typeof body.access_token !== "string" || !body.access_token) {
    throw new Error("OAuth token response did not include an access token");
  }

  const expiresIn =
    typeof body.expires_in === "number"
      ? body.expires_in
      : typeof body.expires_in === "string"
        ? Number(body.expires_in)
        : null;

  return {
    accessToken: body.access_token,
    refreshToken:
      typeof body.refresh_token === "string" && body.refresh_token
        ? body.refresh_token
        : null,
    tokenType:
      typeof body.token_type === "string" && body.token_type
        ? body.token_type
        : null,
    scope: typeof body.scope === "string" && body.scope ? body.scope : null,
    expiresAt:
      expiresIn !== null && Number.isFinite(expiresIn) && expiresIn > 0
        ? new Date(Date.now() + expiresIn * 1000)
        : null,
  };
}

async function requestOAuthTokens(
  config: CustomAIOAuthConfig,
  params: URLSearchParams
): Promise<OAuthTokens> {
  params.set("client_id", config.clientId);
  if (config.clientSecret) params.set("client_secret", config.clientSecret);

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`OAuth token request failed (${response.status})`);
  }

  return parseTokenResponse((await response.json()) as OAuthTokenResponse);
}

export function exchangeCustomAIOAuthCode(input: {
  config: CustomAIOAuthConfig;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<OAuthTokens> {
  return requestOAuthTokens(
    input.config,
    new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
      code_verifier: input.codeVerifier,
    })
  );
}

export function refreshCustomAIOAuthToken(
  config: CustomAIOAuthConfig,
  refreshToken: string
): Promise<OAuthTokens> {
  return requestOAuthTokens(
    config,
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    })
  );
}

/**
 * Resolve a usable OAuth access token for the Custom provider. Refresh failures
 * deliberately fall back to a saved API key so an OAuth outage never blocks the
 * deterministic planner or an existing key-based integration.
 */
export async function getCustomAIOAuthAccessToken(userId: string) {
  const connection = await prisma.aIOAuthConnection.findUnique({
    where: { userId_provider: { userId, provider: AIProvider.CUSTOM } },
  });
  if (!connection) return null;

  const accessToken = decryptSecret(connection.encryptedAccessToken);
  if (!accessToken) return null;

  if (
    !connection.expiresAt ||
    connection.expiresAt.getTime() > Date.now() + TOKEN_REFRESH_SKEW_MS
  ) {
    return accessToken;
  }

  const refreshToken = decryptSecret(connection.encryptedRefreshToken);
  const config = getCustomAIOAuthConfig();
  if (!refreshToken || !config) return null;

  try {
    const refreshed = await refreshCustomAIOAuthToken(config, refreshToken);
    await prisma.aIOAuthConnection.update({
      where: { id: connection.id },
      data: {
        encryptedAccessToken: encryptSecret(refreshed.accessToken),
        encryptedRefreshToken: refreshed.refreshToken
          ? encryptSecret(refreshed.refreshToken)
          : connection.encryptedRefreshToken,
        tokenType: refreshed.tokenType || connection.tokenType,
        scope: refreshed.scope || connection.scope,
        expiresAt: refreshed.expiresAt,
      },
    });
    return refreshed.accessToken;
  } catch (error) {
    logger.warn(
      "Unable to refresh Custom AI OAuth token; falling back to API key if available",
      { error: error instanceof Error ? error.message : String(error) },
      LOG_SOURCE
    );
    return null;
  }
}

export const aiOAuthStateTtlMs = STATE_TTL_MS;
