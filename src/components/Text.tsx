import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { fonts } from "@/theme/colors";
import { useTheme } from "@/theme/ThemeProvider";

type Weight = keyof typeof fonts;

export type TextProps = RNTextProps & {
  weight?: Weight;
  size?: number;
  color?: string;
  // Letter spacing in em, matching the design spec (converted to px for React Native).
  tracking?: number;
};

export function Text({ weight = "regular", size = 15, color, tracking, style, ...props }: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      {...props}
      style={[
        {
          fontFamily: fonts[weight],
          fontSize: size,
          color: color ?? colors.ink,
          letterSpacing: tracking ? tracking * size : undefined,
        },
        style,
      ]}
    />
  );
}
