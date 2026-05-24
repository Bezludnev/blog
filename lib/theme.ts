export const THEME_STORAGE_KEY = "blog-theme";

export type StoredTheme = "dark" | "light";

export function isStoredTheme(value: unknown): value is StoredTheme {
  return value === "dark" || value === "light";
}

export function getNextStoredTheme(theme: StoredTheme): StoredTheme {
  return theme === "dark" ? "light" : "dark";
}

export function getThemeBootstrapScript() {
  return `
    (function () {
      try {
        var storedTheme = window.localStorage.getItem("${THEME_STORAGE_KEY}");
        var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        var shouldUseDark = storedTheme === "dark" || (!storedTheme && prefersDark);
        document.documentElement.classList.toggle("dark", shouldUseDark);
      } catch (_) {}
    })();
  `;
}
