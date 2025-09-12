"use client";

import { useEffect } from "react";
import { useTheme, type Theme } from "./ThemeProvider";
import { usePreview } from "./PreviewProvider";

const fontImportMap: Record<Theme, string> = {
  light: `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');
  `,
  dark: `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');
  `,
  doom: `
    @import url('https://fonts.googleapis.com/css2?family=Oxanium:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap');
  `,
  cozy: `
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap');
  `,
  nature: `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap');
  `,
  cyberpunk: `
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
  `,
  amethyst: `
    @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap');
  `,
  grove: `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700&display=swap');
  `,
  ocean: `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap');
  `,
};

export function DynamicFontLoader() {
  const { theme } = useTheme();
  const { isPreviewMode, previewTheme } = usePreview();

  const activeTheme = isPreviewMode && previewTheme ? previewTheme : theme;

  useEffect(() => {
    const styleId = "dynamic-theme-fonts";
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement("style");
    style.id = styleId;

    style.innerHTML = fontImportMap[activeTheme] || fontImportMap.light;
    document.head.appendChild(style);

    return () => {
      const styleTag = document.getElementById(styleId);
      if (styleTag) {
        styleTag.remove();
      }
    };
  }, [activeTheme]);

  return null;
}
