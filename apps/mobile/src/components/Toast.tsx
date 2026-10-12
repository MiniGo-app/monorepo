import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "@/components/Text";

const ToastContext = createContext<(message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const show = useCallback(
    (next: string) => {
      clearTimeout(timer.current);
      setMessage(next);
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMessage(null));
      }, 2200);
    },
    [opacity],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {message && (
        <Animated.View
          pointerEvents="none"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[styles.toast, { top: insets.top + 12, opacity, backgroundColor: colors.ink }]}
        >
          <Text size={13} weight="medium" color={colors.bg} style={styles.text}>
            {message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    alignSelf: "center",
    maxWidth: "88%",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    zIndex: 100,
  },
  text: { textAlign: "center" },
});
