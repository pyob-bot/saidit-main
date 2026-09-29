"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

interface ThemeContextType {
  themeMode: string;
  accentColor: string;
  compactMode: boolean;
  applyTheme: (mode: string, color: string, compact: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: "light",
  accentColor: "#ff4500",
  compactMode: false,
  applyTheme: () => {},
});

function applyThemeToDOM(mode: string, color: string, compact: boolean) {
  const root = document.documentElement;

  root.classList.remove("light", "dark");
  if (mode === "dark") {
    root.classList.add("dark");
  } else if (mode === "auto") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.add(prefersDark ? "dark" : "light");
  } else {
    root.classList.add("light");
  }

  root.style.setProperty("--accent-color", color);
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const hoverR = Math.max(0, r - 20);
  const hoverG = Math.max(0, g - 20);
  const hoverB = Math.max(0, b - 20);
  root.style.setProperty("--accent-hover", `#${hoverR.toString(16).padStart(2, "0")}${hoverG.toString(16).padStart(2, "0")}${hoverB.toString(16).padStart(2, "0")}`);

  document.querySelectorAll(".btn-primary").forEach((el) => {
    (el as HTMLElement).style.backgroundColor = color;
  });
  document.querySelectorAll(".sidebar-card-header").forEach((el) => {
    (el as HTMLElement).style.backgroundColor = color;
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState("light");
  const [accentColor, setAccentColor] = useState("#ff4500");
  const [compactMode, setCompactMode] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("saidit_theme");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setThemeMode(parsed.mode || "light");
        setAccentColor(parsed.color || "#ff4500");
        setCompactMode(parsed.compact || false);
        applyThemeToDOM(parsed.mode || "light", parsed.color || "#ff4500", parsed.compact || false);
      } catch {}
    }

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          const mode = data.settings.themeMode || "light";
          const color = data.settings.accentColor || "#ff4500";
          const compact = data.settings.compactMode || false;
          setThemeMode(mode);
          setAccentColor(color);
          setCompactMode(compact);
          applyThemeToDOM(mode, color, compact);
          localStorage.setItem("saidit_theme", JSON.stringify({ mode, color, compact }));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const applyTheme = useCallback((mode: string, color: string, compact: boolean) => {
    setThemeMode(mode);
    setAccentColor(color);
    setCompactMode(compact);
    applyThemeToDOM(mode, color, compact);
    localStorage.setItem("saidit_theme", JSON.stringify({ mode, color, compact }));
  }, []);

  return (
    <ThemeContext.Provider value={{ themeMode, accentColor, compactMode, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
