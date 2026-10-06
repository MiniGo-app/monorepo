import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { CameraOff, X } from "lucide-react-native";
import { useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { parsePaymentCode } from "@/data/paymentLink";
import { useTheme } from "@/theme/ThemeProvider";

export default function ScanScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [message, setMessage] = useState<string | null>(null);
  const handled = useRef(false);

  const onScan = ({ data }: { data: string }) => {
    if (handled.current) return;
    const scanned = parsePaymentCode(data);
    if (!scanned.ok) {
      setMessage(scanned.reason);
      return;
    }
    const payment = scanned.payment;
    handled.current = true;
    router.replace({
      pathname: "/send/amount",
      params: {
        to: payment.recipient.value,
        ...(payment.amount ? { amount: payment.amount } : {}),
        ...(payment.asset ? { asset: payment.asset } : {}),
        ...(payment.memo ? { memo: payment.memo } : {}),
      },
    });
  };

  const close = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close scanner"
      onPress={() => router.back()}
      style={[styles.close, { top: insets.top + 12 }]}
    >
      <X size={20} color="#FFFFFF" strokeWidth={2} />
    </Pressable>
  );

  if (!permission?.granted) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.bg, paddingHorizontal: 32 }]}>
        <CameraOff size={36} color={colors.muted} strokeWidth={1.5} />
        <Text weight="semibold" size={20} style={styles.permissionTitle}>
          Scan to pay
        </Text>
        <Text size={14.5} color={colors.muted} style={styles.permissionBody}>
          MiniGo needs your camera to read payment QR codes. Nothing is recorded.
        </Text>
        <View style={styles.permissionActions}>
          {permission && !permission.canAskAgain ? (
            <Button label="Open settings" onPress={() => Linking.openSettings()} />
          ) : (
            <Button label="Allow camera" onPress={requestPermission} />
          )}
          <Button label="Not now" variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={onScan} />
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        <View style={styles.frame} />
        <Text weight="medium" size={15} color="#FFFFFF" style={styles.caption}>
          {message ?? "Point at a payment QR code"}
        </Text>
      </View>
      {close}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000000" },
  center: { alignItems: "center", justifyContent: "center" },
  frame: { width: 240, height: 240, borderRadius: 32, borderWidth: 3, borderColor: "#FFFFFF" },
  caption: { marginTop: 24, textAlign: "center", paddingHorizontal: 32 },
  close: {
    position: "absolute",
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionTitle: { marginTop: 20 },
  permissionBody: { marginTop: 8, textAlign: "center", lineHeight: 21 },
  permissionActions: { marginTop: 28, alignSelf: "stretch", gap: 10 },
});
