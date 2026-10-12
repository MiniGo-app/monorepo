import { useRouter } from "expo-router";
import { CloudAlert, CloudCheck, Eye, FileText, FlaskConical, RefreshCw } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Notice } from "@/components/Notice";
import { PinSheet } from "@/components/PinSheet";
import { Row } from "@/components/Row";
import { Section } from "@/components/Section";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/theme/ThemeProvider";
import { sealBackup } from "@/wallet/backup";
import { cloud, cloudProvider } from "@/wallet/cloud";
import { CloudSignInError } from "@/wallet/googleAuth";
import { useWallet, useWalletData } from "@/wallet/WalletProvider";

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export default function BackupSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { revealPhrase, setBackup } = useWallet();
  const { backup, address } = useWalletData();
  const [pinOpen, setPinOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const inCloud = backup && backup.method !== "manual";
  const StatusIcon = backup ? CloudCheck : CloudAlert;
  const title = !backup ? "Not backed up" : inCloud ? `Backed up to ${cloudProvider.name}` : "Written down";
  const body = !backup
    ? "If you lose this phone, you'll lose this wallet. Back it up now."
    : inCloud
      ? `Saved on ${dateLabel(backup.at)}. Sign in to the same Google account on a new phone to get your wallet back.`
      : `You confirmed your recovery phrase on ${dateLabel(backup.at)}. Keep the paper somewhere safe.`;

  // After the PIN unlocks the phrase, the new backup replaces the old one.
  const backUp = async (phrase: string) => {
    setSaving(true);
    try {
      const file = await sealBackup(phrase, address);
      await cloud.save(file);
      setBackup({ method: cloudProvider.id, at: file.createdAt, live: cloud.live });
      toast(`Backed up to ${cloudProvider.name}`);
    } catch (caught) {
      toast(caught instanceof CloudSignInError ? caught.message : `Couldn't reach ${cloudProvider.name}. Try again.`);
    } finally {
      setSaving(false);
    }
  };

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

      <Section
        title="Backup"
        footer={`Encrypted by MiniGo and kept in a private folder in your ${cloudProvider.name}. Anyone who can sign in to your Google account can restore this wallet, so keep that account secure.`}
      >
        <Row
          icon={inCloud ? RefreshCw : CloudCheck}
          label={saving ? `Saving to ${cloudProvider.name}…` : inCloud ? "Back up again" : `Back up to ${cloudProvider.name}`}
          detail={inCloud ? `Replaces the backup in your ${cloudProvider.name}` : "Nothing to remember"}
          onPress={() => !saving && setPinOpen(true)}
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
          backUp(words);
          return true;
        }}
      />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, gap: 16 },
  status: { borderRadius: 24, borderWidth: 1, padding: 20, alignItems: "center" },
  statusIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  statusTitle: { marginTop: 14 },
  statusBody: { marginTop: 6, textAlign: "center", lineHeight: 20 },
});
