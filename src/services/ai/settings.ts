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
    hasApiKey: Boolean(getEncryptedKeyForProvider(settings, settings.provider)),
    providerKeys: {
      ANTHROPIC: Boolean(settings.encryptedAnthropicKey),
      OPENAI: Boolean(settings.encryptedOpenAIKey),
      GROK: Boolean(settings.encryptedGrokKey),
      GLM: Boolean(settings.encryptedGlmKey),
      CUSTOM: Boolean(settings.encryptedApiKey),
    },
    customUrl: settings.customUrl,
    model: settings.model,
    soulPreset: settings.soulPreset,
    allowParseTasks: settings.allowParseTasks,
    allowReorder: settings.allowReorder,
    allowSuggestEnergy: settings.allowSuggestEnergy,
    allowFullAuto: settings.allowFullAuto,
    requestTimeoutSeconds: settings.requestTimeoutSeconds,
  };
}

export function getEncryptedKeyForProvider(
  settings: Awaited<ReturnType<typeof ensureAISettings>>,
  provider: AIProvider | string
) {
  switch (provider) {
    case AIProvider.ANTHROPIC:
      return settings.encryptedAnthropicKey || settings.encryptedApiKey;
    case AIProvider.OPENAI:
      return settings.encryptedOpenAIKey || settings.encryptedApiKey;
    case AIProvider.GROK:
      return settings.encryptedGrokKey;
    case AIProvider.GLM:
      return settings.encryptedGlmKey;
    case AIProvider.CUSTOM:
      return settings.encryptedApiKey;
    default:
      return null;
  }
}

export function defaultModelForProvider(provider: AIProvider | string) {
  switch (provider) {
    case AIProvider.ANTHROPIC:
      return "claude-sonnet-4-6";
    case AIProvider.OPENAI:
      return "gpt-4o";
    case AIProvider.GROK:
      return "grok-2-latest";
    case AIProvider.GLM:
      return "glm-4.5";
    default:
      return null;
  }
}

export async function getConfiguredSchedulerAI(userId: string) {
  const settings = await ensureAISettings(userId);
  const config: SchedulerAIConfig = {
    provider: settings.provider as AIProviderName,
    apiKey: decryptSecret(getEncryptedKeyForProvider(settings, settings.provider)),
    customUrl: settings.customUrl,
    model: settings.model || defaultModelForProvider(settings.provider),
    timeoutMs: settings.requestTimeoutSeconds * 1000,
    soulPreset:
      settings.soulPreset === "coach" || settings.soulPreset === "business"
        ? settings.soulPreset
        : "business",
  };

  return { settings, ai: createSchedulerAI(config) };
}
