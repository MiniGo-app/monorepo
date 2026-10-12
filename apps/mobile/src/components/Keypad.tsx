import { Delete } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "@/components/Text";

type KeypadProps = {
  onKey: (key: string) => void;
  onDelete: () => void;
  // Bottom-left key: "." for amounts, a biometrics button for PINs or nothing.
  extra?: { label: string; content: ReactNode; onPress: () => void } | null;
  disabled?: boolean;
};

const rows = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

export function Keypad({ onKey, onDelete, extra, disabled }: KeypadProps) {
  const { colors } = useTheme();
  const key = (label: string, content: ReactNode, onPress: () => void) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.key, pressed && { backgroundColor: colors.soft }]}
    >
      {content}
    </Pressable>
  );
  const digit = (value: string) =>
    key(value, <Text weight="medium" size={26} tracking={-0.02}>{value}</Text>, () => onKey(value));

  return (
    <View style={[styles.pad, disabled && styles.disabled]}>
      {rows.map((row) => (
        <View key={row[0]} style={styles.row}>
          {row.map(digit)}
        </View>
      ))}
      <View style={styles.row}>
        {extra ? key(extra.label, extra.content, extra.onPress) : <View style={styles.key} />}
        {digit("0")}
        {key("Delete", <Delete size={24} color={colors.ink} strokeWidth={1.8} />, onDelete)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { gap: 6, alignSelf: "center", width: "100%", maxWidth: 340 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  key: { width: "31%", height: 62, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.4 },
});
