import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "@/components/Text";

type StackScreenProps = {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  // Pinned under the content, e.g. the screen's main button.
  footer?: ReactNode;
  scroll?: boolean;
  back?: boolean;
  onBack?: () => void;
};

export function StackScreen({ title, right, children, footer, scroll = true, back = true, onBack }: StackScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/")));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.flex, { backgroundColor: colors.bg, paddingTop: insets.top + 8 }]}
    >
      <View style={styles.header}>
        <View style={styles.side}>
          {back && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={goBack}
              hitSlop={8}
              style={[styles.circle, { borderColor: colors.line }]}
            >
              <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
            </Pressable>
          )}
        </View>
        {title ? (
          <Text weight="semibold" size={16} tracking={-0.01} numberOfLines={1} accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
        ) : (
          <View style={styles.flex} />
        )}
        <View style={[styles.side, styles.right]}>{right}</View>
      </View>

      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, !footer && { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, !footer && { paddingBottom: insets.bottom }]}>{children}</View>
      )}

      {footer && <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View>}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { height: 48, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8 },
  side: { width: 88, flexDirection: "row" },
  right: { justifyContent: "flex-end" },
  title: { flex: 1, textAlign: "center" },
  circle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingTop: 12, paddingBottom: 24 },
  footer: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
});
