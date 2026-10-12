import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { useOnboarding } from "@/wallet/onboarding";
import { useSecretScreen } from "@/wallet/useSecretScreen";

type Question = { index: number; options: string[] };

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

// Three words, each with the right answer and two decoys from the same phrase.
function makeQuiz(words: string[]): Question[] {
  const indexes = shuffle(words.map((_, i) => i)).slice(0, 3).sort((a, b) => a - b);
  return indexes.map((index) => {
    const decoys = shuffle(words.filter((word) => word !== words[index])).slice(0, 2);
    return { index, options: shuffle([words[index], ...decoys]) };
  });
}

export default function VerifyScreen() {
  useSecretScreen();
  const { colors } = useTheme();
  const router = useRouter();
  const { draft, update } = useOnboarding();
  const words = draft?.phrase.split(" ") ?? [];
  const [quiz] = useState(() => makeQuiz(words));
  const [answers, setAnswers] = useState<Record<number, string>>({});
  if (!draft) return <Redirect href="/onboarding" />;

  const answered = quiz.every((q) => answers[q.index]);
  const wrong = quiz.filter((q) => answers[q.index] && answers[q.index] !== words[q.index]).map((q) => q.index);

  const finish = () => {
    update({ backup: { method: "manual", at: new Date().toISOString() } });
    router.push("/onboarding/details");
  };

  return (
    <StackScreen footer={<Button label="Continue" onPress={finish} disabled={!answered || wrong.length > 0} />}>
      <View style={styles.body}>
        <Text size={13} weight="medium" color={colors.muted}>
          Step 1 of 3
        </Text>
        <Text weight="semibold" size={28} tracking={-0.03} style={styles.title} accessibilityRole="header">
          Check your backup
        </Text>
        <Text size={15} color={colors.muted} style={styles.lead}>
          Pick the right word for each position.
        </Text>

        {quiz.map((question) => {
          const choice = answers[question.index];
          const isWrong = wrong.includes(question.index);
          return (
            <View key={question.index} style={styles.question}>
              <Text weight="semibold">
                Word #{question.index + 1}
                {isWrong && (
                  <Text size={13} color={colors.danger}>
                    {"  "}Not quite. Check your paper
                  </Text>
                )}
              </Text>
              <View style={styles.options}>
                {question.options.map((option) => {
                  const selected = choice === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setAnswers((current) => ({ ...current, [question.index]: option }))}
                      style={[
                        styles.option,
                        { borderColor: selected ? (isWrong ? colors.danger : colors.ink) : colors.line },
                        selected && { backgroundColor: isWrong ? colors.dangerSoft : colors.chip },
                      ]}
                    >
                      <Text weight={selected ? "semibold" : "regular"} color={selected && isWrong ? colors.danger : colors.ink}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20 },
  title: { marginTop: 8, lineHeight: 34 },
  lead: { marginTop: 10, lineHeight: 22 },
  question: { marginTop: 28 },
  options: { marginTop: 12, flexDirection: "row", gap: 8 },
  option: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
