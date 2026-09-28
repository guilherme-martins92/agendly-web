"use client";

import { useCallback, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/components/theme-script";

export type Theme = "light" | "dark";

function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** Tema atual (atributo data-theme no <html>, aplicado antes da pintura pelo ThemeScript). */
export function useTheme() {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "light");

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Armazenamento indisponível (ex.: navegação privada): o tema vale só para esta aba
    }
  }, []);

  const toggleTheme = useCallback(() => setTheme(readTheme() === "dark" ? "light" : "dark"), [setTheme]);

  return { theme, setTheme, toggleTheme };
}
