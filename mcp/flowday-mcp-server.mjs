#!/usr/bin/env node

const PROTOCOL_VERSION = "2024-11-05";
const SERVER_NAME = "flowday";
const SERVER_VERSION = "0.4.0";

const baseUrl = (process.env.FLOWDAY_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);
const connectToken = process.env.FLOWDAY_CONNECT_TOKEN;

const tools = [
  {
    name: "flowday_create_task",
    description:
      "Create an auto-scheduled task in Flowday via the connector API.",
    inputSchema: {
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        estimatedMinutes: { type: "number", minimum: 1 },
        deadline: {
          type: "string",
          description: "ISO 8601 deadline, also used as due date.",
        },
        priorityLevel: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
        },
        energyRequired: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH"],
        },
        contextTag: { type: "string" },
      },
    },
  },
  {
    name: "flowday_list_tasks",
    description: "List tasks from Flowday through GET /api/connect/tasks.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "flowday_schedule",
    description:
      "Run Flowday scheduling and return the current schedule through POST /api/connect/schedule.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "flowday_reschedule",
    description:
      "Run Flowday rescheduling through POST /api/connect/reschedule.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "flowday_control",
    description:
      "Control Flowday projects, tasks, local calendars, and events. Use action: overview to inspect the app. Deletes require confirm: true.",
    inputSchema: {
      type: "object",
      required: ["action"],
      properties: {
        action: { type: "string", enum: ["overview", "create_project", "update_project", "update_task", "complete_task", "create_calendar", "create_event", "update_event", "delete_task", "delete_project", "delete_event", "delete_calendar"] },
        id: { type: "string" },
        title: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        start: { type: "string", description: "ISO 8601" },
        end: { type: "string", description: "ISO 8601" },
        feedId: { type: "string" },
        projectId: { type: ["string", "null"] },
        confirm: { type: "boolean" },
      },
    },
  },
];

let buffer = Buffer.alloc(0);

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  readMessages().catch((error) => {
    sendError(
      null,
      -32603,
      error instanceof Error ? error.message : String(error)
    );
  });
});

function readMessages() {
  while (buffer.length > 0) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) return Promise.resolve();

    const header = buffer.subarray(0, headerEnd).toString("utf8");
    const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);
    if (!lengthMatch) {
      buffer = Buffer.alloc(0);
      throw new Error("Missing Content-Length header");
    }

    const contentLength = Number(lengthMatch[1]);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + contentLength;
    if (buffer.length < messageEnd) return Promise.resolve();

    const body = buffer.subarray(messageStart, messageEnd).toString("utf8");
    buffer = buffer.subarray(messageEnd);
    void handleMessage(JSON.parse(body));
  }

  return Promise.resolve();
}

async function handleMessage(message) {
  if (!("id" in message)) {
    return;
  }

  try {
    switch (message.method) {
      case "initialize":
        sendResult(message.id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        });
        return;
      case "tools/list":
        sendResult(message.id, { tools });
        return;
      case "tools/call":
        sendResult(message.id, await callTool(message.params));
        return;
      case "ping":
        sendResult(message.id, {});
        return;
      default:
        sendError(message.id, -32601, `Unknown method: ${message.method}`);
    }
  } catch (error) {
    sendError(
      message.id,
      -32603,
      error instanceof Error ? error.message : String(error)
    );
  }
}

async function callTool(params = {}) {
  const name = params.name;
  const args = params.arguments || {};

  if (!connectToken) {
    throw new Error("FLOWDAY_CONNECT_TOKEN is required");
  }

  const endpoint = toolEndpoint(name);
  if (!endpoint) {
    throw new Error(`Unknown tool: ${name}`);
  }

  const response = await fetch(`${baseUrl}${endpoint.path}`, {
    method: endpoint.method,
    headers: {
      Authorization: `Bearer ${connectToken}`,
      "Content-Type": "application/json",
    },
    body: endpoint.method === "GET" ? undefined : JSON.stringify(args),
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { text };
  }

  if (!response.ok) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { status: response.status, error: payload },
            null,
            2
          ),
        },
      ],
    };
  }

  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
  };
}

function toolEndpoint(name) {
  switch (name) {
    case "flowday_create_task":
      return { method: "POST", path: "/api/connect/tasks" };
    case "flowday_list_tasks":
      return { method: "GET", path: "/api/connect/tasks" };
    case "flowday_schedule":
      return { method: "POST", path: "/api/connect/schedule" };
    case "flowday_reschedule":
      return { method: "POST", path: "/api/connect/reschedule" };
    case "flowday_control":
      return { method: "POST", path: "/api/connect/control" };
    default:
      return null;
  }
}

function sendResult(id, result) {
  send({ jsonrpc: "2.0", id, result });
}

function sendError(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

function send(message) {
  const json = JSON.stringify(message);
  process.stdout.write(
    `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`
  );
}
