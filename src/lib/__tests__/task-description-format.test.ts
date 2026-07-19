import {
  RICH_TEXT_DESCRIPTION_PREFIX,
  sanitizeTaskDescriptionForStorage,
  serializeTaskDescription,
  taskDescriptionToHtml,
  taskDescriptionToPlainText,
} from "@/lib/task-description-format";

describe("task description rich text", () => {
  it("renders the legacy Markdown subset without exposing syntax", () => {
    expect(
      taskDescriptionToHtml(
        "# Plan\nUse **focus** and [Needt](https://needt.app)"
      )
    ).toBe(
      '<h1>Plan</h1><p>Use <strong>focus</strong> and <a href="https://needt.app">Needt</a></p>'
    );
  });

  it("sanitizes rich HTML before storage", () => {
    const result = serializeTaskDescription(
      "<p>Hello <strong>world</strong></p><script>alert(1)</script>"
    );

    expect(result).toBe(
      `${RICH_TEXT_DESCRIPTION_PREFIX}<p>Hello <strong>world</strong></p>`
    );
  });

  it("keeps unformatted descriptions backward compatible", () => {
    expect(sanitizeTaskDescriptionForStorage("Plain task notes")).toBe(
      "Plain task notes"
    );
  });

  it("returns useful plain text for cards, search, and copy", () => {
    expect(
      taskDescriptionToPlainText(
        `${RICH_TEXT_DESCRIPTION_PREFIX}<h2>Launch</h2><ul><li>Review</li><li>Ship</li></ul>`
      )
    ).toBe("Launch\nReview\nShip");
  });

  it("treats an empty editor document as no description", () => {
    expect(serializeTaskDescription("<p><br></p>")).toBe("");
  });
});
