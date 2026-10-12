import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { Copy, Droplets, ExternalLink, Info, Share2 } from "lucide-react-native";
import { useState } from "react";
import { Share, StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";
import { QRCode } from "@/components/QRCode";
import { Row } from "@/components/Row";
import { Section } from "@/components/Section";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { CIRCLE_FAUCET_URL, isTestnet } from "@/stellar/network";
import { useTheme } from "@/theme/ThemeProvider";
import { errorMessage, useChain, useWallet, useWalletData } from "@/wallet/WalletProvider";

export default function ReceiveScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const { address } = useWalletData();
  const { account } = useChain();
  const { fundTestnet } = useWallet();
  const [funding, setFunding] = useState(false);
  const funded = !!account?.exists;

  const fund = async () => {
    setFunding(true);
    try {
      await fundTestnet();
      toast("10,000 test XLM added");
    } catch (error) {
      toast(errorMessage(error));
    } finally {
      setFunding(false);
    }
  };

  const copy = async () => {
    await Clipboard.setStringAsync(address);
    toast("Wallet address copied");
  };

  return (
    <StackScreen title="Receive">
      <View style={styles.body}>
        <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.panelBorder }]}>
          <View style={styles.qr}>
            <QRCode value={address} size={208} />
          </View>
          <Text size={13} color={colors.muted} style={styles.label}>
            Your Stellar address
          </Text>
          <Text weight="medium" size={14.5} style={styles.address} accessibilityLabel={address}>
            {`${address.slice(0, 28)}\n${address.slice(28)}`}
          </Text>
          <View style={styles.buttons}>
            <Button label="Copy" icon={Copy} size="md" style={styles.button} onPress={copy} />
            <Button
              label="Share"
              icon={Share2}
              size="md"
              variant="secondary"
              style={styles.button}
              onPress={() => Share.share({ message: `Pay me on MiniGo (Stellar): ${address}` }).catch(() => {})}
            />
          </View>
        </View>

        <Notice icon={Info}>
          Only send Stellar {isTestnet ? "testnet " : ""}assets to this address: XLM, USDC or any asset you&apos;ve added. Other networks can&apos;t reach it.
        </Notice>
      </View>

      {isTestnet && (
        <Section
          title="Test funds"
          footer="Testnet money has no value. For test USDC, add USDC in Manage assets first, then pick Stellar testnet on Circle's faucet and paste your address."
        >
          <Row
            icon={Droplets}
            label={funded ? "Test XLM received" : funding ? "Getting test XLM…" : "Get 10,000 test XLM"}
            detail={funded ? "Friendbot funds each account once" : "Creates your account on testnet"}
            onPress={funding || funded ? undefined : fund}
          />
          <Row icon={ExternalLink} label="Get test USDC" detail="Circle faucet" onPress={() => Linking.openURL(CIRCLE_FAUCET_URL)} />
        </Section>
      )}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, gap: 16 },
  card: { borderRadius: 28, borderWidth: 1, padding: 20, alignItems: "center" },
  qr: { padding: 12, borderRadius: 20, backgroundColor: "#FFFFFF" },
  label: { marginTop: 18 },
  address: { marginTop: 6, textAlign: "center", lineHeight: 22, fontVariant: ["tabular-nums"] },
  buttons: { marginTop: 18, flexDirection: "row", gap: 10, alignSelf: "stretch" },
  button: { flex: 1 },
});
