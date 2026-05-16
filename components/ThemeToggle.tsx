"use client";

import { useState, useEffect } from "react";
import { getTheme, toggleTheme } from "@/lib/theme";

function IconSun({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconMoon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function ThemeToggle({ size = 14 }: { size?: number }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(getTheme() === "dark");
  }, []);

  function handleToggle() {
    const next = toggleTheme();
    setDark(next === "dark");
  }

  return (
    <button
      onClick={handleToggle}
      aria-label="テーマ切り替え"
      className="text-zinc-400 hover:text-zinc-600 dark-hover transition-colors cursor-pointer"
    >
      {dark ? <IconSun size={size} /> : <IconMoon size={size} />}
    </button>
  );
}
