import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "@/components/Text";

type NoticeProps = { icon: LucideIcon; children: ReactNode; tone?: "neutral" | "warning" | "danger" };

// Inline callout for warnings and explanations.
export function Notice({ icon: Icon, children, tone = "neutral" }: NoticeProps) {
  const { colors } = useTheme();
  const palette = {
    neutral: { bg: colors.soft, border: colors.line, ink: colors.label },
    warning: { bg: colors.warningSoft, border: colors.warningSoft, ink: colors.warning },
    danger: { bg: colors.dangerSoft, border: colors.dangerSoft, ink: colors.danger },
  }[tone];
  return (
    <View style={[styles.box, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Icon size={17} color={palette.ink} strokeWidth={1.8} style={styles.icon} />
      <Text size={13} color={palette.ink} style={styles.text}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", gap: 10, borderRadius: 16, borderWidth: 1, padding: 14 },
  icon: { marginTop: 1 },
  text: { flex: 1, lineHeight: 19 },
});
