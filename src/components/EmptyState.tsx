import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "@/components/Text";

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: colors.list, borderColor: colors.line }]}>
      <Icon size={28} color={colors.muted} strokeWidth={1.6} />
      <Text weight="semibold" size={14} style={styles.title}>
        {title}
      </Text>
      <Text size={12.5} color={colors.muted} style={styles.body}>
        {body}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 24, paddingVertical: 36, alignItems: "center", gap: 4 },
  title: { marginTop: 10 },
  body: { textAlign: "center", lineHeight: 18, marginBottom: 8 },
});
