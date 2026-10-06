import { Image, StyleSheet, View } from "react-native";
import type { MiniApp } from "@/data/miniApps";
import { useTheme } from "@/theme/ThemeProvider";

type AppIconProps = {
  app: MiniApp;
  size: number;
  // Defaults to a circle; pass a radius for squircle-style icons.
  radius?: number;
  bordered?: boolean;
  glyphSize?: number;
};

// Partner PNGs carry ~12% padding around their squircle, so they are scaled up inside a clipped frame.
export function AppIcon({ app, size, radius, bordered = true, glyphSize }: AppIconProps) {
  const { colors } = useTheme();
  const frame = {
    width: size,
    height: size,
    borderRadius: radius ?? size / 2,
    borderWidth: bordered ? StyleSheet.hairlineWidth * 2 : 0,
    borderColor: colors.line,
  };

  if (app.logo) {
    return (
      <View style={[styles.clip, frame, styles.logoFrame]}>
        <Image source={app.logo} style={styles.logo} resizeMode="cover" accessibilityIgnoresInvertColors />
      </View>
    );
  }

  if (app.image) {
    return (
      <View style={[styles.clip, frame]}>
        <Image source={app.image} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />
      </View>
    );
  }

  const Icon = app.icon;
  return (
    <View style={[styles.glyphFrame, frame, { backgroundColor: colors.soft }]}>
      <Icon size={glyphSize ?? Math.round(size * 0.4)} color={colors.ink} strokeWidth={1.8} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  image: { position: "absolute", left: "-15%", top: "-15%", width: "130%", height: "130%" },
  // Site logos are flattened onto white, so the tile stays white in dark mode too.
  logoFrame: { backgroundColor: "#FFFFFF" },
  logo: { width: "100%", height: "100%" },
  glyphFrame: { alignItems: "center", justifyContent: "center" },
});
