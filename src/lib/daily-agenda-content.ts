import DOMPurify from "isomorphic-dompurify";

import {
  DOCUMENT_CONTRACT_VERSION,
  type VersionedDocument,
} from "@/components/documents/document-contract";

const ALLOWED_TAGS = [
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "hr",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "strong",
  "u",
  "ul",
];

export function sanitizeDailyAgendaContent(content: string) {
  if (content.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(content) as Partial<VersionedDocument>;
      if (
        parsed.version === DOCUMENT_CONTRACT_VERSION &&
        parsed.kind === "today" &&
        parsed.document?.type === "doc" &&
        Array.isArray(parsed.document.content)
      ) {
        return JSON.stringify(parsed);
      }
    } catch {
      // Fall through to the legacy HTML sanitizer.
    }
  }
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["checked", "data-checked", "data-task-id", "data-type"],
    ALLOW_DATA_ATTR: false,
  }).trim();
}
