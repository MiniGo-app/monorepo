import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";

type SheetProps = { visible: boolean; onClose: () => void; children: ReactNode; tall?: boolean };

// Bottom sheet over a dimmed backdrop; tapping the backdrop or the system back closes it.
export function Sheet({ visible, onClose, children, tall }: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            tall && styles.tall,
            { backgroundColor: colors.bg, borderColor: colors.line, paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.line }]} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  sheet: {
    width: "100%",
    maxWidth: 480,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  tall: { height: "88%" },
  grabber: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, marginBottom: 8 },
});
