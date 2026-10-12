import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Button } from "@/components/Button";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { fonts } from "@/theme/colors";
import { useTheme } from "@/theme/ThemeProvider";
import { useOnboarding } from "@/wallet/onboarding";
import { isPhraseWord, isValidPhrase, normalizePhrase } from "@/wallet/stellar";
import { useSecretScreen } from "@/wallet/useSecretScreen";

export default function RestorePhraseScreen() {
  useSecretScreen();
  const { colors } = useTheme();
  const router = useRouter();
  const { startRestore } = useOnboarding();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const words = normalizePhrase(input).split(" ").filter(Boolean);
  const unknown = words.filter((word) => !isPhraseWord(word));
  const rightLength = words.length === 12 || words.length === 24;

  const restore = async () => {
    if (!isValidPhrase(input)) {
      setError(unknown.length ? `Not in the word list: ${unknown.slice(0, 3).join(", ")}` : "These words don't form a valid phrase. Check the order.");
      return;
    }
    setBusy(true);
    try {
      await startRestore(input);
      router.push("/onboarding/details");
    } finally {
      setBusy(false);
    }
  };

  return (
    <StackScreen footer={<Button label="Continue" onPress={restore} disabled={!rightLength} loading={busy} />}>
      <View style={styles.body}>
        <Text weight="semibold" size={28} tracking={-0.03} style={styles.title} accessibilityRole="header">
          Enter your recovery phrase
        </Text>
        <Text size={15} color={colors.muted} style={styles.lead}>
          Type the words in order, separated by spaces.
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
          style={[
            styles.input,
            { color: colors.ink, backgroundColor: colors.soft, borderColor: error ? colors.danger : colors.line },
          ]}
        />
        <Text size={12.5} color={error ? colors.danger : colors.muted} style={styles.hint}>
          {error ?? `${words.length} ${words.length === 1 ? "word" : "words"}${unknown.length ? ` · ${unknown.length} not recognised` : ""}`}
        </Text>
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20 },
  title: { marginTop: 8, lineHeight: 34 },
  lead: { marginTop: 10, lineHeight: 22 },
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
