export type Theme = "classic" | "dark" | "sepia" | "night-blue" | "emerald" | "contrast";

export const THEME_COLORS: Record<Theme, string> = {
  classic: "#2b4c7e",
  dark: "#000000",
  sepia: "#3b2a1a",
  "night-blue": "#060d1c",
  emerald: "#06130e",
  contrast: "#000000",
};

export function isDarkTheme(theme: string): boolean {
  return theme === "dark" || theme === "night-blue" || theme === "emerald" || theme === "contrast";
}
