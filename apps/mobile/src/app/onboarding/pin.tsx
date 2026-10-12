import { Redirect } from "expo-router";
import { ScanFace } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { Button } from "@/components/Button";
import { PinPad } from "@/components/PinPad";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useTheme } from "@/theme/ThemeProvider";
import { useOnboarding } from "@/wallet/onboarding";
import { isWeakPin } from "@/wallet/pin";
import { useWallet } from "@/wallet/WalletProvider";

type Step = "create" | "confirm" | "biometrics";

export default function PinScreen() {
  const { colors } = useTheme();
  const { draft } = useOnboarding();
  const { createWallet, updateSettings, biometricsAvailable } = useWallet();
  const [step, setStep] = useState<Step>("create");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  if (!draft?.profile) return <Redirect href="/onboarding" />;
  const { phrase, address, profile, backup } = draft;

  const finish = async (biometrics: boolean) => {
    setSaving(true);
    if (biometrics) {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Turn on biometric unlock" });
      if (!result.success) {
        setSaving(false);
        return;
      }
    }
    // Creating the wallet unlocks it, which moves the app past onboarding.
    await createWallet({ phrase, address, profile, pin, backup });
    if (biometrics) updateSettings({ biometrics: true });
  };

  if (step === "biometrics") {
    return (
      <StackScreen
        back={false}
        footer={
          <>
            <Button label="Turn on" icon={ScanFace} onPress={() => finish(true)} loading={saving} />
            <Button label="Not now" variant="ghost" onPress={() => finish(false)} disabled={saving} />
          </>
        }
      >
        <View style={styles.center}>
          <View style={[styles.badge, { backgroundColor: colors.soft, borderColor: colors.line }]}>
            <ScanFace size={36} color={colors.ink} strokeWidth={1.5} />
          </View>
          <Text weight="semibold" size={26} tracking={-0.03} style={styles.title}>
            Unlock with Face ID or fingerprint?
          </Text>
          <Text size={15} color={colors.muted} style={styles.lead}>
            Faster than typing your PIN. You can still use your PIN any time.
          </Text>
        </View>
      </StackScreen>
    );
  }

  return (
    <StackScreen scroll={false} onBack={step === "confirm" ? () => setStep("create") : undefined}>
      <Text size={13} weight="medium" color={colors.muted} style={styles.step}>
        Step 3 of 3
      </Text>
      <PinPad
        key={step}
        title={step === "create" ? "Create a 6-digit PIN" : "Confirm your PIN"}
        subtitle={step === "create" ? "You'll use it to unlock MiniGo and approve payments." : "Enter it once more."}
        onComplete={async (entered) => {
          if (step === "create") {
            if (isWeakPin(entered)) return "Too easy to guess. Try another PIN.";
            setNotice(null);
            setPin(entered);
            setStep("confirm");
            return;
          }
          if (entered !== pin) {
            setNotice("PINs didn't match. Start again.");
            setStep("create");
            return;
          }
          if (biometricsAvailable) {
            setStep("biometrics");
            return;
          }
          setSaving(true);
          await createWallet({ phrase, address, profile, pin, backup });
        }}
        notice={notice}
        disabled={saving}
      />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  step: { textAlign: "center", marginTop: 8 },
  center: { paddingHorizontal: 28, alignItems: "center", paddingTop: 48 },
  badge: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { marginTop: 28, textAlign: "center", lineHeight: 32 },
  lead: { marginTop: 12, textAlign: "center", lineHeight: 22 },
});
