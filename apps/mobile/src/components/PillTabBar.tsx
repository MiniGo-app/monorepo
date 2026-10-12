import type { BottomTabBarProps } from "expo-router/tabs";
import { House, LayoutGrid, Send, UserRound, type LucideIcon } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "@/components/Text";

// Height the tab bar occupies, so scroll content can clear it.
export const TAB_BAR_SPACE = 104;

const tabs: Record<string, { label: string; icon: LucideIcon }> = {
  index: { label: "Home", icon: House },
  send: { label: "Send", icon: Send },
  apps: { label: "Apps", icon: LayoutGrid },
  profile: { label: "Profile", icon: UserRound },
};

export function PillTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          bottom: Math.max(insets.bottom, 12) + 8,
          width: Math.min(390, width - 40),
          backgroundColor: colors.nav,
          borderColor: colors.navBorder,
          shadowColor: colors.navShadow,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const tab = tabs[route.name];
        if (!tab) return null;
        const focused = state.index === index;
        const Icon = tab.icon;

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: focused }}
            style={({ pressed }) => [
              styles.item,
              focused ? [styles.active, { backgroundColor: colors.navActive }] : styles.idle,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
          >
            <Icon size={20} strokeWidth={focused ? 2 : 1.8} color={focused ? colors.navActiveInk : colors.navIdle} />
            {focused && (
              <Text weight="semibold" size={13.5} color={colors.navActiveInk}>
                {tab.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 6,
    borderRadius: 999,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: Platform.OS === "android" ? 12 : 0,
  },
  item: { height: 48, borderRadius: 999, alignItems: "center", justifyContent: "center", flexDirection: "row" },
  idle: { width: 56 },
  active: { paddingHorizontal: 20, gap: 8 },
});
