"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-surface border border-border">
        <Sun className="h-5 w-5 text-text-secondary" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative p-2 rounded-lg bg-surface border border-border hover:bg-primary/10 transition-colors"
      aria-label="Toggle theme"
    >
      <Sun className="absolute inset-0 m-auto h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-text-primary" />
      <Moon className="absolute inset-0 m-auto h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-text-primary" />
    </button>
  );
}
