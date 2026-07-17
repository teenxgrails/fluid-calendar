# Custom AI Contract

Needt can call a local or private AI service when Settings -> AI Assistant uses provider `Custom`.

## Authentication

If an API key is saved, Needt sends it as:

```http
Authorization: Bearer <key>
```

Alternatively, a Custom AI service can use OAuth 2.0 authorization-code flow with PKCE. Configure the `AI_CUSTOM_OAUTH_*` variables in `ENV_TEMPLATE.md`, register this redirect URI, then select Custom and choose **Connect OAuth** in Settings:

```text
${NEXTAUTH_URL}/api/ai/oauth/custom/callback
```

The token endpoint must accept `application/x-www-form-urlencoded` authorization-code and refresh-token requests. Needt includes `client_id`, `redirect_uri`, and `code_verifier` for code exchange; it includes `client_secret` only when `AI_CUSTOM_OAUTH_CLIENT_SECRET` is configured. It stores access and refresh tokens encrypted at rest, refreshes access tokens one minute before expiry, and sends the resulting access token as the same Bearer credential shown above.

OAuth is intentionally scoped to Custom AI. OpenAI and Anthropic's direct API endpoints use API keys; their product-account sign-ins do not provide an OAuth credential for those endpoints.

## POST /parse-tasks

Request:

```json
{
  "text": "Write launch plan 2h\nCall dentist today"
}
```

Response:

```json
[
  {
    "title": "Write launch plan",
    "estimatedMinutes": 120,
    "priority": "MEDIUM",
    "energyRequired": "HIGH",
    "contextTag": "deep work"
  }
]
```

## POST /schedule

Request: a `SchedulingContext` containing tasks, busy blocks, energy profile, preferences, current time, and the deterministic result.

Response:

```json
{
  "summary": "Moved high-focus writing into the morning peak.",
  "moves": [
    {
      "taskId": "task_123",
      "fromStart": "2026-07-07T15:00:00.000Z",
      "fromEnd": "2026-07-07T16:00:00.000Z",
      "toStart": "2026-07-08T09:00:00.000Z",
      "toEnd": "2026-07-08T10:00:00.000Z",
      "reason": "High-energy task fits the peak-energy window."
    }
  ],
  "reorderedTaskIds": ["task_123"],
  "energyTags": [],
  "estimateAdjustments": [],
  "warnings": []
}
```

Return strict JSON only. Needt treats custom AI output as suggestions; deterministic scheduling remains the fallback.
