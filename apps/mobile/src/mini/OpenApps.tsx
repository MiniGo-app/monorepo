import { useRouter } from "expo-router";
import { LayoutGrid, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Animated, BackHandler, Easing, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { HostedAppIcon } from "@/components/HostedAppIcon";
import { ListCard } from "@/components/ListCard";
import { Row } from "@/components/Row";
import { Sheet } from "@/components/Sheet";
import { Text } from "@/components/Text";
import { getMiniApp } from "@/data/miniApps";
import { useTheme } from "@/theme/ThemeProvider";
import { catalogHostedApp, webHostedApp } from "./hosted";
import { MiniAppHost } from "./MiniAppHost";
import { OpenAppsContext, useOpenApps, type OpenAppsValue } from "./openAppsContext";
import * as core from "./openAppsCore";
import type { HostedApp } from "./types";

export { useOpenApps };

// Open mini apps are rendered here above the screens instead of as routes, so they keep running when you leave
// them. Locking the wallet unmounts this layer and closes them all.

export function OpenAppsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [state, setState] = useState<core.OpenAppsState<HostedApp>>({ apps: [], activeId: null });
  const [waiting, setWaitingMap] = useState<Record<string, number>>({});
  const [switcherOpen, setSwitcherOpen] = useState(false);
  // 0 is on screen, 1 is slid away.
  const [slide] = useState(() => new Animated.Value(1));

  const show = useCallback(() => {
    Animated.timing(slide, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [slide]);
  // A minimize cut short by another app opening is dropped. A close always happens.
  const hideThen = useCallback(
    (change: (current: core.OpenAppsState<HostedApp>) => core.OpenAppsState<HostedApp>, always = false) => {
      Animated.timing(slide, { toValue: 1, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
        if (finished || always) setState(change);
      });
    },
    [slide],
  );

  const launch = useCallback(
    (app: HostedApp) => {
      setState((current) => core.launch(current, app, (id) => (waiting[id] ?? 0) > 0).state);
      setSwitcherOpen(false);
      show();
    },
    [show, waiting],
  );
  const switchTo = useCallback(
    (id: string) => {
      setState((current) => core.switchTo(current, id));
      setSwitcherOpen(false);
      show();
    },
    [show],
  );
  const minimize = useCallback(() => {
    setSwitcherOpen(false);
    hideThen(core.minimize);
  }, [hideThen]);
  const close = useCallback(
    (id: string) => {
      const forget = (current: core.OpenAppsState<HostedApp>) => core.close(current, id);
      setWaitingMap(({ [id]: _, ...rest }) => rest);
      if (state.activeId === id) hideThen(forget, true);
      else setState(forget);
    },
    [hideThen, state.activeId],
  );
  const setWaiting = useCallback((id: string, count: number) => setWaitingMap((current) => ({ ...current, [id]: count })), []);

  // Android back minimizes the app on screen.
  const active = state.activeId !== null;
  useEffect(() => {
    if (!active) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      minimize();
      return true;
    });
    return () => subscription.remove();
  }, [active, minimize]);

  const value = useMemo<OpenAppsValue>(
    () => ({ apps: state.apps, activeId: state.activeId, waiting, launch, switchTo, minimize, close, openSwitcher: () => setSwitcherOpen(true), setWaiting }),
    [state, waiting, launch, switchTo, minimize, close, setWaiting],
  );

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [0, height] });

  return (
    <OpenAppsContext.Provider value={value}>
      <View style={styles.flex} importantForAccessibility={active ? "no-hide-descendants" : "auto"} accessibilityElementsHidden={active}>
        {children}
      </View>
      <Animated.View pointerEvents={active ? "box-none" : "none"} style={[StyleSheet.absoluteFill, { transform: [{ translateY }] }]}>
        {state.apps.map((app) => (
          <View key={app.id} style={[StyleSheet.absoluteFill, { display: app.id === state.activeId ? "flex" : "none" }]}>
            <MiniAppHost app={app} active={app.id === state.activeId} />
          </View>
        ))}
      </Animated.View>
      <Switcher
        visible={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        onBrowse={() => {
          minimize();
          router.navigate("/apps");
        }}
      />
    </OpenAppsContext.Provider>
  );
}

export function useLaunchMiniApp() {
  const { launch } = useOpenApps();
  const { colors } = useTheme();
  return useMemo(
    () => ({
      openCatalog: (id: string) => {
        const app = getMiniApp(id);
        if (app) launch(catalogHostedApp(app, colors));
        return !!app;
      },
      openUrl: (url: string, name?: string) => {
        const hosted = webHostedApp(url, name);
        if (hosted) launch(hosted);
        return !!hosted;
      },
    }),
    [launch, colors],
  );
}

function Switcher({ visible, onClose, onBrowse }: { visible: boolean; onClose: () => void; onBrowse: () => void }) {
  const { colors } = useTheme();
  const { apps, activeId, waiting, switchTo, close } = useOpenApps();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text weight="semibold" size={17} tracking={-0.01} style={styles.sheetTitle} accessibilityRole="header">
        Open apps
      </Text>
      <ListCard>
        {apps.map((app) => {
          const current = app.id === activeId;
          const pending = waiting[app.id] ?? 0;
          return (
            <View key={app.id} style={styles.appRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={current ? `${app.name}, on screen` : `Switch to ${app.name}`}
                accessibilityState={{ selected: current }}
                onPress={() => (current ? onClose() : switchTo(app.id))}
                style={styles.appMain}
              >
                <HostedAppIcon app={app} size={40} radius={12} glyphSize={18} />
                <View style={styles.shrink}>
                  <Text weight="medium" numberOfLines={1}>
                    {app.name}
                  </Text>
                  <Text size={12.5} color={pending ? colors.ink : colors.muted} weight={pending ? "medium" : "regular"} numberOfLines={1}>
                    {pending ? "Waiting for your approval" : current ? "On screen" : (app.origin ?? `By ${app.developer}`)}
                  </Text>
                </View>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Close ${app.name}`} onPress={() => close(app.id)} hitSlop={6} style={[styles.closeButton, { borderColor: colors.line }]}>
                <X size={16} color={colors.ink} strokeWidth={2} />
              </Pressable>
            </View>
          );
        })}
      </ListCard>
      <View style={styles.browse}>
        <ListCard>
          <Row icon={LayoutGrid} label="All mini apps" onPress={onBrowse} />
        </ListCard>
      </View>
      <Text size={12.5} color={colors.muted} style={styles.footnote}>
        Up to {core.MAX_OPEN_APPS} apps stay open. Opening another closes the one you used least recently.
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  sheetTitle: { paddingTop: 8, paddingBottom: 12 },
  appRow: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12 },
  appMain: { flex: 1, minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12 },
  closeButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  browse: { marginTop: 12 },
  footnote: { marginTop: 10, paddingHorizontal: 4, lineHeight: 18 },
});
