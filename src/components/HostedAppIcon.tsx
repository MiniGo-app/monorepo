import { Globe } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import type { HostedApp } from "@/mini/types";
import { useTheme } from "@/theme/ThemeProvider";
import { AppIcon } from "./AppIcon";

export function HostedAppIcon({ app, size, radius, glyphSize }: { app: HostedApp; size: number; radius?: number; glyphSize?: number }) {
  const { colors } = useTheme();
  if (app.catalog) return <AppIcon app={app.catalog} size={size} radius={radius} bordered={false} glyphSize={glyphSize} />;
  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: radius ?? size / 2, backgroundColor: colors.chip }]}>
      <Globe size={glyphSize ?? size * 0.45} color={colors.ink} strokeWidth={1.7} />
    </View>
  );
}

const styles = StyleSheet.create({ frame: { alignItems: "center", justifyContent: "center" } });
