import { ParsedTask } from "./types";

const ESTIMATE_PATTERN =
  /(\d+)\s*(m|min|mins|minute|minutes|h|hr|hrs|hour|hours)\b/i;

function parseEstimate(line: string): number | undefined {
  const match = line.match(ESTIMATE_PATTERN);
  if (!match) return undefined;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  return unit.startsWith("h") ? amount * 60 : amount;
}

export function parseTasksFallback(text: string): ParsedTask[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const estimatedMinutes = parseEstimate(line);
      const cleanTitle = line.replace(ESTIMATE_PATTERN, "").trim();
      const urgent = /\burgent|asap|today\b/i.test(line);
      const highEnergy = /\bdeep|focus|write|design|build|study\b/i.test(line);

      return {
        title: cleanTitle || line,
        estimatedMinutes,
        priority: urgent ? "URGENT" : "MEDIUM",
        energyRequired: highEnergy ? "HIGH" : "MEDIUM",
        contextTag: highEnergy ? "deep work" : undefined,
      };
    });
}
