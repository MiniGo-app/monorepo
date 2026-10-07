import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useTheme } from "@/theme/ThemeProvider";

// A ring, a dot and a smile in one colour, so it works on any background. Geometry is from assets/brand.
const VIEW = { x: 456.66, y: 283.99, w: 613.31, h: 956.73 };

type LogoProps = { size?: number; color?: string };

export function Logo({ size = 32, color }: LogoProps) {
  const { colors } = useTheme();
  const fill = color ?? colors.ink;
  return (
    <Svg
      width={(size * VIEW.w) / VIEW.h}
      height={size}
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      accessibilityLabel="MiniGo"
      accessibilityRole="image"
    >
      <Circle cx={742.16} cy={723.5} r={257} fill="none" stroke={fill} strokeWidth={57} />
      <Circle cx={982.18} cy={360.95} r={76.96} fill={fill} />
      <Path d="M1029.75 982.94A169.44 169.44 0 0 1 711.78 1100.15" fill="none" stroke={fill} strokeWidth={59.56} />
    </Svg>
  );
}

// Black tile in light mode, white tile in dark mode.
export function LogoTile({ size = 36 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: colors.primary }]}>
      <Logo size={size * 0.68} color={colors.onPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: "center", justifyContent: "center" },
});
