import { useRouter } from "expo-router";
import { Receipt } from "lucide-react-native";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Chips } from "@/components/Chips";
import { EmptyState } from "@/components/EmptyState";
import { ListCard } from "@/components/ListCard";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { TxRow } from "@/components/TxRow";
import { dayLabel, type Transaction } from "@/data/transactions";
import { useTheme } from "@/theme/ThemeProvider";
import { useChain } from "@/wallet/WalletProvider";

const filters = ["All", "Sent", "Received", "Mini apps"] as const;
type Filter = (typeof filters)[number];
const matches: Record<Filter, (tx: Transaction) => boolean> = {
  All: () => true,
  Sent: (tx) => tx.kind === "sent",
  Received: (tx) => tx.kind === "received",
  "Mini apps": (tx) => tx.kind === "miniapp",
};

export default function ActivityScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { history: transactions } = useChain();
  const [filter, setFilter] = useState<Filter>("All");

  const groups = useMemo(() => {
    const byDay: { label: string; items: Transaction[] }[] = [];
    for (const tx of transactions.filter(matches[filter])) {
      const label = dayLabel(tx.date);
      const last = byDay[byDay.length - 1];
      if (last?.label === label) last.items.push(tx);
      else byDay.push({ label, items: [tx] });
    }
    return byDay;
  }, [transactions, filter]);

  return (
    <StackScreen title="Activity">
      <Chips label="Filter activity" options={filters} value={filter} onChange={setFilter} />
      <View style={styles.body}>
        {groups.length === 0 ? (
          <EmptyState icon={Receipt} title="Nothing here yet" body="Payments you send, receive or make in mini apps show up here." />
        ) : (
          groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text weight="medium" size={12.5} color={colors.muted} accessibilityRole="header">
                {group.label}
              </Text>
              <ListCard>
                {group.items.map((tx) => (
                  <TxRow key={tx.id} tx={tx} onPress={() => router.push({ pathname: "/activity/[txId]", params: { txId: tx.id } })} />
                ))}
              </ListCard>
            </View>
          ))
        )}
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 4 },
  group: { marginTop: 20 },
});
