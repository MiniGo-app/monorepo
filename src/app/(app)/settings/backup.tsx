import { useRouter } from "expo-router";
import { CloudAlert, CloudCheck, Eye, FileText, FlaskConical, LockKeyhole, RefreshCw } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";
import { PasswordForm, type PasswordFormState } from "@/components/PasswordForm";
import { PinSheet } from "@/components/PinSheet";
import { Row } from "@/components/Row";
import { Section } from "@/components/Section";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/theme/ThemeProvider";
import { sealBackup } from "@/wallet/backup";
import { cloud, cloudProvider } from "@/wallet/cloud";
import { useWallet, useWalletData } from "@/wallet/WalletProvider";

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export default function BackupSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { revealPhrase, setBackup } = useWallet();
  const { backup, address } = useWalletData();
  const [pinOpen, setPinOpen] = useState(false);
  const [phrase, setPhrase] = useState<string | null>(null);
  const [form, setForm] = useState<PasswordFormState>({ password: "", ready: false });
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  const inCloud = backup && backup.method !== "manual";
  const StatusIcon = backup ? CloudCheck : CloudAlert;
  const title = !backup ? "Not backed up" : inCloud ? `Backed up to ${cloudProvider.name}` : "Written down";
  const body = !backup
    ? "If you lose this phone, you'll lose this wallet. Back it up now."
    : inCloud
      ? `Encrypted with your backup password on ${dateLabel(backup.at)}.`
      : `You confirmed your recovery phrase on ${dateLabel(backup.at)}. Keep the paper somewhere safe.`;

  const save = async () => {
    if (!phrase) return;
    setSaving(true);
    try {
      const file = await sealBackup(phrase, form.password, address, setProgress);
      await cloud.save(file);
      setBackup({ method: cloudProvider.id, at: file.createdAt, live: cloud.live });
      setPhrase(null);
      toast(`Backed up to ${cloudProvider.name}`);
    } catch {
      toast(`Couldn't reach ${cloudProvider.name}. Try again.`);
    } finally {
      setSaving(false);
    }
  };

  // Choosing a password for a new cloud backup, after the PIN check unlocked the phrase.
  if (phrase) {
    return (
      <StackScreen
        title="New backup"
        onBack={() => setPhrase(null)}
        footer={
          <Button
            label={saving ? `Encrypting… ${Math.round(progress * 100)}%` : "Encrypt and back up"}
            icon={LockKeyhole}
            onPress={save}
            disabled={!form.ready}
            loading={saving}
          />
        }
      >
        <View style={styles.body}>
          <Text size={15} color={colors.muted} style={styles.lead}>
            Choose a password for the backup in {cloudProvider.name}. It replaces any earlier backup there.
          </Text>
          <PasswordForm onChange={setForm} />
        </View>
      </StackScreen>
    );
  }

  return (
    <StackScreen title="Recovery & backup">
      <View style={styles.body}>
        <View style={[styles.status, { backgroundColor: colors.panel, borderColor: colors.panelBorder }]}>
          <View style={[styles.statusIcon, { backgroundColor: backup ? colors.primary : colors.warningSoft }]}>
            <StatusIcon size={24} color={backup ? colors.onPrimary : colors.warning} strokeWidth={1.8} />
          </View>
          <Text weight="semibold" size={18} tracking={-0.02} style={styles.statusTitle}>
            {title}
          </Text>
          <Text size={14} color={colors.muted} style={styles.statusBody}>
            {body}
          </Text>
        </View>
        {backup && "live" in backup && !backup.live && (
          <Notice icon={FlaskConical}>
            Development build: the encrypted file is kept on this device until Google Sign-In (Android) or an iCloud container
            (iOS) is set up. See the app README.
          </Notice>
        )}
      </View>

      <Section title="Backup" footer="Your recovery phrase is encrypted on this phone before upload. MiniGo never sees it or your password.">
        <Row
          icon={inCloud ? RefreshCw : CloudCheck}
          label={inCloud ? "Back up again" : `Back up to ${cloudProvider.name}`}
          detail={inCloud ? "Use a new backup password" : "Encrypted with a password you choose"}
          onPress={() => setPinOpen(true)}
        />
        <Row icon={Eye} label="Show recovery phrase" detail="Write it down as a second backup" onPress={() => router.push("/settings/recovery-phrase")} />
      </Section>

      <Section>
        <Row icon={FileText} label="How backups work" onPress={() => router.push("/settings/help")} />
      </Section>

      <PinSheet
        visible={pinOpen}
        subtitle="to back up your recovery phrase"
        onClose={() => setPinOpen(false)}
        verify={async (pin) => {
          const words = await revealPhrase(pin);
          if (!words) return false;
          setPinOpen(false);
          setPhrase(words);
          return true;
        }}
      />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, gap: 16 },
  lead: { lineHeight: 22, marginBottom: 12 },
  status: { borderRadius: 24, borderWidth: 1, padding: 20, alignItems: "center" },
  statusIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  statusTitle: { marginTop: 14 },
  statusBody: { marginTop: 6, textAlign: "center", lineHeight: 20 },
});
