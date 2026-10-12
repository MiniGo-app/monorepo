import Constants from "expo-constants";
import { AppWindow, CloudUpload, FlaskConical, KeyRound, Send, Wallet, type LucideIcon } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { Logo } from "@/components/Logo";
import { Row } from "@/components/Row";
import { Section } from "@/components/Section";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { isTestnet } from "@/stellar/network";
import { useTheme } from "@/theme/ThemeProvider";
import { cloudProvider } from "@/wallet/cloud";

// Keep this true to what the app does today.
const features: { icon: LucideIcon; label: string; detail: string }[] = [
  { icon: Wallet, label: "Hold XLM, USDC and more", detail: "Add any Stellar token you trust in Manage assets." },
  { icon: Send, label: "Send to a Stellar address", detail: "Type it, paste it or scan its QR code. You approve with your PIN." },
  { icon: AppWindow, label: "Use mini apps", detail: "Small apps that run inside MiniGo and can ask to be paid from your wallet." },
  { icon: KeyRound, label: "You hold the keys", detail: "Your recovery phrase is made on this phone. MiniGo never sees it." },
  { icon: CloudUpload, label: "Automatic backup", detail: `Encrypted and saved to your ${cloudProvider.name}, so signing in on a new phone brings your wallet back.` },
];

export default function AboutScreen() {
  const { colors } = useTheme();
  return (
    <StackScreen title="About MiniGo">
      <View style={styles.hero}>
        <View style={[styles.mark, { backgroundColor: colors.soft, borderColor: colors.line }]}>
          <Logo size={44} />
        </View>
        <Text weight="semibold" size={26} tracking={-0.03}>
          MiniGo
        </Text>
        <Text size={15} color={colors.muted} style={styles.tagline}>
          Money and mini apps, in one wallet.
        </Text>
        <Text size={14} color={colors.label} style={styles.pitch}>
          MiniGo is a wallet on the Stellar network that also runs small apps. Pay for things inside an app without leaving
          the wallet and approve every payment yourself.
        </Text>
      </View>

      <Section title="What you can do">
        {features.map((item) => (
          <Row key={item.label} icon={item.icon} label={item.label} detail={item.detail} chevron={false} />
        ))}
      </Section>

      <Section
        title="Where things stand"
        footer={
          isTestnet
            ? "MiniGo runs on Stellar's test network for now. The money is free test money with no real value, so it's safe to try everything."
            : undefined
        }
      >
        <Row icon={FlaskConical} label="Network" value={isTestnet ? "Stellar testnet" : "Stellar"} chevron={false} />
        <Row label="Version" value={Constants.expoConfig?.version ?? "1.0.0"} chevron={false} />
        <Row label="Coming later" detail="Sending to an email or phone, payment links and the real Stellar network" chevron={false} />
      </Section>

    </StackScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingHorizontal: 28, paddingTop: 8, gap: 6 },
  mark: { width: 84, height: 84, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  tagline: { textAlign: "center" },
  pitch: { textAlign: "center", lineHeight: 21, marginTop: 10 },
});
