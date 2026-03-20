/**
 * Color utility: derives a full palette from a single hex primary color.
 * Works in both Node.js (server) and the browser.
 */

export function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((n) => n / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToRgbString(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return `${f(0)} ${f(8)} ${f(4)}`;
}

export interface ThemePalette {
  primaryHex: string;
  isDarkContrast: boolean;
  scale: Record<string, string>; // "50" -> "245 243 255" (RGB triplet)
}

export function buildPalette(hex: string): ThemePalette {
  const [h, s, l] = hexToHsl(hex);

  // Generate 11-step scale by varying luminance
  // If the base color is extremely light/dark, we shift the midpoint slightly
  const lums = [97, 94, 88, 78, 65, l, 45, 35, 27, 20, 10];
  
  const scale: Record<string, string> = {};
  const steps = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
  
  steps.forEach((step, i) => {
    // Tweak saturation slightly across the scale to mimic hand-crafted palettes
    const sMod = i < 5 ? Math.max(s - (5 - i) * 5, 10) : s;
    scale[step] = hslToRgbString(h, sMod, lums[i]);
  });

  // Ensure '500' is EXACTLY the requested hex color to match user expectation
  scale["500"] = hexToRgb(hex).join(" ");

  return {
    primaryHex: hex,
    isDarkContrast: l > 55, // Use dark text on primary bg if luminance > 55%
    scale,
  };
}

export function buildCssString(
  palette: ThemePalette,
  mode: "LIGHT" | "DARK" | "SYSTEM"
): string {
  const getVars = (dark: boolean) => `
    --color-bg-base: ${dark ? `rgb(${palette.scale["950"]})` : `rgb(${palette.scale["50"]})`};
    --color-bg-panel: ${dark ? `rgb(${palette.scale["900"]})` : "#ffffff"};
    --color-text-base: ${dark ? "#f8fafc" : "#0f172a"};
    --color-text-muted: ${dark ? `rgb(${palette.scale["300"]})` : `rgb(${palette.scale["700"]})`};
    --color-border-base: ${dark ? `rgba(${palette.scale["400"]}, 0.2)` : `rgba(${palette.scale["500"]}, 0.2)`};

    /* Additional layer for settings glass */
    --color-glass: ${dark ? `rgba(15, 23, 42, 0.4)` : `rgba(255, 255, 255, 0.7)`};
    --color-glass-hover: ${dark ? `rgba(30, 41, 59, 0.5)` : `rgba(255, 255, 255, 0.9)`};
    --color-glass-border: ${dark ? `rgba(255, 255, 255, 0.05)` : `rgba(0, 0, 0, 0.05)`};
  `;

  const commonVars = `
    --color-primary-contrast: ${palette.isDarkContrast ? "#0f172a" : "#ffffff"};
    ${Object.entries(palette.scale)
      .map(([step, rgb]) => `--theme-${step}: ${rgb};`)
      .join("\n    ")}
  `;

  if (mode === "SYSTEM") {
    return `
      :root {
        ${commonVars}
      }
      @media (prefers-color-scheme: light) {
        :root {
          ${getVars(false)}
        }
      }
      @media (prefers-color-scheme: dark) {
        :root {
          ${getVars(true)}
        }
      }
    `;
  }

  // Pure LIGHT or DARK mode
  return `
    :root {
      ${commonVars}
      ${getVars(mode === "DARK")}
    }
  `;
}
