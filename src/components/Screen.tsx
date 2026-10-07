import { useNavigation } from "expo-router";
import { useEffect, useRef, type ReactNode } from "react";
import { ScrollView, StyleSheet, View, type ScrollViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "@/components/Text";
import { TAB_BAR_SPACE } from "@/components/PillTabBar";

// Tab screens stay mounted, so scroll back to the top when one loses focus and it comes back looking new.
export function Screen({ children, ...props }: ScrollViewProps & { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const scroller = useRef<ScrollView>(null);
  useEffect(() => navigation.addListener("blur", () => scroller.current?.scrollTo({ y: 0, animated: false })), [navigation]);
  return (
    <ScrollView
      ref={scroller}
      {...props}
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + TAB_BAR_SPACE }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function PageTitle({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <View style={styles.pageTitle}>
      <Text weight="semibold" size={28} tracking={-0.03} accessibilityRole="header">
        {title}
      </Text>
      {aside}
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text weight="semibold" size={15} tracking={-0.01} accessibilityRole="header">
        {title}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
});
