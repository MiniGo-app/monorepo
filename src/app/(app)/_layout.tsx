import { Stack } from "expo-router";
import { OpenAppsProvider } from "@/mini/OpenApps";
import { useTheme } from "@/theme/ThemeProvider";

export default function AppLayout() {
  const { colors } = useTheme();
  return (
    <OpenAppsProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        {/* Mini apps run in the open-apps layer; these routes only open one (deep links) and step back. */}
        <Stack.Screen name="mini/[appId]" options={{ animation: "none" }} />
        <Stack.Screen name="mini/web" options={{ animation: "none" }} />
        <Stack.Screen name="scan" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="send/done" options={{ gestureEnabled: false, animation: "fade" }} />
      </Stack>
    </OpenAppsProvider>
  );
}
