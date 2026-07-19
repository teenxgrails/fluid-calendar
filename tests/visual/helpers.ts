import { expect } from "@playwright/test";

import { VISUAL_TEST_EMAIL, VISUAL_TEST_PASSWORD } from "./fixtures";

export async function signInVisualUser(page: import("@playwright/test").Page) {
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
