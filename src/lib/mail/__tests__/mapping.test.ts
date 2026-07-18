import { readFileSync } from "fs";
import path from "path";

import {
  mapGmailMessage,
  mapGraphMessage,
  mapRawMimeMessage,
} from "@/lib/mail/mapping";
import { GmailMessageResource, GraphMailMessage } from "@/lib/mail/types";

const FIXTURES = path.join(process.cwd(), "src/lib/mail/__fixtures__");

describe("mail provider message mapping", () => {
  test("maps Gmail metadata into the local message contract", () => {
    const fixture = JSON.parse(
      readFileSync(path.join(FIXTURES, "gmail-message.json"), "utf8")
    ) as GmailMessageResource;
    const message = mapGmailMessage(fixture);
    expect(message).toMatchObject({
      externalId: "gmail-123",
      threadId: "thread-1",
      fromName: "Alex Doe",
      fromAddress: "alex@example.com",
      subject: "Weekly plan",
      isRead: false,
      isArchived: false,
    });
    expect(message?.toAddresses).toEqual([
      { name: "Planner", address: "me@example.com" },
    ]);
  });

  test("maps Microsoft Graph metadata into the local message contract", () => {
    const fixture = JSON.parse(
      readFileSync(path.join(FIXTURES, "graph-message.json"), "utf8")
    ) as GraphMailMessage;
    expect(mapGraphMessage(fixture)).toMatchObject({
      externalId: "graph-123",
      threadId: "conversation-1",
      fromName: "Jordan Lee",
      fromAddress: "jordan@example.com",
      subject: "Project update",
      isRead: true,
    });
  });

  test("parses raw IMAP MIME without persisting the body during sync", async () => {
    const raw = readFileSync(path.join(FIXTURES, "imap-message.eml"));
    const message = await mapRawMimeMessage({
      externalId: "42",
      raw,
      flags: ["\\Seen"],
    });
    expect(message).toMatchObject({
      externalId: "42",
      threadId: "<imap-fixture@example.com>",
      fromName: "Taylor Example",
      fromAddress: "taylor@example.com",
      subject: "IMAP fixture",
      isRead: true,
      bodyHtml: null,
    });
    expect(message.snippet).toContain("Plain fixture body");
  });

  test("parses the HTML body lazily when an IMAP message is opened", async () => {
    const raw = readFileSync(path.join(FIXTURES, "imap-message.eml"));
    const message = await mapRawMimeMessage({
      externalId: "42",
      raw,
      includeBody: true,
    });
    expect(message.bodyHtml).toContain("<strong>fixture</strong>");
  });
});
