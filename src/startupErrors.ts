import { Alert } from "react-native";

// In a release build a JavaScript error at startup closes the app with no trace. Show it on screen instead, so a
// tester can send a screenshot. Nothing is sent anywhere. Development builds keep React Native's own error screen.
if (!__DEV__) {
  const previous = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    if (!isFatal) return previous(error, isFatal);
    const detail =
      error instanceof Error
        ? `${error.name}: ${error.message}\n\n${(error.stack ?? "").split("\n").slice(0, 10).join("\n")}`
        : String(error);
    Alert.alert("MiniGo hit an error", `${detail}\n\nPlease send a screenshot of this message.`);
  });
}
