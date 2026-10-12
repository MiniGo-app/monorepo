import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Button } from "@/components/Button";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { fonts } from "@/theme/colors";
import { useTheme } from "@/theme/ThemeProvider";
import { isPhraseWord, isValidPhrase, normalizePhrase } from "@/wallet/stellar";
import { useWallet } from "@/wallet/WalletProvider";
import { useSecretScreen } from "@/wallet/useSecretScreen";

// After the phone's biometrics or lock screen change the OS won't open the stored key. Entering the phrase
// again stores it under the current settings.
export default function RecoverAccessScreen() {
  useSecretScreen();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { recoverAccess } = useWallet();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const words = normalizePhrase(input).split(" ").filter(Boolean);
  const unknown = words.filter((word) => !isPhraseWord(word));

  const submit = async () => {
    if (!isValidPhrase(input)) {
      setError(unknown.length ? `Not in the word list: ${unknown.slice(0, 3).join(", ")}` : "These words don't form a valid phrase. Check the order.");
      return;
    }
    setBusy(true);
    try {
      if (await recoverAccess(input)) {
        toast("Signing access restored");
        router.back();
      } else {
        setError("That phrase belongs to a different wallet.");
      }
    } catch {
      setError("Couldn't save the key. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <StackScreen title="Recover signing access" footer={<Button label="Restore access" onPress={submit} disabled={words.length !== 12 && words.length !== 24} loading={busy} />}>
      <View style={styles.body}>
        <Text size={15} color={colors.muted} style={styles.lead}>
          Your phone&apos;s security settings changed, so MiniGo can&apos;t open your key any more. Your money is safe. Enter your recovery phrase to secure the key again.
        </Text>
        <TextInput
          value={input}
          onChangeText={(value) => {
            setInput(value);
            setError(null);
          }}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          importantForAutofill="no"
          placeholder="word1 word2 word3 …"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Recovery phrase"
          style={[styles.input, { color: colors.ink, backgroundColor: colors.soft, borderColor: error ? colors.danger : colors.line }]}
        />
        <Text size={12.5} color={error ? colors.danger : colors.muted} style={styles.hint}>
          {error ?? `${words.length} ${words.length === 1 ? "word" : "words"}`}
        </Text>
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20 },
  lead: { lineHeight: 22 },
  input: {
    marginTop: 24,
    minHeight: 150,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: "top",
    outlineWidth: 0,
  },
  hint: { marginTop: 8 },
});
