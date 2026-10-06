import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { counterpartyName, txVerb } from "@/data/counterparty";
import { getMiniApp } from "@/data/miniApps";
import { isOutgoing, timeLabel, type Transaction } from "@/data/transactions";
import { formatAmount } from "@/stellar/assets";
import { useTheme } from "@/theme/ThemeProvider";
import { AppIcon } from "./AppIcon";
import { Text } from "./Text";

export function TxIcon({ tx, size = 44 }: { tx: Transaction; size?: number }) {
  const { colors } = useTheme();
  const app = tx.counterparty.kind === "app" ? getMiniApp(tx.counterparty.value) : undefined;
  if (app) return <AppIcon app={app} size={size} glyphSize={size * 0.43} />;
  const Icon = isOutgoing(tx) ? ArrowUpRight : ArrowDownLeft;
  return (
    <View style={[styles.icon, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.chip }]}>
      <Icon size={size * 0.43} color={colors.ink} strokeWidth={1.8} />
    </View>
  );
}

export const signedAmount = (tx: Transaction) => `${isOutgoing(tx) ? "−" : "+"}${formatAmount(tx.asset.code, tx.amount)}`;

export function TxRow({ tx, onPress, hidden }: { tx: Transaction; onPress: () => void; hidden?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <TxIcon tx={tx} />
      <View style={styles.text}>
        <Text weight="medium" numberOfLines={1}>
          {counterpartyName(tx.counterparty)}
        </Text>
        <Text size={12.5} color={colors.muted} numberOfLines={1} style={styles.sub}>
          {txVerb[tx.kind]} · {timeLabel(tx.date)}
        </Text>
      </View>
      <Text weight="medium" color={tx.kind === "received" ? colors.success : colors.ink} numberOfLines={1} style={styles.amount}>
        {hidden ? "••••" : signedAmount(tx)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 64, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 14 },
  pressed: { opacity: 0.6 },
  icon: { alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0 },
  sub: { marginTop: 2 },
  amount: { fontVariant: ["tabular-nums"], maxWidth: "45%" },
});
