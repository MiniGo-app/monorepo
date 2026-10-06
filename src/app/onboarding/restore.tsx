import { useRouter } from "expo-router";
import { ChevronRight, Cloud, KeyRound, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Notice } from "@/components/Notice";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { cloud, cloudProvider } from "@/wallet/cloud";

export default function RestoreScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [missing, setMissing] = useState(false);

  const fromCloud = async () => {
    setChecking(true);
    setMissing(false);
    try {
      const file = await cloud.load();
      if (file) router.push("/onboarding/restore-password");
      else setMissing(true);
    } catch {
      setMissing(true);
    } finally {
      setChecking(false);
    }
  };

  const option = (icon: LucideIcon, title: string, body: string, onPress: () => void, busy = false) => {
    const Icon = icon;
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        disabled={busy}
        style={({ pressed }) => [styles.option, { borderColor: colors.line, backgroundColor: colors.list }, pressed && styles.pressed]}
      >
        <View style={[styles.optionIcon, { backgroundColor: colors.chip }]}>
          <Icon size={20} color={colors.ink} strokeWidth={1.8} />
        </View>
        <View style={styles.optionText}>
          <Text weight="semibold">{title}</Text>
          <Text size={13} color={colors.muted} style={styles.optionBody}>
            {body}
          </Text>
        </View>
        {busy ? <ActivityIndicator color={colors.muted} /> : <ChevronRight size={18} color={colors.muted} strokeWidth={2} />}
      </Pressable>
    );
  };

  return (
    <StackScreen>
      <View style={styles.body}>
        <Text weight="semibold" size={28} tracking={-0.03} style={styles.title} accessibilityRole="header">
          Restore your wallet
        </Text>
        <Text size={15} color={colors.muted} style={styles.lead}>
          Bring your wallet to this phone with your backup.
        </Text>
        <View style={styles.options}>
          {option(Cloud, `From ${cloudProvider.name}`, "Use your backup password", fromCloud, checking)}
          {option(KeyRound, "With your recovery phrase", "Type the 12 or 24 words you wrote down", () => router.push("/onboarding/restore-phrase"))}
        </View>
        {missing && (
          <Notice icon={Cloud} tone="warning">
            No MiniGo backup found in {cloudProvider.name}. Check you&apos;re signed in to the same account, or use your recovery phrase.
          </Notice>
        )}
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20 },
  title: { marginTop: 8, lineHeight: 34 },
  lead: { marginTop: 10, lineHeight: 22 },
  options: { marginTop: 28, marginBottom: 16, gap: 10 },
  option: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 20, borderWidth: 1, padding: 16 },
  pressed: { opacity: 0.7 },
  optionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  optionText: { flex: 1 },
  optionBody: { marginTop: 2 },
});
