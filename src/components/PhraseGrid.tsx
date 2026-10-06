import { Eye } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "./Text";

// The recovery phrase in numbered cells, covered until the user chooses to reveal it.
export function PhraseGrid({ phrase, revealed, onReveal }: { phrase: string; revealed: boolean; onReveal: () => void }) {
  const { colors } = useTheme();
  const words = phrase.split(" ");
  return (
    <View style={[styles.card, { backgroundColor: colors.soft, borderColor: colors.line }]}>
      <View style={styles.grid} accessibilityElementsHidden={!revealed} importantForAccessibility={revealed ? "auto" : "no-hide-descendants"}>
        {words.map((word, index) => (
          <View key={index} style={[styles.cell, { backgroundColor: colors.bg, borderColor: colors.line }]}>
            <Text size={12} color={colors.muted} style={styles.index}>
              {index + 1}
            </Text>
            <Text weight="medium" size={15}>
              {revealed ? word : "•••••"}
            </Text>
          </View>
        ))}
      </View>
      {!revealed && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reveal recovery phrase"
          onPress={onReveal}
          style={[styles.cover, { backgroundColor: colors.soft }]}
        >
          <View style={[styles.revealIcon, { backgroundColor: colors.primary }]}>
            <Eye size={20} color={colors.onPrimary} strokeWidth={1.8} />
          </View>
          <Text weight="semibold">Tap to reveal</Text>
          <Text size={13} color={colors.muted}>
            Make sure no one can see your screen
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, padding: 12, overflow: "hidden" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: { width: "48.5%", height: 48, borderRadius: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 10 },
  index: { width: 18, fontVariant: ["tabular-nums"] },
  cover: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", gap: 6 },
  revealIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 6 },
});
