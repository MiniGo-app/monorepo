import { AppWindow, Globe } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { AppIcon } from "@/components/AppIcon";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Section } from "@/components/Section";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { getMiniApp } from "@/data/miniApps";
import { dayLabel } from "@/data/transactions";
import { useTheme } from "@/theme/ThemeProvider";
import { useWallet, useWalletData } from "@/wallet/WalletProvider";

export default function ConnectedAppsScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const { disconnectApp } = useWallet();
  const { connectedApps } = useWalletData();

  return (
    <StackScreen title="Connected apps">
      {connectedApps.length === 0 ? (
        <View style={styles.body}>
          <EmptyState icon={AppWindow} title="No connected apps" body="When a mini app asks to use your wallet and you approve, it shows up here." />
        </View>
      ) : (
        <Section footer="Connected apps can see your wallet address and ask for payments. You approve every payment with your PIN.">
          {connectedApps.map((item) => {
            const app = getMiniApp(item.id);
            return (
              <View key={item.id} style={styles.row}>
                {app ? (
                  <AppIcon app={app} size={40} glyphSize={18} />
                ) : (
                  <View style={[styles.globe, { backgroundColor: colors.chip }]}>
                    <Globe size={18} color={colors.ink} strokeWidth={1.8} />
                  </View>
                )}
                <View style={styles.text}>
                  <Text weight="medium" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text size={12.5} color={colors.muted} numberOfLines={1} style={styles.sub}>
                    {item.origin ? `${item.origin} · ` : ""}connected {dayLabel(item.connectedAt).toLowerCase()}
                  </Text>
                </View>
                <Button
                  label="Disconnect"
                  size="md"
                  variant="secondary"
                  onPress={() => {
                    disconnectApp(item.id);
                    toast(`${item.name} disconnected`);
                  }}
                />
              </View>
            );
          })}
        </Section>
      )}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20 },
  row: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12 },
  globe: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, minWidth: 0 },
  sub: { marginTop: 1 },
});
