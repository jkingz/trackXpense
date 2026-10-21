export const THEME_STORAGE_KEY = "theme";

export type Theme = "light" | "dark" | "system";

/** The stored choice, or "system" when nothing valid has been saved. */
export function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

/** Whether the given choice renders dark, given the OS preference. */
export function isDarkTheme(theme: Theme, prefersDark: boolean): boolean {
  return theme === "dark" || (theme === "system" && prefersDark);
}

/**
 * Runs before the first paint, as the first script in `<body>`.
 *
 * The class has to be on `<html>` before the browser paints, or a dark-mode
 * visitor sees the light theme flash for a frame. It cannot live in the
 * provider: effects run after paint. Kept as a string so the same rules can be
 * unit-tested against the TypeScript below.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})()`;
