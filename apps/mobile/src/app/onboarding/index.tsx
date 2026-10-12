import { useRouter } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/AppIcon";
import { Button } from "@/components/Button";
import { LogoTile } from "@/components/Logo";
import { CardRings } from "@/components/CardRings";
import { Text } from "@/components/Text";
import { getMiniApps, recentAppIds } from "@/data/miniApps";
import { useTheme } from "@/theme/ThemeProvider";
import { useOnboarding } from "@/wallet/onboarding";

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { startNew } = useOnboarding();
  const [creating, setCreating] = useState(false);

  const create = async () => {
    setCreating(true);
    try {
      await startNew();
      router.push("/onboarding/backup");
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.brand}>
        <LogoTile size={36} />
        <Text weight="semibold" size={17} tracking={-0.02}>
          MiniGo
        </Text>
      </View>

      <View style={[styles.hero, { backgroundColor: colors.hero, borderColor: colors.heroBorder }]}>
        <CardRings color="#FFFFFF" />
        <Text size={13.5} color="rgba(255,255,255,0.7)">
          Total balance
        </Text>
        <Text weight="medium" size={40} tracking={-0.035} color="#FFFFFF" style={styles.amount}>
          $0<Text weight="medium" size={40} tracking={-0.035} color="rgba(255,255,255,0.45)">.00</Text>
        </Text>
        <View style={styles.heroLine} />
        <View style={styles.apps}>
          {getMiniApps(recentAppIds).map((app) => (
            <AppIcon key={app.id} app={app} size={48} bordered={false} />
          ))}
        </View>
      </View>

      <View style={styles.copy}>
        <Text weight="semibold" size={30} tracking={-0.035} style={styles.headline} accessibilityRole="header">
          Money and mini apps, in one wallet.
        </Text>
        <Text size={15} color={colors.muted} style={styles.body}>
          Hold XLM and USDC, send to any Stellar address and pay inside the apps you use every day.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="Create a wallet" iconRight={ArrowRight} onPress={create} loading={creating} />
        <Button label="I already have a wallet" variant="secondary" onPress={() => router.push("/onboarding/restore")} />
        <Text size={12} color={colors.muted} style={styles.terms}>
          By continuing you agree to the MiniGo Terms and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  hero: { marginTop: 28, borderRadius: 28, borderWidth: 1, padding: 22, overflow: "hidden" },
  amount: { marginTop: 8, lineHeight: 46 },
  heroLine: { marginTop: 24, height: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  apps: { marginTop: 18, flexDirection: "row", gap: 10 },
  copy: { flex: 1, justifyContent: "center", paddingVertical: 24 },
  headline: { lineHeight: 36 },
  body: { marginTop: 12, lineHeight: 22 },
  actions: { gap: 10 },
  terms: { marginTop: 4, textAlign: "center" },
});
