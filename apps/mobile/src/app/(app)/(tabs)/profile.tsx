import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import {
  AppWindow,
  Bell,
  CircleHelp,
  CloudCheck,
  CloudAlert,
  Code,
  Coins,
  Copy,
  Globe,
  Info,
  Lock,
  LogOut,
  Moon,
  QrCode,
  Sun,
  SunMoon,
  UserRound,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";
import { PinSheet } from "@/components/PinSheet";
import { PageTitle, Screen } from "@/components/Screen";
import { Row } from "@/components/Row";
import { Section } from "@/components/Section";
import { Sheet } from "@/components/Sheet";
import { Text } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { initials } from "@/data/profile";
import { explorerAccountUrl, isTestnet } from "@/stellar/network";
import { useTheme } from "@/theme/ThemeProvider";
import { cloudProvider } from "@/wallet/cloud";
import { shortAddress } from "@/wallet/stellar";
import { useWallet, useWalletData } from "@/wallet/WalletProvider";

const themeLabel = { system: "System", light: "Light", dark: "Dark" } as const;

export default function ProfileScreen() {
  const { colors, preference, mode } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const { signOut } = useWallet();
  const { address, profile, backup, connectedApps } = useWalletData();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const copyAddress = async () => {
    await Clipboard.setStringAsync(address);
    toast("Wallet address copied");
  };

  const backupValue = !backup ? "Not backed up" : backup.method === "manual" ? "Written down" : cloudProvider.name;

  return (
    <Screen>
      <PageTitle title="Profile" />

      <View style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text weight="semibold" size={18} color={colors.onPrimary}>
            {initials(profile.name)}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text weight="semibold" size={18} tracking={-0.02} numberOfLines={1}>
            {profile.name}
          </Text>
          <Text size={13.5} color={colors.muted} numberOfLines={1} style={styles.email}>
            {profile.email}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Copy wallet address" onPress={copyAddress} style={styles.address}>
            <Text size={13} color={colors.muted} style={styles.tabular}>
              {shortAddress(address, 6, 6)}
            </Text>
            <Copy size={13} color={colors.muted} strokeWidth={1.8} />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="My QR code"
          onPress={() => router.push("/receive")}
          style={[styles.circleButton, { borderColor: colors.line }]}
        >
          <QrCode size={17} color={colors.ink} strokeWidth={1.8} />
        </Pressable>
      </View>

      {!backup && (
        <View style={styles.notice}>
          <Pressable accessibilityRole="button" onPress={() => router.push("/settings/backup")}>
            <Notice icon={CloudAlert} tone="warning">
              Your wallet isn&apos;t backed up. Back it up now so you can restore it on a new phone.
            </Notice>
          </Pressable>
        </View>
      )}

      <Section title="Wallet">
        <Row icon={backup ? CloudCheck : CloudAlert} label="Recovery & backup" value={backupValue} onPress={() => router.push("/settings/backup")} />
        <Row icon={Coins} label="Manage assets" onPress={() => router.push("/assets/manage")} />
        <Row icon={Globe} label="Network" value={isTestnet ? "Stellar testnet" : "Stellar"} onPress={() => Linking.openURL(explorerAccountUrl(address))} />
        <Row
          icon={AppWindow}
          label="Connected apps"
          value={connectedApps.length ? String(connectedApps.length) : "None"}
          onPress={() => router.push("/settings/connected-apps")}
        />
      </Section>

      <Section title="Account">
        <Row icon={UserRound} label="Edit profile" onPress={() => router.push("/settings/profile")} />
        <Row icon={Lock} label="Security & PIN" onPress={() => router.push("/settings/security")} />
        <Row icon={Bell} label="Notifications" onPress={() => router.push("/settings/notifications")} />
      </Section>

      <Section title="App">
        <Row
          icon={preference === "system" ? SunMoon : mode === "dark" ? Moon : Sun}
          label="Appearance"
          value={themeLabel[preference]}
          onPress={() => router.push("/settings/appearance")}
        />
        <Row icon={CircleHelp} label="Help & support" onPress={() => router.push("/settings/help")} />
        <Row icon={Info} label="About MiniGo" value={Constants.expoConfig?.version ?? "1.0.0"} onPress={() => router.push("/settings/about")} />
        {__DEV__ && <Row icon={Code} label="Developer" detail="Open a mini app from a URL" onPress={() => router.push("/settings/developer")} />}
      </Section>

      <Section>
        <Row icon={LogOut} label="Log out" danger chevron={false} onPress={() => setLogoutOpen(true)} />
      </Section>

      <Sheet visible={logoutOpen} onClose={() => setLogoutOpen(false)}>
        <View style={styles.sheet}>
          <Text weight="semibold" size={19} tracking={-0.02} style={styles.center}>
            Log out of MiniGo?
          </Text>
          <Text size={14} color={colors.muted} style={[styles.center, styles.sheetBody]}>
            This removes the wallet from this phone. You&apos;ll need your{" "}
            {backup?.method === "manual" ? "recovery phrase" : `Google account (for your ${cloudProvider.name} backup)`} to sign back in.
          </Text>
          {!backup && (
            <View style={styles.sheetNotice}>
              <Notice icon={CloudAlert} tone="danger">
                You haven&apos;t backed up. Logging out now means losing access to this wallet.
              </Notice>
            </View>
          )}
          <View style={styles.sheetActions}>
            <Button
              label="Log out"
              variant="danger"
              onPress={() => {
                setLogoutOpen(false);
                setPinOpen(true);
              }}
            />
            <Button label="Cancel" variant="secondary" onPress={() => setLogoutOpen(false)} />
          </View>
        </View>
      </Sheet>

      <PinSheet
        visible={pinOpen}
        title="Confirm with your PIN"
        subtitle="to remove this wallet from the phone"
        onClose={() => setPinOpen(false)}
        onVerified={() => {
          setPinOpen(false);
          signOut();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  tabular: { fontVariant: ["tabular-nums"] },
  identity: { marginTop: 20, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  email: { marginTop: 2 },
  address: { marginTop: 2, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  circleButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  notice: { marginTop: 20, paddingHorizontal: 20 },
  sheet: { paddingTop: 12 },
  center: { textAlign: "center" },
  sheetBody: { marginTop: 10, lineHeight: 21 },
  sheetNotice: { marginTop: 16 },
  sheetActions: { marginTop: 24, gap: 10 },
});
