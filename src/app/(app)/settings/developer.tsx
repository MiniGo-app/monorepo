import { Redirect } from "expo-router";
import { FlaskConical, Globe, Info } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";
import { Row } from "@/components/Row";
import { Section } from "@/components/Section";
import { StackScreen } from "@/components/StackScreen";
import { TextField } from "@/components/TextField";
import { TEST_MINI_APP_PORT, testMiniAppUrl } from "@/data/devApps";
import { useLaunchMiniApp } from "@/mini/OpenApps";
import { originOf } from "@/mini/types";

// Development builds only: the route is also a deep link, and it opens any URL as a mini app.
export default function DeveloperRoute() {
  return __DEV__ ? <DeveloperScreen /> : <Redirect href="/profile" />;
}

function DeveloperScreen() {
  const [url, setUrl] = useState(testMiniAppUrl);
  const valid = !!originOf(url);

  const { openUrl } = useLaunchMiniApp();
  const open = (target: string, name?: string) => openUrl(target, name);

  return (
    <StackScreen title="Developer">
      <View style={styles.body}>
        <TextField
          label="Mini app URL"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://example.com"
          hint="A local dev server or a live site. It gets window.mini like any mini app."
          error={url && !valid ? "Use an http:// or https:// address" : null}
          onSubmitEditing={() => valid && open(url)}
        />
        <Button label="Open as mini app" icon={Globe} onPress={() => open(url)} disabled={!valid} />
      </View>

      <Section title="Quick open">
        <Row
          icon={FlaskConical}
          label="Test mini app"
          detail={testMiniAppUrl}
          onPress={() => open(testMiniAppUrl, "Test Mini App")}
        />
      </Section>

      <View style={styles.note}>
        <Notice icon={Info}>
          Start it with `npm start` in test-mini-app/ (port {TEST_MINI_APP_PORT}). On a phone, the URL uses your computer&apos;s
          network address so the phone can reach it; both must be on the same Wi-Fi.
        </Notice>
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, gap: 14 },
  note: { paddingHorizontal: 20, marginTop: 20 },
});
