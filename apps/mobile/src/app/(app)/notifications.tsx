import { useRouter } from "expo-router";
import { AppWindow, ArrowDownLeft, BellOff, type LucideIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { ListCard } from "@/components/ListCard";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { notificationsFrom, type NotificationKind } from "@/data/notifications";
import { useTheme } from "@/theme/ThemeProvider";
import { useChain, useWallet, useWalletData } from "@/wallet/WalletProvider";

const icons: Record<NotificationKind, LucideIcon> = { payment: ArrowDownLeft, miniapp: AppWindow };

function ago(iso: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / (60 * 24))}d`;
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { markNotificationsRead } = useWallet();
  const { readNotifications, settings } = useWalletData();
  const { history } = useChain();
  const all = notificationsFrom(history);
  // Unread as of opening, so the dots stay visible while the list is on screen.
  const [unread] = useState(() => new Set(all.filter((n) => !readNotifications.includes(n.id)).map((n) => n.id)));

  const ids = all.map((n) => n.id).join(",");
  useEffect(() => {
    if (ids) markNotificationsRead(ids.split(","));
    // Mark everything listed as read, on open and as new activity arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  const visible = all.filter(
    (item) => (item.kind === "payment" && settings.notifications.payments) || (item.kind === "miniapp" && settings.notifications.miniApps),
  );

  return (
    <StackScreen title="Notifications">
      <View style={styles.body}>
        {visible.length === 0 ? (
          <EmptyState icon={BellOff} title="You're all caught up" body="Money you receive and mini app payments will show up here." />
        ) : (
          <ListCard>
            {visible.map((item) => {
              const Icon = icons[item.kind];
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/activity/[txId]", params: { txId: item.txId } })}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                >
                  <View style={[styles.icon, { backgroundColor: colors.chip }]}>
                    <Icon size={18} color={colors.ink} strokeWidth={1.8} />
                  </View>
                  <View style={styles.text}>
                    <View style={styles.titleRow}>
                      <Text weight={unread.has(item.id) ? "semibold" : "medium"} style={styles.title} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text size={12} color={colors.muted}>
                        {ago(item.date)}
                      </Text>
                    </View>
                    <Text size={13} color={colors.muted} style={styles.bodyText}>
                      {item.body}
                    </Text>
                  </View>
                  {unread.has(item.id) && <View accessibilityLabel="Unread" style={[styles.dot, { backgroundColor: colors.ink }]} />}
                </Pressable>
              );
            })}
          </ListCard>
        )}
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20 },
  row: { paddingVertical: 14, flexDirection: "row", alignItems: "flex-start", gap: 14 },
  pressed: { opacity: 0.6 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1 },
  bodyText: { marginTop: 3, lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
});
