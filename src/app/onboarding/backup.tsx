import { Redirect, useRouter } from "expo-router";
import { Cloud, KeyRound, LockKeyhole, type LucideIcon } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { cloudProvider } from "@/wallet/cloud";
import { useOnboarding } from "@/wallet/onboarding";

export default function BackupIntroScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { draft } = useOnboarding();
  if (!draft) return <Redirect href="/onboarding" />;

  const points: { icon: LucideIcon; title: string; body: string }[] = [
    { icon: KeyRound, title: "Your recovery phrase", body: "12 words that are the only key to this wallet. We made them on this phone." },
    { icon: LockKeyhole, title: "Encrypted before it leaves", body: "Sealed with a password only you know. MiniGo never sees the words or the password." },
    { icon: Cloud, title: `Kept in your ${cloudProvider.name}`, body: `Stored in a private app folder, so a new phone can restore everything.` },
  ];

  return (
    <StackScreen
      footer={
        <>
          <Button label={`Back up to ${cloudProvider.name}`} icon={Cloud} onPress={() => router.push("/onboarding/backup-password")} />
          <Button label="Write it down instead" variant="ghost" onPress={() => router.push("/onboarding/phrase")} />
        </>
      }
    >
      <View style={styles.body}>
        <Text size={13} weight="medium" color={colors.muted}>
          Step 1 of 3
        </Text>
        <Text weight="semibold" size={28} tracking={-0.03} style={styles.title} accessibilityRole="header">
          Back up your wallet first
        </Text>
        <Text size={15} color={colors.muted} style={styles.lead}>
          If you lose this phone, your backup is how you get your money back. It takes a minute.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.panelBorder }]}>
          {points.map(({ icon: Icon, title, body }, index) => (
            <View key={title} style={[styles.point, index > 0 && { borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <View style={[styles.pointIcon, { backgroundColor: colors.bg, borderColor: colors.line }]}>
                <Icon size={18} color={colors.ink} strokeWidth={1.8} />
              </View>
              <View style={styles.pointText}>
                <Text weight="semibold">{title}</Text>
                <Text size={13} color={colors.muted} style={styles.pointBody}>
                  {body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20 },
  title: { marginTop: 8, lineHeight: 34 },
  lead: { marginTop: 10, lineHeight: 22 },
  card: { marginTop: 28, borderRadius: 24, borderWidth: 1, paddingHorizontal: 18 },
  point: { flexDirection: "row", gap: 14, paddingVertical: 18 },
  pointIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  pointText: { flex: 1 },
  pointBody: { marginTop: 3, lineHeight: 19 },
});
