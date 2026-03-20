"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import * as motion from "framer-motion/client";
import { buildPalette, buildCssString, ThemePalette } from "@/lib/theme";

const PRESET_COLORS = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Sky", hex: "#0ea5e9" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Orange", hex: "#f97316" },
];

interface ThemeSettings {
  primaryColor: string;
  colorMode: "LIGHT" | "DARK" | "SYSTEM";
  lightLogoUrl: string | null;
  darkLogoUrl: string | null;
  homePageText: string;
}

const isValidHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

export default function ThemeTab({ initial }: { initial: ThemeSettings }) {
  const [settings, setSettings] = useState<ThemeSettings>(initial);
  const [hexInput, setHexInput] = useState(initial.primaryColor);
  const hex = settings.primaryColor;
  const [palette, setPalette] = useState<ThemePalette | null>(isValidHex(initial.primaryColor) ? buildPalette(initial.primaryColor) : null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const applyColor = (color: string) => {
    setHexInput(color);
    if (isValidHex(color)) {
      setSettings((s) => ({ ...s, primaryColor: color }));
      setPalette(buildPalette(color));
    }
  };

  const handleHexInput = (v: string) => {
    setHexInput(v);
    const normalized = v.startsWith("#") ? v : `#${v}`;
    if (isValidHex(normalized)) applyColor(normalized);
  };

  // Live preview effect
  useEffect(() => {
    if (palette && typeof document !== "undefined") {
      const styleTag = document.getElementById("theme-style");
      if (styleTag) {
        // Inject our media-query aware CSS block directly into the existing tag
        styleTag.innerHTML = buildCssString(palette, settings.colorMode);
      }
      
      const root = document.documentElement;
      
      // Keep data-theme in sync for any Tailwind `dark:xxx` classes to respond instantly
      if (settings.colorMode === "SYSTEM") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.setAttribute("data-theme", isDark ? "dark" : "light");
      } else {
        root.setAttribute("data-theme", settings.colorMode.toLowerCase());
      }
    }
  }, [palette, settings.colorMode]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-[--color-text-base]">Theme</h2>
        <p className="text-[--color-text-muted] text-sm mt-1">
          Customize the look and feel of the Prayer Wall app.
        </p>
      </div>

      {/* Color Mode */}
      <div>
        <label className="block text-sm font-medium text-[--color-text-muted] mb-3">Appearance</label>
        <div className="flex gap-3">
          {(["DARK", "SYSTEM", "LIGHT"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSettings((s) => ({ ...s, colorMode: mode }))}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                settings.colorMode === mode
                  ? "border-theme-500 bg-theme-500/10 text-[--color-text-base]"
                  : "border-[--color-border-base] bg-[--color-bg-panel] text-[--color-text-muted] hover:border-theme-400"
              }`}
            >
              <span>{mode === "DARK" ? "🌙" : mode === "LIGHT" ? "☀️" : "💻"}</span>
              <span>{mode === "DARK" ? "Dark" : mode === "LIGHT" ? "Light" : "System"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Color */}
      <div>
        <label className="block text-sm font-medium text-[--color-text-muted] mb-3">Primary Color</label>

        {/* Preset swatches */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.hex}
              onClick={() => applyColor(c.hex)}
              title={c.name}
              className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 ${
                hex.toLowerCase() === c.hex.toLowerCase()
                  ? "border-white scale-110"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>

        {/* Hex input + native color picker */}
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={isValidHex(hex) ? hex : "#6366f1"}
            onChange={(e) => applyColor(e.target.value)}
            className="w-12 h-10 rounded-lg cursor-pointer border border-[--color-border-base] bg-[--color-bg-panel] p-0.5"
          />
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexInput(e.target.value)}
            placeholder="#6366f1"
            maxLength={7}
            className={`flex-1 bg-[--color-bg-panel] border rounded-lg px-4 py-2.5 text-[--color-text-base] font-mono text-sm focus:outline-none focus:ring-1 transition-all ${
              isValidHex(hex)
                ? "border-[--color-border-base] focus:border-theme-500 focus:ring-theme-500"
                : "border-red-500 focus:border-red-500 focus:ring-red-500"
            }`}
          />
        </div>

        {/* Live palette preview */}
        {palette && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl overflow-hidden border border-[--color-border-base]"
          >
            <div className="flex h-12">
              {["900", "700", "500", "300", "50"].map((step) => (
                <div
                  key={step}
                  className="flex-1 flex items-center justify-center text-xs font-mono"
                  style={{
                    backgroundColor: `rgb(${palette.scale[step]})`,
                    color: parseInt(step) >= 500 ? palette.isDarkContrast ? "#0f172a" : "#ffffff" : "#0f172a",
                  }}
                >
                  {step}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Home Page Text */}
      <div className="pt-6 border-t border-[--color-border-base]">
        <label className="block text-sm font-medium text-[--color-text-muted] mb-3">Home Page Text</label>
        <textarea
          value={settings.homePageText}
          onChange={(e) => setSettings(s => ({ ...s, homePageText: e.target.value }))}
          className="w-full bg-[--color-bg-panel] border border-[--color-border-base] rounded-lg px-4 py-3 text-[--color-text-base] text-sm focus:outline-none focus:border-theme-500 focus:ring-1 focus:ring-theme-500 transition-all resize-y min-h-[100px]"
          placeholder="A safe space to share burdens, request intercession, and lift each other up in prayer."
        />
        <p className="text-xs text-[--color-text-muted] mt-2">
          This text appears prominently on the global landing page directly below the main title.
        </p>
      </div>

      {/* Light Mode Logo */}
      <div className="pt-6 border-t border-[--color-border-base]">
        <label className="block text-sm font-medium text-[--color-text-muted] mb-3">Light Mode Site Logo (Optional)</label>
        
        {initial.lightLogoUrl && (
          <div className="mb-4">
            <div className="p-4 bg-white border border-[--color-border-base] rounded-xl flex items-center justify-center mb-3 group relative h-32 w-full max-w-sm">
              <Image 
                src={initial.lightLogoUrl} 
                alt="Light Mode Logo" 
                fill
                className="object-contain p-2" 
              />
            </div>
            <button 
              type="button"
              onClick={async () => {
                if (confirm("Are you sure you want to remove the light mode site logo?")) {
                  const { clearSiteLogoMode } = await import("../actions");
                  const res = await clearSiteLogoMode('light');
                  if (res.success) window.location.reload();
                }
              }}
              className="text-sm text-red-500 hover:text-red-400 font-medium transition-colors"
            >
              Remove Light Logo
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input 
            type="file" 
            id="light-logo-upload"
            accept="image/*" 
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              
              const formData = new FormData();
              formData.append("logo", file);
              
              const { updateSiteLogo } = await import("../actions");
              setSaving(true);
              const res = await updateSiteLogo(formData, 'light');
              if (res.success) {
                window.location.reload();
              } else {
                alert(res.error || "Failed to upload logo");
                setSaving(false);
              }
            }}
          />
          <label 
            htmlFor="light-logo-upload"
            className="px-4 py-2 border border-[--color-border-base] hover:border-theme-500 rounded-lg text-sm font-medium text-[--color-text-base] cursor-pointer transition-colors bg-[--color-bg-panel]"
          >
            {initial.lightLogoUrl ? "Replace Light Logo" : "Upload Light Logo"}
          </label>
        </div>
      </div>

      {/* Dark Mode Logo */}
      <div className="pt-6 border-t border-[--color-border-base]">
        <label className="block text-sm font-medium text-[--color-text-muted] mb-3">Dark Mode Site Logo (Optional)</label>
        
        {initial.darkLogoUrl && (
          <div className="mb-4">
            <div className="p-4 bg-gray-900 border border-[--color-border-base] rounded-xl flex items-center justify-center mb-3 group relative h-32 w-full max-w-sm">
              <Image 
                src={initial.darkLogoUrl} 
                alt="Dark Mode Logo" 
                fill
                className="object-contain p-2" 
              />
            </div>
            <button 
              type="button"
              onClick={async () => {
                if (confirm("Are you sure you want to remove the dark mode site logo?")) {
                  const { clearSiteLogoMode } = await import("../actions");
                  const res = await clearSiteLogoMode('dark');
                  if (res.success) window.location.reload();
                }
              }}
              className="text-sm text-red-500 hover:text-red-400 font-medium transition-colors"
            >
              Remove Dark Logo
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input 
            type="file" 
            id="dark-logo-upload"
            accept="image/*" 
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              
              const formData = new FormData();
              formData.append("logo", file);
              
              const { updateSiteLogo } = await import("../actions");
              setSaving(true);
              const res = await updateSiteLogo(formData, 'dark');
              if (res.success) {
                window.location.reload();
              } else {
                alert(res.error || "Failed to upload logo");
                setSaving(false);
              }
            }}
          />
          <label 
            htmlFor="dark-logo-upload"
            className="px-4 py-2 border border-[--color-border-base] hover:border-theme-500 rounded-lg text-sm font-medium text-[--color-text-base] cursor-pointer transition-colors bg-[--color-bg-panel]"
          >
            {initial.darkLogoUrl ? "Replace Dark Logo" : "Upload Dark Logo"}
          </label>
        </div>
      </div>

      {/* Save */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={saveSettings}
        disabled={saving || !isValidHex(hex)}
        className="w-full py-3 rounded-xl font-medium text-[--color-text-base] transition-all bg-theme-600 hover:bg-theme-500 disabled:opacity-50"
      >
        {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Theme"}
      </motion.button>
    </div>
  );
}
