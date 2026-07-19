import { expect, test } from "@playwright/test";

import { VISUAL_TEST_NOW } from "./fixtures";
import { signInVisualUser } from "./helpers";

async function settleVisualSurface(page: import("@playwright/test").Page) {
  await page.addStyleTag({
    content:
      "nextjs-portal, .tsqd-parent-container { display: none !important; }",
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(250);
}

test("Calendar, Today, and Space stay visually stable", async ({ page }) => {
  await page.clock.setFixedTime(new Date(VISUAL_TEST_NOW));
  await page.addInitScript(() => {
    localStorage.setItem("mina:quick-tip:last-shown-at", String(Date.now()));
    localStorage.setItem("needt-visit-count", "0");
  });
  await page.emulateMedia({
    colorScheme: "dark",
    reducedMotion: "reduce",
  });
  await signInVisualUser(page);
  await page.goto("/calendar", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".fc-timegrid")).toBeVisible();
  await expect(
    page
      .getByTestId("calendar-task")
      .filter({ hasText: "Review calendar sync" })
  ).toBeVisible();
  await settleVisualSurface(page);
  await expect(page).toHaveScreenshot("calendar.png");

  await page.goto("/today", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Thursday" })).toBeVisible();
  await expect(
    page.getByRole("main").getByText("Plan the launch").first()
  ).toBeVisible();
  await settleVisualSurface(page);
  await expect(page).toHaveScreenshot("today.png");

  await page.goto("/tasks", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Schedule stays unchanged")).toBeVisible();
  await settleVisualSurface(page);
  await expect(page).toHaveScreenshot("space.png");
});
