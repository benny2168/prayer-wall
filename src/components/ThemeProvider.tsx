import { prisma } from "@/lib/prisma";
import { buildPalette, buildCssString } from "@/lib/theme";

/**
 * Server component — reads SiteSettings from DB and injects CSS custom properties
 * into the document root via an inline <style> tag. Runs on every request.
 */
export default async function ThemeProvider() {
  const settings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const palette = buildPalette(settings.primaryColor);
  const cssString = buildCssString(palette, settings.colorMode as ("LIGHT" | "DARK" | "SYSTEM"));

  // Script to sync data-theme for any tailwind `dark:xxx` selectors
  const themeScript = `
    (function() {
      const mode = '${settings.colorMode}';
      if (mode === 'SYSTEM') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', mode.toLowerCase());
      }
    })();
  `;

  return (
    <>
      <style id="theme-style" dangerouslySetInnerHTML={{ __html: cssString }} />
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
    </>
  );
}
