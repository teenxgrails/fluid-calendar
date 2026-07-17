export function getWebhookBaseUrl(): string {
  const baseUrl = process.env.WEBHOOK_BASE_URL || process.env.NEXTAUTH_URL;
  if (!baseUrl) {
    throw new Error("WEBHOOK_BASE_URL or NEXTAUTH_URL must be configured.");
  }
  return baseUrl.replace(/\/+$/, "");
}
