import { useLocalSearchParams, useRouter } from "expo-router";
import { Globe } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { StackScreen } from "@/components/StackScreen";
import { useLaunchMiniApp } from "@/mini/OpenApps";
import { originOf } from "@/mini/types";
import { useTheme } from "@/theme/ThemeProvider";

// Opens any http(s) URL as a mini app. Development builds only: every route is also a deep link, so in a release
// build any link could open any site in the wallet under a name of its choosing.
export default function WebMiniAppScreen() {
  const { url, name } = useLocalSearchParams<{ url: string; name?: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const { openUrl } = useLaunchMiniApp();
  const valid = __DEV__ && !!url && !!originOf(url);

  useEffect(() => {
    if (!valid) return;
    openUrl(url, name);
    if (router.canGoBack()) router.back();
    else router.replace("/apps");
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (valid) return <View style={[styles.fill, { backgroundColor: colors.bg }]} />;
  return (
    <StackScreen title="Mini app">
      <View style={styles.body}>
        <EmptyState
          icon={Globe}
          title="Can't open that link"
          body={__DEV__ ? "Mini apps need an http:// or https:// address." : "MiniGo only opens mini apps from its own catalogue."}
          action={<Button label="Back" size="md" onPress={() => router.back()} />}
        />
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({ body: { paddingHorizontal: 20 }, fill: { flex: 1 } });
