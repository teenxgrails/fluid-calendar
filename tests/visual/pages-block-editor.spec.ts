import { expect, test } from "@playwright/test";

import { prisma } from "@/lib/prisma";

import { signInVisualUser } from "./helpers";

test("Page blocks reconcile by stable ID and slash commands create canonical blocks", async ({
  page,
}) => {
  await signInVisualUser(page);
  const created = await page.request.post("/api/pages", {
    data: { title: "Canonical block regression", isPrivate: true },
  });
  expect(created.ok()).toBeTruthy();
  const createdBody = (await created.json()) as { page: { id: string } };
  const pageId = createdBody.page.id;

  const firstSave = await page.request.put(`/api/pages/${pageId}/blocks`, {
    data: {
      blocks: [
        {
          id: "stable-intro",
          type: "PARAGRAPH",
          content: {
            json: {
              type: "paragraph",
              attrs: { blockId: "stable-intro" },
              content: [{ type: "text", text: "Persistent intro" }],
            },
          },
          position: 1024,
        },
        {
          id: "stable-heading",
          type: "HEADING_2",
          content: {
            json: {
              type: "heading",
              attrs: { level: 2, blockId: "stable-heading" },
              content: [{ type: "text", text: "Original heading" }],
            },
          },
          position: 2048,
        },
      ],
    },
  });
  expect(firstSave.ok()).toBeTruthy();

  const reconciled = await page.request.put(`/api/pages/${pageId}/blocks`, {
    data: {
      blocks: [
        {
          id: "stable-intro",
          type: "PARAGRAPH",
          content: {
            json: {
              type: "paragraph",
              attrs: { blockId: "stable-intro" },
              content: [{ type: "text", text: "Updated intro" }],
            },
          },
          position: 1024,
        },
        {
          id: "stable-quote",
          type: "QUOTE",
          content: {
            json: {
              type: "blockquote",
              attrs: { blockId: "stable-quote" },
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "New quote" }],
                },
              ],
            },
          },
          position: 2048,
        },
      ],
    },
  });
  expect(reconciled.ok()).toBeTruthy();
  const reconciledBody = (await reconciled.json()) as {
    page: { blocks: Array<{ id: string; type: string }> };
  };
  expect(reconciledBody.page.blocks).toMatchObject([
    { id: "stable-intro", type: "PARAGRAPH" },
    { id: "stable-quote", type: "QUOTE" },
  ]);

  const revision = await prisma.pageRevision.findFirst({
    where: { pageId },
    orderBy: { createdAt: "desc" },
  });
  expect(revision?.snapshot).toMatchObject({
    blocks: [
      { id: "stable-intro", type: "PARAGRAPH" },
      { id: "stable-heading", type: "HEADING_2" },
    ],
  });

  await page.goto(`/pages/${pageId}`, { waitUntil: "networkidle" });
  const document = page.getByLabel("Page document");
  await expect(document).toContainText("Updated intro");
  await expect(document).toContainText("New quote");
  await page.getByRole("button", { name: "Add icon" }).click();
  await expect(page.getByRole("button", { name: "Remove icon" })).toBeVisible();

  await document.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("/call");
  await expect(page.getByRole("menu", { name: "Page commands" })).toBeVisible();
  await page.getByRole("menuitem", { name: /Callout/ }).click();
  await page
    .getByRole("textbox", { name: "Callout text" })
    .fill("Important context");
  await page.getByRole("button", { name: "Add block" }).click();
  await expect(document).toContainText("Important context");
  await expect(page.getByText("Saving…", { exact: true })).toBeVisible();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  await expect
    .poll(async () => {
      const response = await page.request.get(`/api/pages/${pageId}`);
      const body = (await response.json()) as {
        page: { blocks: Array<{ id: string; type: string }> };
      };
      return body.page.blocks.map((block) => block.type);
    })
    .toContain("CALLOUT");

  const persisted = await page.request.get(`/api/pages/${pageId}`);
  const persistedBody = (await persisted.json()) as {
    page: { blocks: Array<{ id: string }> };
  };
  expect(persistedBody.page.blocks.map((block) => block.id)).toContain(
    "stable-intro"
  );

  await page.request.patch(`/api/pages/${pageId}`, {
    data: { trashed: true },
  });
});
