import { parseTasksFallback } from "./fallback-parser";
import { extractProviderText, parseStrictJson } from "./json";
import { parsePrompt, schedulePrompt } from "./prompts";
import {
  AISuggestion,
  ParsedTask,
  SchedulerAI,
  SchedulerAIConfig,
  SchedulingContext,
} from "./types";

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_SUGGESTION: AISuggestion = {
  summary: "Deterministic schedule kept.",
  moves: [],
  warnings: [],
};

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export class NoneProvider implements SchedulerAI {
  name = "Deterministic";

  async suggestSchedule(): Promise<AISuggestion> {
    return DEFAULT_SUGGESTION;
  }

  async parseTasks(text: string): Promise<ParsedTask[]> {
    return parseTasksFallback(text);
  }
}

export class AnthropicProvider implements SchedulerAI {
  name = "Anthropic";

  constructor(private config: SchedulerAIConfig) {}

  private async complete<T>(prompt: string): Promise<T> {
    if (!this.config.apiKey) {
      throw new Error("Anthropic API key is not configured");
    }

    const response = await fetchWithTimeout(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.config.model || "claude-sonnet-4-6",
          max_tokens: 2000,
          temperature: 0,
          messages: [{ role: "user", content: prompt }],
        }),
      },
      this.config.timeoutMs
    );

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.status}`);
    }

    return parseStrictJson<T>(extractProviderText(await response.json()));
  }

  suggestSchedule(input: SchedulingContext): Promise<AISuggestion> {
    return this.complete<AISuggestion>(schedulePrompt(input));
  }

  parseTasks(text: string): Promise<ParsedTask[]> {
    return this.complete<ParsedTask[]>(parsePrompt(text));
  }
}

export class OpenAIProvider implements SchedulerAI {
  name: string;

  constructor(
    private config: SchedulerAIConfig,
    name = "OpenAI",
    private defaultModel = "gpt-4o"
  ) {
    this.name = name;
  }

  private async complete<T>(prompt: string): Promise<T> {
    if (!this.config.apiKey) {
      throw new Error(`${this.name} API key is not configured`);
    }

    const baseUrl = (this.config.baseUrl || "https://api.openai.com/v1").replace(
      /\/$/,
      ""
    );
    const response = await fetchWithTimeout(
      `${baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model || this.defaultModel,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        }),
      },
      this.config.timeoutMs
    );

    if (!response.ok) {
      throw new Error(`${this.name} request failed: ${response.status}`);
    }

    return parseStrictJson<T>(extractProviderText(await response.json()));
  }

  suggestSchedule(input: SchedulingContext): Promise<AISuggestion> {
    return this.complete<AISuggestion>(schedulePrompt(input));
  }

  parseTasks(text: string): Promise<ParsedTask[]> {
    return this.complete<ParsedTask[]>(parsePrompt(text));
  }
}

export class CustomProvider implements SchedulerAI {
  name = "Custom";

  constructor(private config: SchedulerAIConfig) {}

  private async post<T>(path: string, body: unknown): Promise<T> {
    if (!this.config.customUrl) {
      throw new Error("Custom AI endpoint is not configured");
    }

    const base = this.config.customUrl.replace(/\/$/, "");
    const response = await fetchWithTimeout(
      `${base}${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.apiKey
            ? { Authorization: `Bearer ${this.config.apiKey}` }
            : {}),
        },
        body: JSON.stringify(body),
      },
      this.config.timeoutMs
    );

    if (!response.ok) {
      throw new Error(`Custom AI request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  }

  suggestSchedule(input: SchedulingContext): Promise<AISuggestion> {
    return this.post<AISuggestion>("/schedule", input);
  }

  parseTasks(text: string): Promise<ParsedTask[]> {
    return this.post<ParsedTask[]>("/parse-tasks", { text });
  }
}

export function createSchedulerAI(config: SchedulerAIConfig): SchedulerAI {
  switch (config.provider) {
    case "ANTHROPIC":
      return new AnthropicProvider(config);
    case "OPENAI":
      return new OpenAIProvider(config, "OpenAI", "gpt-4o");
    case "GROK":
      return new OpenAIProvider(
        { ...config, baseUrl: config.baseUrl || "https://api.x.ai/v1" },
        "Grok",
        "grok-2-latest"
      );
    case "GLM":
      return new OpenAIProvider(
        {
          ...config,
          baseUrl: config.baseUrl || "https://api.z.ai/api/paas/v4",
        },
        "GLM",
        "glm-4.5"
      );
    case "CUSTOM":
      return new CustomProvider(config);
    case "NONE":
    default:
      return new NoneProvider();
  }
}
