import { expect } from "@playwright/test";

import { prisma } from "@/lib/prisma";

import { VISUAL_TEST_EMAIL, VISUAL_TEST_PASSWORD } from "./fixtures";
import { resetVisualTaskData } from "./global-setup";

export async function signInVisualUser(page: import("@playwright/test").Page) {
  const user = await prisma.user.findUnique({
    where: { email: VISUAL_TEST_EMAIL },
    select: { id: true },
  });
  expect(user).toBeTruthy();
  await Promise.all([
    prisma.dailyAgenda.deleteMany({ where: { userId: user!.id } }),
    prisma.focusSession.deleteMany({ where: { userId: user!.id } }),
  ]);
  await resetVisualTaskData(user!.id);

  const csrfResponse = await page.request.get("/api/auth/csrf");
  expect(csrfResponse.ok()).toBeTruthy();
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
  const response = await page.request.post(
    "/api/auth/callback/credentials?json=true",
    {
      form: {
        csrfToken,
        email: VISUAL_TEST_EMAIL,
        password: VISUAL_TEST_PASSWORD,
        callbackUrl: "/calendar",
        json: "true",
      },
    }
  );
  expect(response.ok()).toBeTruthy();
}
