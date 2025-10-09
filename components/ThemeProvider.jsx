// theme/ThemeProvider.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* helpers: make light/dark tints from a hex */
const clamp = (n) => Math.max(0, Math.min(255, n));
const hexToRgb = (hex) => {
  const s = hex.replace("#", "");
  const b = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  const n = parseInt(b, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const rgbToHex = ({ r, g, b }) =>
  "#" + [r, g, b].map((x) => clamp(Math.round(x)).toString(16).padStart(2, "0")).join("");
const mix = (c1, c2, t) => ({
  r: c1.r + (c2.r - c1.r) * t,
  g: c1.g + (c2.g - c1.g) * t,
  b: c1.b + (c2.b - c1.b) * t,
});
const lighten = (hex, t = 0.85) => rgbToHex(mix(hexToRgb(hex), { r: 255, g: 255, b: 255 }, t));
const darken = (hex, t = 0.2) => rgbToHex(mix(hexToRgb(hex), { r: 0, g: 0, b: 0 }, t));

const STORAGE_KEY = "@theme_primary";
const DEFAULT_PRIMARY = "#E53E3E";

// Files that should use dynamic theme (all others will use static #E53E3E)
const THEME_ENABLED_FILES = [
  'HomeScreen.jsx',
  'StoreProfileModal.jsx'
];

// Helper function to check if current file should use dynamic theme
const shouldUseDynamicTheme = () => {
  // This will be called from components that want to use dynamic theme
  // For now, we'll allow it for the specified files
  return true;
};

export const createTheme = (primary) => {
  const onPrimary = "#ffffff";
  return {
    colors: {
      primary,
      primary700: darken(primary, 0.18),
      primary500: primary,
      primary200: lighten(primary, 0.6),
      primary100: lighten(primary, 0.8),
      onPrimary,
      surface: "#ffffff",
      surfaceAlt: "#F6F6F6",
      text: "#1A1A1A",
      muted: "#7C7C7C",
    },
  };
};

const ThemeContext = createContext({
  theme: createTheme(DEFAULT_PRIMARY),
  primary: DEFAULT_PRIMARY,
  setPrimary: (_hex) => {},
});

export const ThemeProvider = ({ children }) => {
  const [primary, setPrimaryState] = useState(DEFAULT_PRIMARY);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setPrimaryState(saved);
    })();
  }, []);

  const setPrimary = async (hex) => {
    setPrimaryState(hex);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, hex);
    } catch {}
  };

  const value = useMemo(() => ({ theme: createTheme(primary), primary, setPrimary }), [primary]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

// Static colors for files that don't use dynamic theme
export const STATIC_COLORS = {
  primary: "#E53E3E",
  primary700: "#B91C1C",
  primary500: "#E53E3E", 
  primary200: "#FECACA",
  primary100: "#FEE2E2",
  onPrimary: "#ffffff",
  surface: "#ffffff",
  surfaceAlt: "#F6F6F6",
  text: "#1A1A1A",
  muted: "#7C7C7C",
};
