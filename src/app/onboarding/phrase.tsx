import { Redirect, useRouter } from "expo-router";
import { TriangleAlert } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";
import { PhraseGrid } from "@/components/PhraseGrid";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { useOnboarding } from "@/wallet/onboarding";
import { useSecretScreen } from "@/wallet/useSecretScreen";

export default function PhraseScreen() {
  useSecretScreen();
  const { colors } = useTheme();
  const router = useRouter();
  const { draft } = useOnboarding();
  const [revealed, setRevealed] = useState(false);
  if (!draft) return <Redirect href="/onboarding" />;

  return (
    <StackScreen footer={<Button label="I've written it down" onPress={() => router.push("/onboarding/verify")} disabled={!revealed} />}>
      <View style={styles.body}>
        <Text size={13} weight="medium" color={colors.muted}>
          Step 1 of 3
        </Text>
        <Text weight="semibold" size={28} tracking={-0.03} style={styles.title} accessibilityRole="header">
          Write down your recovery phrase
        </Text>
        <Text size={15} color={colors.muted} style={styles.lead}>
          On paper, in this order. You&apos;ll confirm a few words next.
        </Text>
        <View style={styles.grid}>
          <PhraseGrid phrase={draft.phrase} revealed={revealed} onReveal={() => setRevealed(true)} />
        </View>
        <Notice icon={TriangleAlert} tone="warning">
          Anyone with these words can take your money. Don&apos;t screenshot them or share them. MiniGo will never ask for them.
        </Notice>
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20 },
  title: { marginTop: 8, lineHeight: 34 },
  lead: { marginTop: 10, lineHeight: 22 },
  grid: { marginTop: 24, marginBottom: 16 },
});
