import { sanitizeDailyAgendaContent } from "@/lib/daily-agenda-content";

describe("sanitizeDailyAgendaContent", () => {
  it("preserves a canonical task reference and rich-text blocks", () => {
    const result = sanitizeDailyAgendaContent(
      '<h2>Today</h2><div data-type="taskReference" data-task-id="task_123"></div><p>Notes</p>'
    );

    expect(result).toContain("<h2>Today</h2>");
    expect(result).toContain('data-type="taskReference"');
    expect(result).toContain('data-task-id="task_123"');
    expect(result).toContain("<p>Notes</p>");
  });

  it("strips scripts, handlers, and unrelated data attributes", () => {
    const result = sanitizeDailyAgendaContent(
      '<script>alert(1)</script><div data-type="taskReference" data-task-id="task_123" data-secret="no" onclick="alert(2)"></div>'
    );

    expect(result).not.toContain("script");
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("data-secret");
    expect(result).toContain('data-task-id="task_123"');
  });

  it("preserves the shared versioned document contract", () => {
    const content = JSON.stringify({
      version: 1,
      kind: "today",
      document: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            attrs: { blockId: "block_1" },
            content: [{ type: "text", text: "<script>is text</script>" }],
          },
          {
            type: "taskGroupReference",
            attrs: { blockId: "block_2", groupId: "today" },
          },
        ],
      },
    });

    expect(JSON.parse(sanitizeDailyAgendaContent(content))).toEqual(
      JSON.parse(content)
    );
  });
});
