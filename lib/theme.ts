export type Theme = "light" | "dark" | "system";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("theme") as Theme) ?? "system";
}

export function setTheme(theme: Theme) {
  localStorage.setItem("theme", theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme) {
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", prefersDark);
  } else {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}

export function cycleTheme(): Theme {
  const current = getTheme();
  const next: Theme = current === "light" ? "dark" : current === "dark" ? "system" : "light";
  setTheme(next);
  return next;
}

export function initTheme() {
  const theme = getTheme();
  applyTheme(theme);
  if (theme === "system") {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (getTheme() === "system") {
        document.documentElement.classList.toggle("dark", e.matches);
      }
    });
  }
}
