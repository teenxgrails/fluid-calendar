import {
  blockTypeForNode,
  documentFromPageBlocks,
  pageBlocksFromDocument,
} from "@/components/pages/page-document";

describe("page document contract", () => {
  it("hydrates and serializes canonical blocks without changing stable IDs", () => {
    const document = documentFromPageBlocks([
      {
        id: "stable-paragraph",
        parentBlockId: null,
        type: "PARAGRAPH",
        content: {
          json: {
            type: "paragraph",
            content: [{ type: "text", text: "First block" }],
          },
        },
        position: 1024,
        createdBy: "HUMAN",
      },
      {
        id: "stable-heading",
        parentBlockId: null,
        type: "HEADING_2",
        content: {
          json: {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Section" }],
          },
        },
        position: 2048,
        createdBy: "HUMAN",
      },
    ]);

    expect(document?.content?.map((node) => node.attrs?.blockId)).toEqual([
      "stable-paragraph",
      "stable-heading",
    ]);
    expect(pageBlocksFromDocument(document!)).toMatchObject([
      { id: "stable-paragraph", type: "PARAGRAPH", position: 1024 },
      { id: "stable-heading", type: "HEADING_2", position: 2048 },
    ]);
  });

  it("maps list, checklist and special nodes to canonical block types", () => {
    expect(blockTypeForNode({ type: "bulletList" })).toBe("BULLETED_LIST");
    expect(blockTypeForNode({ type: "taskList" })).toBe("CHECKLIST");
    expect(
      blockTypeForNode({
        type: "needtPageBlock",
        attrs: { kind: "BOOKMARK" },
      })
    ).toBe("BOOKMARK");
  });
});
