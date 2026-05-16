export function getTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem("theme") as "light" | "dark") ?? "light";
}

export function setTheme(theme: "light" | "dark") {
  localStorage.setItem("theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function toggleTheme(): "light" | "dark" {
  const next = getTheme() === "light" ? "dark" : "light";
  setTheme(next);
  return next;
}

export function initTheme() {
  const theme = getTheme();
  document.documentElement.classList.toggle("dark", theme === "dark");
}
