import type { JSONContent } from "@tiptap/core";

export const DOCUMENT_CONTRACT_VERSION = 1;

export interface VersionedDocument {
  version: typeof DOCUMENT_CONTRACT_VERSION;
  kind: "page" | "today";
  document: JSONContent;
}

export function encodeDocument(
  kind: VersionedDocument["kind"],
  document: JSONContent
) {
  return JSON.stringify({
    version: DOCUMENT_CONTRACT_VERSION,
    kind,
    document,
  } satisfies VersionedDocument);
}

export function decodeDocument(
  value: string,
  kind: VersionedDocument["kind"]
): JSONContent | string {
  if (!value.trim().startsWith("{")) return value || "<p></p>";
  try {
    const parsed = JSON.parse(value) as Partial<VersionedDocument>;
    if (
      parsed.version === DOCUMENT_CONTRACT_VERSION &&
      parsed.kind === kind &&
      parsed.document?.type === "doc"
    ) {
      return parsed.document;
    }
  } catch {
    // Legacy documents remain valid HTML and are reconciled on the next save.
  }
  return value || "<p></p>";
}
