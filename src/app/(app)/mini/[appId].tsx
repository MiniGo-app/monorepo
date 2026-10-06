import { useLocalSearchParams, useRouter } from "expo-router";
import { LayoutGrid } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { StackScreen } from "@/components/StackScreen";
import { getMiniApp } from "@/data/miniApps";
import { useLaunchMiniApp } from "@/mini/OpenApps";
import { useTheme } from "@/theme/ThemeProvider";

// minigo://mini/<id>: opens the app in the open-apps layer and steps back to where the user was.
export default function CatalogMiniAppScreen() {
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const { openCatalog } = useLaunchMiniApp();
  const found = !!getMiniApp(appId);

  useEffect(() => {
    if (!found) return;
    openCatalog(appId);
    if (router.canGoBack()) router.back();
    else router.replace("/apps");
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (found) return <View style={[styles.fill, { backgroundColor: colors.bg }]} />;
  return (
    <StackScreen title="Mini app">
      <View style={styles.body}>
        <EmptyState
          icon={LayoutGrid}
          title="Mini app not found"
          body="It may have been removed or the link is wrong."
          action={<Button label="Browse mini apps" size="md" onPress={() => router.replace("/apps")} />}
        />
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({ body: { paddingHorizontal: 20 }, fill: { flex: 1 } });
