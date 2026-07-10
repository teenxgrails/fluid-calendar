# Custom AI Contract

Flowday can call a local or private AI service when Settings -> AI Assistant uses provider `Custom`.

## Authentication

If an API key is saved, Flowday sends it as:

```http
Authorization: Bearer <key>
```

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

Return strict JSON only. Flowday treats custom AI output as suggestions; deterministic scheduling remains the fallback.
