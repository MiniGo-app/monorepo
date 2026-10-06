import { Children, Fragment, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

// Outlined card that separates its rows with hairlines.
export function ListCard({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const rows = Children.toArray(children);
  return (
    <View style={[styles.card, { backgroundColor: colors.list, borderColor: colors.line }]}>
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 && <View style={[styles.divider, { backgroundColor: colors.line }]} />}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14 },
  divider: { height: StyleSheet.hairlineWidth },
});
