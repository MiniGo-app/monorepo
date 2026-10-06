import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { KeyRound, Lock, LockKeyhole, RotateCcw, ScanFace, ShieldCheck, Timer } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { ListCard } from "@/components/ListCard";
import { Row } from "@/components/Row";
import { Section } from "@/components/Section";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/theme/ThemeProvider";
import { useWallet, useWalletData, type AutoLock } from "@/wallet/WalletProvider";

const autoLockOptions: { value: AutoLock; label: string }[] = [
  { value: "immediately", label: "Immediately" },
  { value: "1m", label: "After 1 minute" },
  { value: "5m", label: "After 5 minutes" },
];

export default function SecurityScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { updateSettings, biometricsAvailable, lock, keyProtection, needsKeyRecovery } = useWallet();
  const { settings } = useWalletData();

  const toggleBiometrics = async (on: boolean) => {
    if (on) {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Turn on biometric unlock" });
      if (!result.success) return;
    }
    updateSettings({ biometrics: on });
    toast(on ? "Biometric unlock on" : "Biometric unlock off");
  };

  return (
    <StackScreen title="Security & PIN">
      <Section title="Unlock">
        <Row icon={KeyRound} label="Change PIN" onPress={() => router.push("/settings/change-pin")} />
        <Row
          icon={ScanFace}
          label="Face ID or fingerprint"
          detail={biometricsAvailable ? "Unlock without typing your PIN" : "Not set up on this device"}
          toggle={{ value: settings.biometrics && biometricsAvailable, onChange: toggleBiometrics, disabled: !biometricsAvailable }}
        />
        <Row icon={Lock} label="Lock now" onPress={lock} chevron={false} />
      </Section>

      <View style={styles.group}>
        <View style={styles.groupTitle}>
          <Timer size={14} color={colors.muted} strokeWidth={1.8} />
          <Text weight="medium" size={12.5} color={colors.muted}>
            Auto-lock
          </Text>
        </View>
        <ListCard>
          {autoLockOptions.map((option) => {
            const selected = settings.autoLock === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => updateSettings({ autoLock: option.value })}
                style={styles.option}
              >
                <Text style={styles.flex}>{option.label}</Text>
                <View style={[styles.radio, { borderColor: selected ? colors.ink : colors.muted }]}>
                  {selected && <View style={[styles.radioDot, { backgroundColor: colors.ink }]} />}
                </View>
              </Pressable>
            );
          })}
        </ListCard>
        <Text size={12.5} color={colors.muted} style={styles.footer}>
          How long MiniGo can stay in the background before asking for your PIN.
        </Text>
      </View>

      <Section
        title="Recovery phrase"
        footer={
          needsKeyRecovery
            ? "Your phone's security settings changed, so MiniGo can't open your key. Enter your recovery phrase to secure it again."
            : keyProtection === "device"
              ? "Your key is locked by your phone. Your phone asks for Face ID or your fingerprint each time MiniGo needs it, even if someone gets past the PIN screen."
              : "Only your PIN protects your key inside MiniGo. Set up Face ID or a fingerprint on your phone in a full MiniGo build to have your phone lock it as well."
        }
      >
        <Row
          icon={LockKeyhole}
          label="Key protection"
          value={needsKeyRecovery ? "Needs recovery" : keyProtection === "device" ? "Locked by phone" : keyProtection === "pin-only" ? "PIN only" : "Checking…"}
        />
        {needsKeyRecovery && <Row icon={RotateCcw} label="Recover signing access" onPress={() => router.push("/settings/recover-access")} />}
      </Section>

      <Section title="Payments" footer="Every payment, including ones mini apps ask for, needs your PIN or biometrics. This can't be turned off.">
        <Row icon={ShieldCheck} label="Approve each payment" value="Always on" />
      </Section>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { marginTop: 24, paddingHorizontal: 20 },
  groupTitle: { flexDirection: "row", alignItems: "center", gap: 6 },
  option: { minHeight: 52, flexDirection: "row", alignItems: "center" },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  footer: { marginTop: 8, paddingHorizontal: 4, lineHeight: 18 },
});
