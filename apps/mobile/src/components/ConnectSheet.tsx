import { Check, Link2 } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { initials } from "@/data/profile";
import type { HostedApp } from "@/mini/types";
import { useTheme } from "@/theme/ThemeProvider";
import { shortAddress } from "@/wallet/stellar";
import { useWalletData } from "@/wallet/WalletProvider";
import { Button } from "./Button";
import { HostedAppIcon } from "./HostedAppIcon";
import { ListCard } from "./ListCard";
import { Sheet } from "./Sheet";
import { Text } from "./Text";

const permissions = ["See your wallet address", "Ask for payments and signatures. You approve each one."];

type ConnectSheetProps = { app: HostedApp; visible: boolean; onCancel: () => void; onConnect: () => void };

export function ConnectSheet({ app, visible, onCancel, onConnect }: ConnectSheetProps) {
  const { colors } = useTheme();
  const { profile, address } = useWalletData();

  return (
    <Sheet visible={visible} onClose={onCancel}>
      <View style={styles.parties}>
        <HostedAppIcon app={app} size={52} radius={16} glyphSize={24} />
        <Link2 size={18} color={colors.muted} strokeWidth={1.8} />
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text weight="semibold" size={16} color={colors.onPrimary}>
            {initials(profile.name)}
          </Text>
        </View>
      </View>

      <Text weight="semibold" size={19} tracking={-0.02} accessibilityRole="header" style={styles.title}>
        {app.name} wants to connect{"\n"}to your MiniGo wallet
      </Text>
      <Text size={13} color={colors.muted} style={styles.center}>
        {app.origin ?? `${profile.name} · ${shortAddress(address)}`}
      </Text>

      <View style={styles.permissions}>
        <ListCard>
          {permissions.map((item) => (
            <View key={item} style={styles.permission}>
              <Check size={18} color={colors.ink} strokeWidth={2} />
              <Text size={14} style={styles.flex}>
                {item}
              </Text>
            </View>
          ))}
        </ListCard>
      </View>

      <View style={styles.actions}>
        <Button label="Not now" variant="secondary" style={styles.flex} onPress={onCancel} />
        <Button label="Connect" style={styles.flex} onPress={onConnect} />
      </View>
      <Text size={12} color={colors.muted} style={[styles.center, styles.footnote]}>
        You can disconnect any time in Profile → Connected apps.
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  parties: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  title: { marginTop: 16, marginBottom: 6, textAlign: "center", lineHeight: 25 },
  permissions: { marginTop: 8 },
  permission: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12 },
  actions: { marginTop: 18, flexDirection: "row", gap: 10 },
  footnote: { marginTop: 12 },
});
