import { AIProvider } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { decryptSecret } from "./encryption";
import { createSchedulerAI } from "./providers";
import { AIProviderName, SchedulerAIConfig } from "./types";

export async function ensureAISettings(userId: string) {
  return prisma.aISettings.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      provider: "NONE",
      allowParseTasks: true,
      allowReorder: false,
      allowSuggestEnergy: true,
      allowFullAuto: false,
      requestTimeoutSeconds: 20,
    },
  });
}

export function publicAISettings(
  settings: Awaited<ReturnType<typeof ensureAISettings>>
) {
  return {
    provider: settings.provider,
    hasApiKey: Boolean(settings.encryptedApiKey),
    customUrl: settings.customUrl,
    model: settings.model,
    allowParseTasks: settings.allowParseTasks,
    allowReorder: settings.allowReorder,
    allowSuggestEnergy: settings.allowSuggestEnergy,
    allowFullAuto: settings.allowFullAuto,
    requestTimeoutSeconds: settings.requestTimeoutSeconds,
  };
}

export async function getConfiguredSchedulerAI(userId: string) {
  const settings = await ensureAISettings(userId);
  const config: SchedulerAIConfig = {
    provider: settings.provider as AIProviderName,
    apiKey: decryptSecret(settings.encryptedApiKey),
    customUrl: settings.customUrl,
    model:
      settings.model ||
      (settings.provider === AIProvider.ANTHROPIC
        ? "claude-sonnet-4-6"
        : settings.provider === AIProvider.OPENAI
          ? "gpt-5"
          : null),
    timeoutMs: settings.requestTimeoutSeconds * 1000,
  };

  return { settings, ai: createSchedulerAI(config) };
}
