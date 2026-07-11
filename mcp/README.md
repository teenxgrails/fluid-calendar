# Flowday MCP Server

This stdio MCP server wraps Flowday's existing connector API. It does not duplicate scheduling logic; every tool calls `/api/connect/*` with a personal bearer token.

## Environment

```bash
MINA_BASE_URL=http://localhost:3000
FLOWDAY_CONNECT_TOKEN=flowday_REPLACE_ME
```

Generate the token in Flowday: Settings -> Connectors.

## Tools

- `flowday_create_task` -> `POST /api/connect/tasks`
- `flowday_list_tasks` -> `GET /api/connect/tasks`
- `flowday_schedule` -> `POST /api/connect/schedule`
- `flowday_reschedule` -> `POST /api/connect/reschedule`
- `flowday_control` -> private app control for overview, projects, task updates/completion, local calendars, and events. Destructive actions require `confirm: true`.

Use `action: "overview"` first to inspect the current app state. Then use
`create_project`, `update_project`, `update_task`, `complete_task`,
`create_calendar`, `create_event`, or `update_event`. Deletes are intentionally
blocked until the caller sends `confirm: true` with the delete action.

## Run

```bash
pnpm mcp:flowday
```

## Claude Desktop

Add this to `claude_desktop_config.json`, adjusting the repo path and token:

```json
{
  "mcpServers": {
    "flowday": {
      "command": "node",
      "args": ["/Users/lol/MinaCalendar/mcp/flowday-mcp-server.mjs"],
      "env": {
        "MINA_BASE_URL": "http://localhost:3000",
        "FLOWDAY_CONNECT_TOKEN": "flowday_REPLACE_ME"
      }
    }
  }
}
```

For production, set `MINA_BASE_URL` to the deployed Vercel URL and use a token generated in that environment.
