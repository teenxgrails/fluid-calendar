import { sanitizeMailHtml } from "@/lib/mail/sanitize";

describe("mail HTML sanitization", () => {
  test("removes active content and blocks remote images", () => {
    const result = sanitizeMailHtml(
      '<script>alert(1)</script><p onclick="alert(2)">Hello</p><img src="https://tracker.example/pixel.png">'
    );
    expect(result.html).not.toContain("<script");
    expect(result.html).not.toContain("onclick");
    expect(result.html).not.toMatch(/<img[^>]+\ssrc=/);
    expect(result.html).toContain(
      'data-remote-src="https://tracker.example/pixel.png"'
    );
    expect(result.hasRemoteImages).toBe(true);
  });
});
