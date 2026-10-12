import * as ScreenCapture from "expo-screen-capture";
import { useEffect } from "react";
import { Platform } from "react-native";

const KEY = "minigo-secret-screen";

// Blocks screenshots and recording on Android, blanks recordings on iOS and blurs the app in the iOS app switcher.
// No app can block screenshots on iOS.
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
