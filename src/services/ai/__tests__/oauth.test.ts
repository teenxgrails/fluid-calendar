import {
  buildAuthorizationUrl,
  createPkceChallenge,
  exchangeCustomAIOAuthCode,
  getCustomAIOAuthConfig,
  hashOAuthState,
} from "../oauth";

describe("Custom AI OAuth helpers", () => {
  const previousEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...previousEnv };
    jest.restoreAllMocks();
  });

  it("builds an authorization-code URL with PKCE and configured scopes", () => {
    const url = new URL(
      buildAuthorizationUrl({
        config: {
          authorizationUrl: "https://ai.example.com/oauth/authorize",
          tokenUrl: "https://ai.example.com/oauth/token",
          clientId: "client-id",
          scopes: ["planner.read", "offline_access"],
        },
        redirectUri: "http://localhost:3000/api/ai/oauth/custom/callback",
        state: "state-value",
        codeVerifier: "verifier-value",
      })
    );

    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("state")).toBe("state-value");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBe(
      createPkceChallenge("verifier-value")
    );
    expect(url.searchParams.get("scope")).toBe("planner.read offline_access");
  });

  it("keeps state secrets out of database lookups", () => {
    expect(hashOAuthState("state-value")).not.toBe("state-value");
    expect(hashOAuthState("state-value")).toHaveLength(64);
  });

  it("only enables Custom AI OAuth after its required configuration is set", () => {
    delete process.env.AI_CUSTOM_OAUTH_AUTHORIZATION_URL;
    delete process.env.AI_CUSTOM_OAUTH_TOKEN_URL;
    delete process.env.AI_CUSTOM_OAUTH_CLIENT_ID;
    expect(getCustomAIOAuthConfig()).toBeNull();

    process.env.AI_CUSTOM_OAUTH_AUTHORIZATION_URL =
      "https://ai.example.com/oauth/authorize";
    process.env.AI_CUSTOM_OAUTH_TOKEN_URL =
      "https://ai.example.com/oauth/token";
    process.env.AI_CUSTOM_OAUTH_CLIENT_ID = "client-id";
    process.env.AI_CUSTOM_OAUTH_SCOPES = "planner.read, offline_access";

    expect(getCustomAIOAuthConfig()).toMatchObject({
      clientId: "client-id",
      scopes: ["planner.read", "offline_access"],
    });
  });

  it("exchanges the authorization code with the PKCE verifier", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "access-token",
          refresh_token: "refresh-token",
          token_type: "Bearer",
          expires_in: 3600,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    global.fetch = fetchMock;

    await expect(
      exchangeCustomAIOAuthCode({
        config: {
          authorizationUrl: "https://ai.example.com/oauth/authorize",
          tokenUrl: "https://ai.example.com/oauth/token",
          clientId: "client-id",
          clientSecret: "client-secret",
          scopes: [],
        },
        code: "authorization-code",
        redirectUri: "http://localhost:3000/api/ai/oauth/custom/callback",
        codeVerifier: "verifier-value",
      })
    ).resolves.toMatchObject({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const body = new URLSearchParams(String(fetchMock.mock.calls[0][1]?.body));
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://ai.example.com/oauth/token"
    );
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code_verifier")).toBe("verifier-value");
    expect(body.get("client_secret")).toBe("client-secret");
  });
});
