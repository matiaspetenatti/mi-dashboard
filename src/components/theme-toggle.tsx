"use client";

import { useLayoutEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "cn";

const STORAGE_KEY = "theme";

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function ThemeToggle({ className }: { className?: string }) {
  // Re-apply the stored theme after React's dev-mode remount. No-op in production.
  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        applyTheme(stored);
      }
    } catch {
      // localStorage can be unavailable in private mode.
    }
  }, []);

  function toggle() {
    const next = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";

    applyTheme(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage failures; the theme still applies for this session.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar entre tema claro y oscuro"
      title="Cambiar tema"
      className={cn(
        "relative grid size-10 place-items-center overflow-hidden rounded-full bg-surface-container text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-4 focus-visible:ring-primary/20",
        className,
      )}
    >
      <Sun className="size-5 rotate-0 scale-100 transition-all duration-500 ease-emphasized dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-5 rotate-90 scale-0 transition-all duration-500 ease-emphasized dark:rotate-0 dark:scale-100" />
    </button>
  );
}
