import { useEffect, useState } from "react";
import { getInitialTheme, applyTheme, useTheme, type Theme } from "@/lib/theme";

// Apply theme immediately on page load to prevent flash
if (typeof document !== "undefined") {
  const stored = localStorage.getItem("projectlink-theme");
  if (stored === "light" || stored === "dark") {
    applyTheme(stored);
  } else {
    applyTheme("dark");
  }
}

export function ThemeInitializer() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    applyTheme(theme);
  }, [theme]);

  // Prevent flash of wrong theme
  if (!mounted) {
    const initial = getInitialTheme();
    applyTheme(initial);
  }

  return null;
}
