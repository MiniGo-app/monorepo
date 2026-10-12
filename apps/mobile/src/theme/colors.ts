export type ColorMode = "light" | "dark";
export type ThemePreference = ColorMode | "system";

export type Palette = {
  bg: string;
  ink: string;
  muted: string;
  label: string;
  hair: string;
  line: string;
  soft: string;
  chip: string;
  chipActive: string;
  chipActiveInk: string;
  list: string;
  frame: string;
  overlay: string;
  hero: string;
  heroBorder: string;
  panel: string;
  panelBorder: string;
  panelInk: string;
  panelButton: string;
  panelButtonBorder: string;
  nav: string;
  navBorder: string;
  navActive: string;
  navActiveInk: string;
  navIdle: string;
  navShadow: string;
  primary: string;
  onPrimary: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  partner: {
    bg: string;
    ink: string;
    muted: string;
    soft: string;
    line: string;
    accent: string;
    onAccent: string;
  };
};

export const palettes: Record<ColorMode, Palette> = {
  light: {
    bg: "#FFFFFF",
    ink: "#0B0B0D",
    muted: "#71717A",
    label: "#52525B",
    hair: "#EDEDEF",
    line: "#E4E4E7",
    soft: "#F4F4F5",
    chip: "#F4F4F5",
    chipActive: "#E4E4E7",
    chipActiveInk: "#0B0B0D",
    list: "#FFFFFF",
    frame: "#F7F7F8",
    overlay: "rgba(0,0,0,0.45)",
    hero: "#0B0B0D",
    heroBorder: "#0B0B0D",
    panel: "#F4F4F5",
    panelBorder: "#E4E4E7",
    panelInk: "#0B0B0D",
    panelButton: "#FFFFFF",
    panelButtonBorder: "#E4E4E7",
    nav: "#0B0B0D",
    navBorder: "#0B0B0D",
    navActive: "#FFFFFF",
    navActiveInk: "#0B0B0D",
    navIdle: "#8E8E96",
    navShadow: "rgba(11,11,13,0.4)",
    primary: "#0B0B0D",
    onPrimary: "#FFFFFF",
    danger: "#DC2626",
    dangerSoft: "#FEF2F2",
    success: "#15803D",
    successSoft: "#F0FDF4",
    warning: "#B45309",
    warningSoft: "#FFFBEB",
    partner: {
      bg: "#FFFFFF",
      ink: "#10131A",
      muted: "#667085",
      soft: "#EEF2FF",
      line: "#E6E8EF",
      accent: "#1D4ED8",
      onAccent: "#FFFFFF",
    },
  },
  dark: {
    bg: "#000000",
    ink: "#F5F5F7",
    muted: "#8E8E96",
    label: "#A1A1AA",
    hair: "#1C1C1F",
    line: "#26262B",
    soft: "#121214",
    chip: "#18181B",
    chipActive: "#F5F5F7",
    chipActiveInk: "#000000",
    list: "#0C0C0E",
    frame: "#101012",
    overlay: "rgba(0,0,0,0.6)",
    hero: "#141417",
    heroBorder: "#232327",
    panel: "#141417",
    panelBorder: "#232327",
    panelInk: "#FFFFFF",
    panelButton: "rgba(255,255,255,0.08)",
    panelButtonBorder: "rgba(255,255,255,0.1)",
    nav: "#1C1C1F",
    navBorder: "#2A2A2F",
    navActive: "#F5F5F7",
    navActiveInk: "#000000",
    navIdle: "#8E8E96",
    navShadow: "rgba(0,0,0,0.6)",
    primary: "#F5F5F7",
    onPrimary: "#000000",
    danger: "#F87171",
    dangerSoft: "#2A1215",
    success: "#4ADE80",
    successSoft: "#0F2417",
    warning: "#FBBF24",
    warningSoft: "#2A2110",
    partner: {
      bg: "#0E1016",
      ink: "#F2F4F8",
      muted: "#98A2B3",
      soft: "#172045",
      line: "#232838",
      accent: "#7C9BFF",
      onAccent: "#0B0B0D",
    },
  },
};

export const fonts = {
  regular: "Geist_400Regular",
  medium: "Geist_500Medium",
  semibold: "Geist_600SemiBold",
} as const;
