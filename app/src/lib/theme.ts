import { useEffect, useState, useCallback } from "react";
import { updateUserPreferences } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export type Theme = "dark" | "light";

const STORAGE_KEY = "projectlink-theme";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
}

export function useTheme() {
  const { user, token } = useAuth();
  const [theme, setThemeState] = useState<Theme>("dark");
  const [isInitialized, setIsInitialized] = useState(false);

  // Load theme from user profile or localStorage when user changes
  useEffect(() => {
    console.log("=== useTheme Effect ===");
    console.log("User ID:", user?.id);
    console.log("User theme:", user?.theme);
    console.log("Token exists:", !!token);

    if (user?.theme) {
      // Use user's saved theme from database
      console.log("📥 Loading theme from DB:", user.theme);
      setThemeState(user.theme);
      applyTheme(user.theme);
    } else if (!user) {
      // No user - use localStorage
      console.log("📥 No user, loading from localStorage");
      const initial = getInitialTheme();
      setThemeState(initial);
      applyTheme(initial);
    } else {
      // User exists but no theme set - use default
      console.log("📥 User exists but no theme, using default: dark");
      setThemeState("dark");
      applyTheme("dark");
    }

    setIsInitialized(true);
  }, [user?.id, user?.theme]); // Depend on user ID to trigger re-initialization

  const setTheme = useCallback(
    async (t: Theme) => {
      console.log("=== Setting Theme ===");
      console.log("New theme:", t);
      console.log("User ID:", user?.id);

      setThemeState(t);
      applyTheme(t);

      // Save to localStorage as fallback
      localStorage.setItem(STORAGE_KEY, t);
      console.log("💾 Saved to localStorage:", t);

      // Save to database if user is logged in
      if (user && token) {
        try {
          console.log("💾 Saving to database for user:", user.id);
          await updateUserPreferences({ theme: t }, token);
          console.log("✅ Theme saved to database successfully");
        } catch (error) {
          console.error("❌ Failed to save theme preference:", error);
          toast.error("Erreur lors de la sauvegarde du thème");
        }
      } else {
        console.log("⚠️ No user or token, theme not saved to DB");
      }
    },
    [user, token],
  );

  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}
