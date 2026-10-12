import { Tabs } from "expo-router";
import { PillTabBar } from "@/components/PillTabBar";
import { useTheme } from "@/theme/ThemeProvider";

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="send" options={{ title: "Send" }} />
      <Tabs.Screen name="apps" options={{ title: "Apps" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
