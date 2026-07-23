import { Node, mergeAttributes } from "@tiptap/core";

const LABELS: Record<string, string> = {
  CALLOUT: "Callout",
  TOGGLE: "Toggle",
  LINK: "Link",
  BOOKMARK: "Bookmark",
  FILE: "File",
  TABLE: "Table",
  COLUMNS: "Columns",
  PAGE_MENTION: "Page mention",
  DATE_MENTION: "Date mention",
  FORM: "Form",
};

export const PageBlockNode = Node.create({
  name: "needtPageBlock",
  group: "block",
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      blockId: { default: null },
      kind: { default: "CALLOUT" },
      data: { default: "{}" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-needt-page-block]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    let detail = "";
    try {
      const data = JSON.parse(String(node.attrs.data)) as {
        text?: string;
        url?: string;
        date?: string;
        title?: string;
      };
      detail = data.text || data.title || data.url || data.date || "";
    } catch {
      detail = "";
    }
    const kind = String(node.attrs.kind);
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-needt-page-block": kind,
        class: `needt-page-special-block needt-page-special-block--${kind.toLowerCase()}`,
      }),
      [
        "span",
        { class: "needt-page-special-block-label" },
        LABELS[kind] || kind,
      ],
      detail
        ? ["span", { class: "needt-page-special-block-detail" }, detail]
        : ["span", { class: "needt-page-special-block-detail" }, "Empty"],
    ];
  },
});
