import { useEffect, useState } from "react";

const STORAGE_KEY = "merchrelay-theme";

/* eslint-disable react/prop-types */

export default function ThemeShell({ children }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.merchTheme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const nextTheme = theme === "light" ? "dark" : "light";

  return (
    <div className="theme-shell" data-theme={theme}>
      <button
        className="theme-toggle"
        type="button"
        onClick={() => setTheme(nextTheme)}
        aria-label={`Switch to ${nextTheme} mode`}
      >
        {theme === "light" ? "Dark mode" : "Light mode"}
      </button>
      {children}
    </div>
  );
}

/* eslint-enable react/prop-types */
