import { useRouter } from "expo-router";
import { Cloud, Eye, EyeOff } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useTheme } from "@/theme/ThemeProvider";
import { openBackup, WrongPasswordError, type BackupFile } from "@/wallet/backup";
import { cloud, cloudProvider } from "@/wallet/cloud";
import { useOnboarding } from "@/wallet/onboarding";
import { shortAddress } from "@/wallet/stellar";

export default function RestorePasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { startRestore, update } = useOnboarding();
  const [file, setFile] = useState<BackupFile | null>(null);
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    cloud.load().then(setFile).catch(() => setFile(null));
  }, []);

  const restore = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const phrase = await openBackup(file, password, setProgress);
      const draft = await startRestore(phrase);
      if (draft.address !== file.address) throw new Error("Backup doesn't match its wallet");
      update({ backup: { method: cloudProvider.id, at: file.createdAt, live: cloud.live } });
      router.push("/onboarding/details");
    } catch (caught) {
      setError(caught instanceof WrongPasswordError ? caught.message : "This backup couldn't be opened.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <StackScreen footer={<Button label={busy ? `Unlocking backup… ${Math.round(progress * 100)}%` : "Restore wallet"} onPress={restore} disabled={!file || !password} loading={busy} />}>
      <View style={styles.body}>
        <Text weight="semibold" size={28} tracking={-0.03} style={styles.title} accessibilityRole="header">
          Enter your backup password
        </Text>
        <Text size={15} color={colors.muted} style={styles.lead}>
          The password you chose when you backed up. Not your PIN.
        </Text>

        {file && (
          <View style={[styles.file, { backgroundColor: colors.panel, borderColor: colors.panelBorder }]}>
            <View style={[styles.fileIcon, { backgroundColor: colors.bg, borderColor: colors.line }]}>
              <Cloud size={18} color={colors.ink} strokeWidth={1.8} />
            </View>
            <View style={styles.fileText}>
              <Text weight="semibold">{cloudProvider.name} backup</Text>
              <Text size={13} color={colors.muted} style={styles.fileMeta}>
                {shortAddress(file.address, 6, 6)} · {new Date(file.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.form}>
          <TextField
            label="Backup password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError(null);
            }}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            error={error}
            onSubmitEditing={restore}
            right={
              <Pressable accessibilityRole="button" accessibilityLabel={visible ? "Hide password" : "Show password"} onPress={() => setVisible((v) => !v)} hitSlop={8}>
                {visible ? <EyeOff size={18} color={colors.muted} strokeWidth={1.8} /> : <Eye size={18} color={colors.muted} strokeWidth={1.8} />}
              </Pressable>
            }
          />
        </View>
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20 },
  title: { marginTop: 8, lineHeight: 34 },
  lead: { marginTop: 10, lineHeight: 22 },
  file: { marginTop: 24, borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  fileIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  fileText: { flex: 1 },
  fileMeta: { marginTop: 2 },
  form: { marginTop: 24 },
});
