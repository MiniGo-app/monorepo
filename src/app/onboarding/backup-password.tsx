import { Redirect, useRouter } from "expo-router";
import { LockKeyhole } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";
import { PasswordForm, type PasswordFormState } from "@/components/PasswordForm";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/theme/ThemeProvider";
import { sealBackup } from "@/wallet/backup";
import { cloud, cloudProvider } from "@/wallet/cloud";
import { useOnboarding } from "@/wallet/onboarding";

type Stage = "idle" | "encrypting" | "uploading";

export default function BackupPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { draft, update } = useOnboarding();
  const [form, setForm] = useState<PasswordFormState>({ password: "", ready: false });
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  if (!draft) return <Redirect href="/onboarding" />;

  const backUp = async () => {
    setError(null);
    try {
      setStage("encrypting");
      const file = await sealBackup(draft.phrase, form.password, draft.address, setProgress);
      setStage("uploading");
      await cloud.save(file);
      update({ backup: { method: cloudProvider.id, at: file.createdAt, live: cloud.live } });
      toast(`Backed up to ${cloudProvider.name}`);
      router.push("/onboarding/details");
    } catch {
      setError(`Couldn't reach ${cloudProvider.name}. Check your connection and try again.`);
    } finally {
      setStage("idle");
    }
  };

  const label = stage === "encrypting" ? `Encrypting… ${Math.round(progress * 100)}%` : stage === "uploading" ? `Saving to ${cloudProvider.name}…` : "Encrypt and back up";

  return (
    <StackScreen footer={<Button label={label} icon={LockKeyhole} onPress={backUp} disabled={!form.ready} loading={stage !== "idle"} />}>
      <View style={styles.body}>
        <Text size={13} weight="medium" color={colors.muted}>
          Step 1 of 3
        </Text>
        <Text weight="semibold" size={28} tracking={-0.03} style={styles.title} accessibilityRole="header">
          Create a backup password
        </Text>
        <Text size={15} color={colors.muted} style={styles.lead}>
          You&apos;ll need it only when restoring on a new phone. It&apos;s different from your PIN.
        </Text>
        <View style={styles.form}>
          <PasswordForm onChange={setForm} />
        </View>
        {error && (
          <View style={styles.error}>
            <Notice icon={LockKeyhole} tone="danger">
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
  form: { marginTop: 28 },
  error: { marginTop: 20 },
});
