import { expect, test } from "@playwright/test";

test("public CMS pages render and navigate from the shared header", async ({
  page,
}) => {
  await page.goto("/");
  const navigation = page.getByRole("navigation");

  await expect(
    page.getByRole("heading", {
      name: /Notes on software delivery, systems, and product engineering/i,
    }),
  ).toBeVisible();

  await navigation.getByRole("link", { name: "Blog", exact: true }).click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.getByRole("heading", { name: "Blog" })).toBeVisible();
  await expect(page.getByPlaceholder("Search posts")).toBeVisible();

  await navigation
    .getByRole("link", { name: "Projects", exact: true })
    .click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(
    page.getByText("Selected work, experiments, and engineering case studies."),
  ).toBeVisible();

  await navigation.getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole("heading", { name: "About" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Read the blog" })).toBeVisible();

  await navigation.getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("heading", { name: "Contact" })).toBeVisible();
  await expect(
    page.getByText(
      "The simplest way to get in touch for project, writing, or engineering conversations.",
    ),
  ).toBeVisible();
});

test("blog search shows an empty state for a unique query", async ({ page }) => {
  const query = "playwright-no-results-2026-05-24";

  await page.goto("/blog");
  await page.getByRole("searchbox").fill(query);
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page).toHaveURL(new RegExp(`/blog\\?q=${query}$`));
  await expect(page.getByText(`Search results for ${query}`)).toBeVisible();
  await expect(page.getByText("No posts match this search.")).toBeVisible();
});
