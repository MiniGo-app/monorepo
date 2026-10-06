import { ChevronRight, type LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "@/components/Text";

type RowProps = {
  icon?: LucideIcon;
  label: string;
  detail?: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  danger?: boolean;
  toggle?: { value: boolean; onChange: (value: boolean) => void; disabled?: boolean };
  accessory?: ReactNode;
};

// One line in an outlined settings list.
export function Row({ icon: Icon, label, detail, value, onPress, chevron, danger, toggle, accessory }: RowProps) {
  const { colors } = useTheme();
  const ink = danger ? colors.danger : colors.ink;
  const showChevron = chevron ?? (!!onPress && !toggle);

  const content = (
    <>
      {Icon && (
        <View style={[styles.icon, { backgroundColor: danger ? colors.dangerSoft : colors.chip }]}>
          <Icon size={16} color={ink} strokeWidth={1.8} />
        </View>
      )}
      <View style={styles.text}>
        <Text color={ink}>{label}</Text>
        {detail && (
          <Text size={12.5} color={colors.muted} style={styles.detail}>
            {detail}
          </Text>
        )}
      </View>
      {value && (
        <Text size={13.5} color={colors.muted} numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      )}
      {accessory}
      {toggle && (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          disabled={toggle.disabled}
          accessibilityLabel={label}
          trackColor={{ false: colors.line, true: colors.ink }}
          thumbColor={colors.bg}
          ios_backgroundColor={colors.line}
        />
      )}
      {showChevron && <ChevronRight size={17} color={colors.muted} strokeWidth={2} />}
    </>
  );

  if (!onPress) return <View style={[styles.row, detail && styles.tall]}>{content}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, detail && styles.tall, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 54, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 12 },
  tall: { minHeight: 64 },
  pressed: { opacity: 0.6 },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0 },
  detail: { marginTop: 2 },
  value: { maxWidth: "45%" },
});
