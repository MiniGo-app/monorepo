import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { PinPad } from "@/components/PinPad";
import { Sheet } from "@/components/Sheet";
import { Text } from "@/components/Text";
import { initials } from "@/data/profile";
import { useTheme } from "@/theme/ThemeProvider";
import { cloudProvider } from "@/wallet/cloud";
import { useLockout } from "@/wallet/useLockout";
import { useWallet } from "@/wallet/WalletProvider";

export default function LockScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, unlock, unlockWithBiometrics, biometricsAvailable, signOut } = useWallet();
  const lockout = useLockout();
  const [forgotOpen, setForgotOpen] = useState(false);
  const canUseBiometrics = biometricsAvailable && !!data?.settings.biometrics;

  useEffect(() => {
    if (canUseBiometrics) unlockWithBiometrics().catch(() => {});
    // Offer biometrics once, when the lock screen appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startOver = async () => {
    setForgotOpen(false);
    await signOut();
    router.replace("/onboarding/restore");
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text weight="semibold" size={20} color={colors.onPrimary}>
            {initials(data?.profile.name ?? "")}
          </Text>
        </View>
      </View>
      <PinPad
        title={`Welcome back${data?.profile.name ? `, ${data.profile.name.split(" ")[0]}` : ""}`}
        subtitle="Enter your PIN to unlock"
        notice={lockout}
        disabled={!!lockout}
        onComplete={unlock}
        onBiometrics={canUseBiometrics ? () => unlockWithBiometrics().catch(() => {}) : undefined}
      />
      <Button label="Forgot PIN?" variant="ghost" size="md" onPress={() => setForgotOpen(true)} />

      <Sheet visible={forgotOpen} onClose={() => setForgotOpen(false)}>
        <View style={styles.sheet}>
          <Text weight="semibold" size={19} tracking={-0.02} style={styles.center}>
            Reset with your backup
          </Text>
          <Text size={14} color={colors.muted} style={[styles.center, styles.sheetBody]}>
            PINs can&apos;t be recovered. Remove the wallet from this phone, then restore it from {cloudProvider.name} or your
            recovery phrase and set a new PIN. Your money stays safe on the network.
          </Text>
          <View style={styles.sheetActions}>
            <Button label="Remove and restore" variant="danger" onPress={startOver} />
            <Button label="Cancel" variant="secondary" onPress={() => setForgotOpen(false)} />
          </View>
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  identity: { alignItems: "center" },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  sheet: { paddingTop: 12 },
  center: { textAlign: "center" },
  sheetBody: { marginTop: 10, lineHeight: 21 },
  sheetActions: { marginTop: 24, gap: 10 },
});
