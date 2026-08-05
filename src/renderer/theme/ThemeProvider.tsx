import { useEffect, useState, type PropsWithChildren } from "react";
import type { AppSettings, SystemCapabilities } from "../../shared/contracts";

export function ThemeProvider({ theme, capabilities, children }: PropsWithChildren<{
  theme: AppSettings["theme"];
  capabilities: SystemCapabilities;
}>) {
  const [systemTheme, setSystemTheme] = useState(capabilities.systemTheme);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemTheme(media.matches ? "dark" : "light");
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const resolved = theme === "system" ? systemTheme : theme;
  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
  }, [resolved]);
  return children;
}
