import { expect, test } from "@playwright/test";

test("theme toggle hydrates with a saved dark preference", async ({ page }) => {
  const hydrationMessages: string[] = [];

  page.on("console", (message) => {
    if (message.text().includes("Hydration failed")) {
      hydrationMessages.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    if (error.message.includes("Hydration failed")) {
      hydrationMessages.push(error.message);
    }
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("blog-theme", "dark");
  });
  await page.goto("/");

  await expect(page.getByRole("switch")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  expect(hydrationMessages).toEqual([]);
});

test("public CMS pages render and navigate from the shared header", async ({
  page,
}) => {
  await page.goto("/");
  const navigation = page.getByRole("navigation");
  const slideTabs = navigation.locator("[data-site-nav-tabs]");
  const slideCursor = navigation.locator("[data-site-nav-cursor]");

  await expect(navigation).toBeVisible();
  await expect(slideTabs).toBeVisible();
  await expect(slideTabs).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(slideTabs).toHaveCSS("display", "flex");
  await expect(slideCursor).toHaveCSS("opacity", "0");
  await expect(page.getByRole("link", { name: "Read the blog" })).toBeVisible();
  await expect
    .poll(async () =>
      navigation.evaluate((element) => {
        const navigationBox = element.getBoundingClientRect();
        const tabsBox = element
          .querySelector("[data-site-nav-tabs]")
          ?.getBoundingClientRect();

        if (!tabsBox) {
          return Number.POSITIVE_INFINITY;
        }

        return Math.abs(
          tabsBox.left +
            tabsBox.width / 2 -
            (navigationBox.left + navigationBox.width / 2),
        );
      }),
    )
    .toBeLessThan(8);

  const blogLink = navigation.getByRole("link", { name: "Blog", exact: true });
  await expect(blogLink).toHaveCSS("color", "rgb(0, 0, 0)");
  await blogLink.hover();
  await expect(slideCursor).toHaveCSS("opacity", "1");
  await expect(blogLink).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect
    .poll(async () =>
      slideCursor.evaluate((element) =>
        Math.round(element.getBoundingClientRect().width),
      ),
    )
    .toBeGreaterThan(0);

  await page.getByRole("link", { name: "Read the blog" }).hover();
  await expect(slideCursor).toHaveCSS("opacity", "0");

  await blogLink.click();
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

test("public shell applies footer and page enter styles", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Blog", exact: true })
    .click();
  await page.waitForURL(/\/blog$/);
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .some(
        (animation) =>
          animation instanceof CSSAnimation &&
          animation.animationName === "pageEnter",
      ),
  );

  const shellStyles = await page.evaluate(() => {
    const footer = document.querySelector(".site-footer");
    const footerInner = document.querySelector(".site-footer-inner");
    const firstPageChild = document.querySelector("[data-page] > *");
    const footerStyle = footer ? getComputedStyle(footer) : null;
    const footerInnerStyle = footerInner ? getComputedStyle(footerInner) : null;
    const firstPageChildStyle = firstPageChild
      ? getComputedStyle(firstPageChild)
      : null;

    return {
      footerBackground: footerStyle?.backgroundColor ?? null,
      footerInnerDisplay: footerInnerStyle?.display ?? null,
      pageAnimationName: firstPageChildStyle?.animationName ?? null,
    };
  });

  expect(shellStyles.footerBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(shellStyles.footerInnerDisplay).toBe("grid");
  expect(shellStyles.pageAnimationName).toBe("pageEnter");
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

test("blog detail page uses a structured article layout", async ({ page }) => {
  await page.goto("/blog");

  const firstPostLink = page.locator(".card-item .title-link").first();
  await expect(firstPostLink).toBeVisible();

  await firstPostLink.click();
  await expect(page).toHaveURL(/\/blog\/[^/?#]+$/);
  await expect(page.locator(".blog-detail-shell")).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Article details" }),
  ).toBeVisible();
  await expect(page.locator(".blog-detail-content")).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to blog" })).toHaveAttribute(
    "href",
    "/blog",
  );
});
