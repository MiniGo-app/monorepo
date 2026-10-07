import * as Clipboard from "expo-clipboard";
import { Link, useRouter } from "expo-router";
import { ArrowUp, Bell, Copy, Eye, EyeOff, Plus } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { AppIcon } from "@/components/AppIcon";
import { AssetIcon } from "@/components/AssetIcon";
import { CardRings } from "@/components/CardRings";
import { Screen, SectionHeader } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { TxRow } from "@/components/TxRow";
import { Button } from "@/components/Button";
import { getMiniApps, recentAppIds } from "@/data/miniApps";
import { useLaunchMiniApp } from "@/mini/OpenApps";
import { notificationsFrom } from "@/data/notifications";
import { initials } from "@/data/profile";
import { formatAmount, usdValue, walletAssets } from "@/stellar/assets";
import { isTestnet } from "@/stellar/network";
import { useXlmPrice } from "@/stellar/price";
import { useTheme } from "@/theme/ThemeProvider";
import { shortAddress } from "@/wallet/stellar";
import { errorMessage, useWallet, useWalletData } from "@/wallet/WalletProvider";

export default function HomeScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const { openCatalog } = useLaunchMiniApp();
  const { chain, refresh, fundTestnet } = useWallet();
  const { address, profile, readNotifications } = useWalletData();
  const [hidden, setHidden] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [funding, setFunding] = useState(false);
  const price = useXlmPrice();
  const shortcuts = getMiniApps(recentAppIds);
  const assets = walletAssets(chain.account);
  const unfunded = chain.account?.exists === false;
  const total = assets.reduce((sum, asset) => sum + (usdValue(asset, price) ?? 0), 0);
  const [dollars, cents] = total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split(".");
  const unread = notificationsFrom(chain.history).some((item) => !readNotifications.includes(item.id));
  const loading = chain.status === "loading";
  // Until the XLM price arrives, a dollar total would leave the XLM out.
  const totalPending = loading || (price === null && assets.some((asset) => asset.isNative && asset.balance > 0));

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh(true);
    setRefreshing(false);
  };

  const fund = async () => {
    setFunding(true);
    try {
      await fundTestnet();
      toast("Added 10,000 test XLM");
    } catch (error) {
      toast(errorMessage(error));
    } finally {
      setFunding(false);
    }
  };

  const copyAddress = async () => {
    await Clipboard.setStringAsync(address);
    toast("Wallet address copied");
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.cardGutter}>
        <View style={[styles.hero, { backgroundColor: colors.hero, borderColor: colors.heroBorder }]}>
          <CardRings color="#FFFFFF" />

          <View style={styles.heroTop}>
            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Profile"
                onPress={() => router.navigate("/profile")}
                style={[styles.avatar, { backgroundColor: colors.navActive }]}
              >
                <Text weight="semibold" size={13} color={colors.navActiveInk}>
                  {initials(profile.name)}
                </Text>
              </Pressable>
              <View style={styles.divider} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={unread ? "Notifications, unread" : "Notifications"}
                onPress={() => router.push("/notifications")}
                style={styles.bell}
              >
                <Bell size={17} color="#FFFFFF" strokeWidth={1.8} />
                {unread && <View style={[styles.bellDot, { borderColor: colors.hero }]} />}
              </Pressable>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Copy wallet address" onPress={copyAddress} style={styles.addressChip}>
              <Text weight="medium" size={13} color="#FFFFFF" style={styles.tabular}>
                {shortAddress(address)}
              </Text>
              <Copy size={14} color="#FFFFFF" strokeWidth={1.8} />
            </Pressable>
          </View>

          <View style={styles.balance}>
            {isTestnet && (
              <View style={styles.testnet}>
                <Text weight="semibold" size={11} color="rgba(255,255,255,0.85)" tracking={0.06}>
                  TESTNET
                </Text>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: hidden }}
              accessibilityLabel={hidden ? "Show balance" : "Hide balance"}
              onPress={() => setHidden((value) => !value)}
              style={styles.row}
            >
              <Text size={13.5} color="rgba(255,255,255,0.8)">
                Total balance
              </Text>
              {hidden ? (
                <EyeOff size={16} color="rgba(255,255,255,0.8)" strokeWidth={1.8} />
              ) : (
                <Eye size={16} color="rgba(255,255,255,0.8)" strokeWidth={1.8} />
              )}
            </Pressable>
            <Text weight="medium" size={42} tracking={-0.035} color="#FFFFFF" style={styles.amount} adjustsFontSizeToFit numberOfLines={1}>
              {hidden ? "••••••" : totalPending ? "..." : `$${dollars}`}
              {!hidden && !totalPending && (
                <Text weight="medium" size={42} tracking={-0.035} color="rgba(255,255,255,0.45)">
                  .{cents}
                </Text>
              )}
            </Text>
          </View>

          <View style={styles.heroLine} />

          <View style={styles.heroActions}>
            <Pressable accessibilityRole="button" onPress={() => router.push("/receive")} style={styles.heroButton} accessibilityLabel="Deposit">
              <Plus size={16} color="#FFFFFF" strokeWidth={2} />
              <Text weight="medium" size={14.5} color="#FFFFFF">
                Deposit
              </Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.navigate("/send")} style={styles.heroButton}>
              <Text weight="medium" size={14.5} color="#FFFFFF">
                Transfer
              </Text>
              <ArrowUp size={16} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </View>

      {unfunded && (
        <View style={styles.cardGutter}>
          <View style={[styles.fund, { backgroundColor: colors.panel, borderColor: colors.panelBorder }]}>
            <Text weight="semibold">Your wallet is ready</Text>
            <Text size={13.5} color={colors.muted} style={styles.fundBody}>
              New Stellar accounts start empty. {isTestnet ? "Get free test XLM to start sending and using mini apps." : "Deposit at least 1 XLM to activate it."}
            </Text>
            {isTestnet && <Button label="Get 10,000 test XLM" size="md" onPress={fund} loading={funding} style={styles.fundButton} />}
          </View>
        </View>
      )}
      {chain.status === "error" && (
        <Text size={13} color={colors.danger} style={styles.offline}>
          {chain.error}
        </Text>
      )}

      <View style={styles.section}>
        <SectionHeader
          title="Mini apps"
          action={
            <Link href="/apps" accessibilityRole="link">
              <Text weight="semibold" size={12.5}>
                See all
              </Text>
            </Link>
          }
        />
        <View style={styles.shortcuts}>
          {shortcuts.map((app) => (
            <Pressable
              key={app.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${app.name}`}
              onPress={() => openCatalog(app.id)}
              style={styles.shortcut}
            >
              <AppIcon app={app} size={60} />
              <Text size={12.5} color={colors.label} numberOfLines={1}>
                {app.shortName}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.rule, { backgroundColor: colors.hair }]} />

      <View style={[styles.section, styles.tight]}>
        <SectionHeader
          title="Assets"
          action={
            <Link href="/assets/manage" accessibilityRole="link">
              <Text weight="semibold" size={12.5}>
                Manage
              </Text>
            </Link>
          }
        />
        <View style={styles.list}>
          {loading && <ActivityIndicator color={colors.muted} style={styles.loader} />}
          {!loading && assets.map((asset) => (
            <Pressable
              key={asset.key}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/assets/[assetId]", params: { assetId: asset.key } })}
              style={({ pressed }) => [styles.assetRow, pressed && styles.pressed]}
            >
              <AssetIcon code={asset.code} issuer={asset.issuer} isNative={asset.isNative} />
              <View style={styles.flex}>
                <Text weight="medium">{asset.name}</Text>
                <Text size={12.5} color={colors.muted} style={styles.sub}>
                  {asset.detail}
                </Text>
              </View>
              <Text weight="medium" style={styles.tabular}>
                {hidden ? "••••" : formatAmount(asset.code, asset.balance)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.rule, { backgroundColor: colors.hair }]} />

      <View style={[styles.section, styles.tight]}>
        <SectionHeader
          title="Recent activity"
          action={
            <Link href="/activity" accessibilityRole="link">
              <Text weight="semibold" size={12.5}>
                See all
              </Text>
            </Link>
          }
        />
        <View style={styles.list}>
          {!loading && chain.history.length === 0 && (
            <Text size={13.5} color={colors.muted} style={styles.empty}>
              No payments yet. Money you send and receive shows up here.
            </Text>
          )}
          {chain.history.slice(0, 3).map((tx) => (
            <TxRow
              key={tx.id}
              tx={tx}
              hidden={hidden}
              onPress={() => router.push({ pathname: "/activity/[txId]", params: { txId: tx.id } })}
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  pressed: { opacity: 0.6 },
  cardGutter: { paddingHorizontal: 16 },
  hero: { borderRadius: 28, borderWidth: 1, padding: 20, overflow: "hidden" },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  divider: { width: 1, height: 22, backgroundColor: "rgba(255,255,255,0.3)" },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  bellDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
  },
  addressChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  balance: { marginTop: 44, alignItems: "center" },
  amount: { marginTop: 10, lineHeight: 46, fontVariant: ["tabular-nums"] },
  heroLine: { marginTop: 32, height: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  heroActions: { marginTop: 18, flexDirection: "row", gap: 10 },
  heroButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  section: { marginTop: 24, paddingHorizontal: 20 },
  tight: { marginTop: 16 },
  shortcuts: { marginTop: 14, flexDirection: "row", justifyContent: "space-between" },
  shortcut: { width: "24%", alignItems: "center", gap: 8 },
  rule: { marginTop: 22, height: 1 },
  list: { marginTop: 4 },
  assetRow: { height: 64, flexDirection: "row", alignItems: "center", gap: 14 },
  sub: { marginTop: 1 },
  tabular: { fontVariant: ["tabular-nums"] },
  testnet: { marginBottom: 10, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: "rgba(255,255,255,0.12)" },
  fund: { marginTop: 12, borderRadius: 24, borderWidth: 1, padding: 18 },
  fundBody: { marginTop: 4, lineHeight: 19 },
  fundButton: { marginTop: 14, alignSelf: "flex-start" },
  offline: { marginTop: 12, paddingHorizontal: 20 },
  loader: { marginVertical: 20 },
  empty: { paddingVertical: 12, lineHeight: 19 },
});
