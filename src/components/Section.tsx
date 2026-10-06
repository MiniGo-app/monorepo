import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { ListCard } from "@/components/ListCard";
import { Text } from "@/components/Text";

// A titled group of rows in an outlined card, as on the Profile screen.
export function Section({ title, children, footer }: { title?: string; children: ReactNode; footer?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      {title && (
        <Text weight="medium" size={12.5} color={colors.muted} accessibilityRole="header">
          {title}
        </Text>
      )}
      <ListCard>{children}</ListCard>
      {footer && (
        <Text size={12.5} color={colors.muted} style={styles.footer}>
          {footer}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24, paddingHorizontal: 20 },
  footer: { marginTop: 8, paddingHorizontal: 4, lineHeight: 18 },
});
