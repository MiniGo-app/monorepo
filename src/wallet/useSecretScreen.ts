import * as ScreenCapture from "expo-screen-capture";
import { useEffect } from "react";
import { Platform } from "react-native";

const KEY = "minigo-secret-screen";

// While a screen showing or taking the recovery phrase is open: no screenshots or screen recording (Android blocks
// both and blanks the app in Recents; iOS blanks recordings and mirroring), and on iOS the app blurs in the app
// switcher. Screenshots on iOS can't be blocked by any app; the phrase screen already warns against them.
export function useSecretScreen() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    ScreenCapture.preventScreenCaptureAsync(KEY).catch(() => {});
    if (Platform.OS === "ios") ScreenCapture.enableAppSwitcherProtectionAsync(0.9).catch(() => {});
    return () => {
      ScreenCapture.allowScreenCaptureAsync(KEY).catch(() => {});
      if (Platform.OS === "ios") ScreenCapture.disableAppSwitcherProtectionAsync().catch(() => {});
    };
  }, []);
}
