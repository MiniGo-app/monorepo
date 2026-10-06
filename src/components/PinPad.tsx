import { ScanFace } from "lucide-react-native";
import { useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { PIN_LENGTH } from "@/wallet/pin";
import { useTheme } from "@/theme/ThemeProvider";
import { Keypad } from "@/components/Keypad";
import { Text } from "@/components/Text";

type PinPadProps = {
  title: string;
  subtitle?: string;
  // Resolve false (or a message) to shake and clear; anything else keeps the dots filled.
  onComplete: (pin: string) => Promise<boolean | string | void> | boolean | string | void;
  onBiometrics?: () => void;
  // Shown instead of the subtitle, e.g. a lockout countdown.
  notice?: string | null;
  disabled?: boolean;
};

export function PinPad({ title, subtitle, onComplete, onBiometrics, notice, disabled }: PinPadProps) {
  const { colors } = useTheme();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shake] = useState(() => new Animated.Value(0));

  // The digits typed so far, readable synchronously so fast taps never drop one.
  const entered = useRef("");

  const submit = async (value: string) => {
    setBusy(true);
    const result = await onComplete(value);
    setBusy(false);
    if (result === false || typeof result === "string") {
      entered.current = "";
      setPin("");
      setError(typeof result === "string" ? result : "Wrong PIN. Try again.");
      Animated.sequence(
        [10, -10, 6, -6, 0].map((toValue) => Animated.timing(shake, { toValue, duration: 50, useNativeDriver: true })),
      ).start();
    }
  };

  const press = (key: string) => {
    if (entered.current.length >= PIN_LENGTH) return;
    const next = entered.current + key;
    entered.current = next;
    setError(null);
    setPin(next);
    if (next.length === PIN_LENGTH) submit(next);
  };

  const remove = () => {
    entered.current = entered.current.slice(0, -1);
    setPin(entered.current);
  };

  const inactive = disabled || busy;

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Text weight="semibold" size={22} tracking={-0.02} accessibilityRole="header" style={styles.center}>
          {title}
        </Text>
        <Text size={14} color={error || notice ? colors.danger : colors.muted} style={[styles.center, styles.subtitle]}>
          {notice || error || subtitle || " "}
        </Text>
        <Animated.View
          accessibilityLabel={`${pin.length} of ${PIN_LENGTH} digits entered`}
          style={[styles.dots, { transform: [{ translateX: shake }] }]}
        >
          {Array.from({ length: PIN_LENGTH }, (_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { borderColor: error ? colors.danger : colors.ink },
                index < pin.length && { backgroundColor: colors.ink },
              ]}
            />
          ))}
        </Animated.View>
      </View>
      <Keypad
        disabled={inactive}
        onKey={press}
        onDelete={remove}
        extra={
          onBiometrics
            ? { label: "Use biometrics", content: <ScanFace size={26} color={colors.ink} strokeWidth={1.7} />, onPress: onBiometrics }
            : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  top: { alignItems: "center", paddingTop: 24 },
  center: { textAlign: "center" },
  subtitle: { marginTop: 8, minHeight: 20, lineHeight: 20 },
  dots: { marginTop: 32, flexDirection: "row", gap: 16 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
});
