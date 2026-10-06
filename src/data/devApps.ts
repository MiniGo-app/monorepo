import Constants from "expo-constants";
import { Platform } from "react-native";

export const TEST_MINI_APP_PORT = 4173;

// The dev machine as the phone sees it: the host Metro is served from (its LAN IP when using Expo Go).
function devHost() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return hostUri.split(":")[0];
  if (Platform.OS === "web" && typeof window !== "undefined") return window.location.hostname;
  return "localhost";
}

// Where `npm start` in test-mini-app/ serves the test mini app. Override with EXPO_PUBLIC_TEST_MINI_APP_URL,
// e.g. to point at a deployed copy.
export const testMiniAppUrl = process.env.EXPO_PUBLIC_TEST_MINI_APP_URL || `http://${devHost()}:${TEST_MINI_APP_PORT}`;
