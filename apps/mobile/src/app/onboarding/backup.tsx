import { Redirect, useRouter } from "expo-router";
import { Cloud, KeyRound, ShieldCheck, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/theme/ThemeProvider";
import { sealBackup } from "@/wallet/backup";
import { cloud, cloudProvider } from "@/wallet/cloud";
import { CloudSignInError } from "@/wallet/googleAuth";
import { useOnboarding } from "@/wallet/onboarding";

export default function BackupIntroScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { draft, update } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!draft) return <Redirect href="/onboarding" />;

  const points: { icon: LucideIcon; title: string; body: string }[] = [
    { icon: KeyRound, title: "Your recovery phrase", body: "12 words that are the only key to this wallet. We made them on this phone." },
    { icon: ShieldCheck, title: "Nothing to remember", body: "Encrypted by MiniGo and protected by your Google account. Sign in on a new phone and your wallet is back." },
    { icon: Cloud, title: `Kept in your ${cloudProvider.name}`, body: `Stored in a private app folder, so a new phone can restore everything.` },
  ];

  const backUp = async () => {
    setSaving(true);
    setError(null);
    try {
      const file = await sealBackup(draft.phrase, draft.address);
      await cloud.save(file);
      update({ backup: { method: cloudProvider.id, at: file.createdAt, live: cloud.live } });
      toast(`Backed up to ${cloudProvider.name}`);
      router.push("/onboarding/details");
    } catch (caught) {
      setError(caught instanceof CloudSignInError ? caught.message : `Couldn't reach ${cloudProvider.name}. Check your connection and try again.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <StackScreen
      footer={
        <>
          <Button label={saving ? `Saving to ${cloudProvider.name}…` : `Back up to ${cloudProvider.name}`} icon={Cloud} onPress={backUp} loading={saving} />
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
        {error && (
          <View style={styles.error}>
            <Notice icon={Cloud} tone="warning">
              {error}
            </Notice>
          </View>
        )}
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
  error: { marginTop: 16 },
});
