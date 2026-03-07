import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "YouTube Recipe Card" })).toBeVisible();
});

test("import to detail to cook flow works", async ({ page }) => {
  await page.route("**/api/recipes/import", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        recipe_id: "sample-e2e",
        extraction_confidence: 0,
        nutrition: null,
      }),
    });
  });

  await page.goto("/");
  await page.getByTestId("youtube-url-input").fill("https://www.youtube.com/watch?v=WLfTFCKqANA");
  await page.getByTestId("youtube-import-submit").click();

  await expect(page).toHaveURL(/\/recipes\/sample-e2e$/);
  await expect(page.getByRole("heading", { name: "高たんぱく鶏むねソテー" })).toBeVisible();

  await page.getByRole("link", { name: "CookModeを開く" }).click();

  await expect(page).toHaveURL(/\/recipes\/sample-e2e\/cook$/);
  await expect(page.getByRole("heading", { name: "CookMode" })).toBeVisible();
  await expect(page.getByTestId("cook-step-progress")).toContainText("1 / 4");

  await page.getByRole("button", { name: "次へ" }).click();
  await expect(page.getByTestId("cook-step-progress")).toContainText("2 / 4");
});

test.describe("mobile one-hand usability", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("cook mode primary controls are reachable and operable", async ({ page }) => {
    await page.route("**/api/recipes/import", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          recipe_id: "sample-mobile",
          extraction_confidence: 0,
          nutrition: null,
        }),
      });
    });

    await page.goto("/");
    await page.getByTestId("youtube-url-input").fill("https://www.youtube.com/watch?v=WLfTFCKqANA");
    await page.getByTestId("youtube-import-submit").click();

    await expect(page).toHaveURL(/\/recipes\/sample-mobile$/);
    await page.getByRole("link", { name: "CookModeを開く" }).click();

    await expect(page).toHaveURL(/\/recipes\/sample-mobile\/cook$/);

    const backButton = page.getByRole("button", { name: "戻る" });
    const nextButton = page.getByRole("button", { name: "次へ" });
    const timerButton = page.getByRole("button", { name: "開始" });

    await expect(backButton).toBeVisible();
    await expect(nextButton).toBeVisible();
    await expect(timerButton).toBeVisible();

    await nextButton.click();
    await expect(page.getByTestId("cook-step-progress")).toContainText("2 / 4");
  });
});
