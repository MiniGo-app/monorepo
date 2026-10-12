import { useRouter } from "expo-router";
import { TriangleAlert } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Notice } from "@/components/Notice";
import { PhraseGrid } from "@/components/PhraseGrid";
import { PinSheet } from "@/components/PinSheet";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { useWallet } from "@/wallet/WalletProvider";
import { useSecretScreen } from "@/wallet/useSecretScreen";

export default function RecoveryPhraseScreen() {
  useSecretScreen();
  const { colors } = useTheme();
  const router = useRouter();
  const { revealPhrase } = useWallet();
  const [phrase, setPhrase] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  return (
    <StackScreen title="Recovery phrase">
      <View style={styles.body}>
        <Text size={15} color={colors.muted} style={styles.lead}>
          These words restore your wallet on any phone. Write them down in order and keep them offline.
        </Text>
        {phrase && <PhraseGrid phrase={phrase} revealed={revealed} onReveal={() => setRevealed(true)} />}
        <Notice icon={TriangleAlert} tone="warning">
          Never share these words. Anyone who has them can take your money, and MiniGo will never ask for them.
        </Notice>
      </View>
      <PinSheet
        visible={!phrase}
        subtitle="to show your recovery phrase"
        onClose={() => router.back()}
        verify={async (pin) => {
          const words = await revealPhrase(pin);
          if (words) setPhrase(words);
          return !!words;
        }}
      />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, gap: 20 },
  lead: { lineHeight: 22 },
});
