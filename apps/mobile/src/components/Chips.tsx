import { Pressable, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "@/components/Text";

type ChipsProps<T extends string> = { options: readonly T[]; value: T; onChange: (value: T) => void; label: string };

export function Chips<T extends string>({ options, value, onChange, label }: ChipsProps<T>) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={label}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option)}
            style={[
              styles.chip,
              active ? { backgroundColor: colors.chipActive, borderColor: colors.chipActive } : { borderColor: colors.line },
            ]}
          >
            <Text weight={active ? "semibold" : "medium"} size={13} color={active ? colors.chipActiveInk : colors.label}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 20, gap: 8 },
  chip: { height: 32, borderRadius: 999, borderWidth: 1, paddingHorizontal: 16, justifyContent: "center" },
});
