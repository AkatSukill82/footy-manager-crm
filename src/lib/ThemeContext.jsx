import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({ theme: "light", setTheme: () => {}, toggleTheme: () => {} });

const apply = (theme) => {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
};

const initial = () => {
  try {
    const saved = localStorage.getItem("fdm_theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch { /* ignore */ }
  // Par défaut : suit la préférence système.
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(initial);

  useEffect(() => { apply(theme); }, [theme]);

  const setTheme = (t) => {
    setThemeState(t);
    try { localStorage.setItem("fdm_theme", t); } catch { /* quota */ }
  };
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
