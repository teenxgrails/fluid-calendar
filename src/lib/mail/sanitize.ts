import DOMPurify from "isomorphic-dompurify";

export interface SanitizedMailBody {
  html: string;
  hasRemoteImages: boolean;
}

export function sanitizeMailHtml(input: string): SanitizedMailBody {
  const sanitized = DOMPurify.sanitize(input, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "form", "input", "button", "video", "audio"],
    FORBID_ATTR: ["style", "srcset"],
  });
  let hasRemoteImages = /\bdata-remote-src=(["'])https?:\/\//i.test(sanitized);
  const html = sanitized.replace(
    /<img\b([^>]*?)\bsrc=(["'])(https?:\/\/[^"']+)\2([^>]*)>/gi,
    (_match, before: string, quote: string, source: string, after: string) => {
      hasRemoteImages = true;
      return `<img${before}data-remote-src=${quote}${source}${quote}${after} alt="Remote image blocked">`;
    }
  );
  return { html, hasRemoteImages };
}
