import type { LucideIcon } from "lucide-react-native";
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "@/components/Text";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "lg" | "md";
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  icon: Icon,
  iconRight: IconRight,
  loading,
  disabled,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const { colors } = useTheme();
  const palette = {
    primary: { bg: colors.primary, border: colors.primary, ink: colors.onPrimary },
    secondary: { bg: "transparent", border: colors.line, ink: colors.ink },
    ghost: { bg: "transparent", border: "transparent", ink: colors.ink },
    danger: { bg: colors.dangerSoft, border: colors.dangerSoft, ink: colors.danger },
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === "lg" ? styles.lg : styles.md,
        { backgroundColor: palette.bg, borderColor: palette.border },
        disabled && !loading && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.ink} />
      ) : (
        Icon && <Icon size={size === "lg" ? 18 : 16} color={palette.ink} strokeWidth={1.9} />
      )}
      <Text weight="semibold" size={size === "lg" ? 15.5 : 14} color={palette.ink} style={styles.label}>
        {label}
      </Text>
      {!loading && IconRight && <IconRight size={size === "lg" ? 18 : 16} color={palette.ink} strokeWidth={1.9} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 999, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  lg: { height: 54, paddingHorizontal: 22 },
  md: { height: 44, paddingHorizontal: 18 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  label: { fontVariant: ["tabular-nums"] },
});
