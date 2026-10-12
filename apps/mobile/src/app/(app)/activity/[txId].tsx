import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Copy, ExternalLink, Receipt, RotateCw, Share2 } from "lucide-react-native";
import { Pressable, Share, StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ListCard } from "@/components/ListCard";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { signedAmount, TxIcon } from "@/components/TxRow";
import { counterpartyName, txVerb } from "@/data/counterparty";
import { fullDateLabel, isOutgoing } from "@/data/transactions";
import { explorerTxUrl } from "@/stellar/network";
import { useTheme } from "@/theme/ThemeProvider";
import { shortAddress } from "@/wallet/stellar";
import { useChain } from "@/wallet/WalletProvider";

export default function TransactionScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const { txId } = useLocalSearchParams<{ txId: string }>();
  const { history } = useChain();
  const tx = history.find((item) => item.id === txId);

  if (!tx) {
    return (
      <StackScreen title="Transaction">
        <View style={styles.body}>
          <EmptyState icon={Receipt} title="Transaction not found" body="It may still be settling. Check Activity again in a moment." />
        </View>
      </StackScreen>
    );
  }

  const party = tx.counterparty;
  const copy = async (value: string, what: string) => {
    await Clipboard.setStringAsync(value);
    toast(`${what} copied`);
  };

  const rows: { label: string; value: string; copy?: () => void }[] = [
    party.kind === "app"
      ? { label: "Mini app", value: party.name }
      : { label: isOutgoing(tx) ? "To" : "From", value: shortAddress(party.value, 6, 6), copy: () => copy(party.value, "Address") },
    { label: "Date", value: fullDateLabel(tx.date) },
    { label: "Asset", value: tx.asset.issuer ? `${tx.asset.code} · ${shortAddress(tx.asset.issuer)}` : tx.asset.code },
    ...(tx.memo ? [{ label: "Memo", value: tx.memo }] : []),
    ...(tx.fee ? [{ label: "Network fee", value: `${tx.fee.toFixed(7).replace(/0+$/, "")} XLM` }] : []),
    ...(tx.createdAccount ? [{ label: "Note", value: "Created the recipient's account" }] : []),
    { label: "Transaction", value: shortAddress(tx.hash, 8, 6), copy: () => copy(tx.hash, "Transaction hash") },
  ];

  const share = () =>
    Share.share({ message: `MiniGo payment: ${signedAmount(tx)} · ${fullDateLabel(tx.date)}\n${explorerTxUrl(tx.hash)}` }).catch(() => {});

  return (
    <StackScreen
      title="Transaction"
      right={
        <Pressable accessibilityRole="button" accessibilityLabel="Share" onPress={share} hitSlop={8} style={[styles.circle, { borderColor: colors.line }]}>
          <Share2 size={17} color={colors.ink} strokeWidth={1.8} />
        </Pressable>
      }
    >
      <View style={styles.hero}>
        <TxIcon tx={tx} size={56} />
        <Text weight="medium" size={36} tracking={-0.035} style={styles.amount} adjustsFontSizeToFit numberOfLines={1}>
          {signedAmount(tx)}
        </Text>
        <Text size={14} color={colors.muted} style={styles.caption} numberOfLines={1}>
          {txVerb[tx.kind]} · {counterpartyName(party)}
        </Text>
      </View>

      <View style={styles.body}>
        <ListCard>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text size={14} color={colors.muted}>
                {row.label}
              </Text>
              <View style={styles.value}>
                <Text size={14} weight="medium" numberOfLines={2} style={styles.valueText}>
                  {row.value}
                </Text>
                {row.copy && (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Copy ${row.label}`} onPress={row.copy} hitSlop={10}>
                    <Copy size={14} color={colors.muted} strokeWidth={1.8} />
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </ListCard>

        <View style={styles.actions}>
          {tx.kind === "sent" && party.kind === "address" && (
            <Button
              label="Send again"
              icon={RotateCw}
              onPress={() => router.push({ pathname: "/send/amount", params: { to: party.value, asset: tx.asset.issuer ? `${tx.asset.code}:${tx.asset.issuer}` : "XLM" } })}
            />
          )}
          <Button label="View on StellarExpert" icon={ExternalLink} variant="secondary" onPress={() => Linking.openURL(explorerTxUrl(tx.hash))} />
        </View>
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  circle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  hero: { alignItems: "center", paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8, gap: 10 },
  amount: { marginTop: 6, lineHeight: 42, fontVariant: ["tabular-nums"] },
  caption: { marginTop: -4 },
  body: { paddingHorizontal: 20, paddingTop: 12 },
  row: { minHeight: 52, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  value: { flexShrink: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  valueText: { flexShrink: 1, textAlign: "right" },
  actions: { marginTop: 20, gap: 10 },
});
