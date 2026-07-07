export function parseStrictJson<T>(value: string): T {
  return JSON.parse(value.trim()) as T;
}

export function extractProviderText(value: unknown): string {
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;

  if (Array.isArray(record.content)) {
    return record.content
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const content = item as Record<string, unknown>;
        return typeof content.text === "string" ? content.text : "";
      })
      .join("");
  }

  const choices = record.choices;
  if (Array.isArray(choices)) {
    const first = choices[0] as Record<string, unknown> | undefined;
    const message = first?.message as Record<string, unknown> | undefined;
    if (typeof message?.content === "string") {
      return message.content;
    }
  }

  return "";
}
