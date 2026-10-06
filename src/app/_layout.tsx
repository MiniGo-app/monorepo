// Must stay first: installs the Buffer that Stellar's libraries need before any of them load (see src/polyfills.ts).
import "@/polyfills";
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold, useFonts } from "@expo-google-fonts/geist";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { WalletProvider, useWallet } from "@/wallet/WalletProvider";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Geist_400Regular, Geist_500Medium, Geist_600SemiBold });

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <WalletProvider>
          {fontsLoaded ? (
            <ToastProvider>
              <RootStack />
            </ToastProvider>
          ) : (
            <Blank />
          )}
        </WalletProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Onboarding, the lock screen and the app are mutually exclusive: the wallet status decides which
// group can be reached, and flipping it moves the user there.
function RootStack() {
  const { mode, colors } = useTheme();
  const { status } = useWallet();
  if (status === "loading") return <Blank />;

  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={status === "unlocked"}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={status === "locked"}>
          <Stack.Screen name="lock" options={{ animation: "fade" }} />
        </Stack.Protected>
        <Stack.Protected guard={status === "onboarding"}>
          <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

function Blank() {
  const { colors } = useTheme();
  return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
}
