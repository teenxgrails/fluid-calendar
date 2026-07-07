import { SchedulingContext } from "./types";

export function schedulePrompt(input: SchedulingContext): string {
  return JSON.stringify({
    instruction:
      "Return strict JSON only. Suggest transparent schedule adjustments. Do not invent task ids. Keep the deterministic schedule as the baseline.",
    schema: {
      summary: "string",
      moves: [
        {
          taskId: "string",
          fromStart: "ISO string or null",
          fromEnd: "ISO string or null",
          toStart: "ISO string",
          toEnd: "ISO string",
          reason: "string",
        },
      ],
      reorderedTaskIds: ["task id strings"],
      energyTags: [
        {
          taskId: "string",
          energyRequired: "LOW|MEDIUM|HIGH",
          reason: "string",
        },
      ],
      estimateAdjustments: [
        {
          taskId: "string",
          estimatedMinutes: "number",
          reason: "string",
        },
      ],
      warnings: ["string"],
    },
    input,
  });
}

export function parsePrompt(text: string): string {
  return JSON.stringify({
    instruction:
      "Return strict JSON only. Convert this brain dump into an array of structured tasks.",
    schema: [
      {
        title: "string",
        description: "optional string",
        estimatedMinutes: "optional number",
        minChunkMinutes: "optional number",
        maxChunkMinutes: "optional number",
        deadline: "optional ISO string",
        priority: "LOW|MEDIUM|HIGH|URGENT",
        energyRequired: "LOW|MEDIUM|HIGH",
        contextTag: "optional string",
      },
    ],
    text,
  });
}
