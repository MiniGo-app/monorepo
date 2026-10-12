import { Check } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, useColorScheme, View } from "react-native";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { palettes, type ColorMode, type ThemePreference } from "@/theme/colors";
import { useTheme } from "@/theme/ThemeProvider";

const options: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// A tiny Home screen drawn in the given palette.
function Preview({ mode }: { mode: ColorMode }) {
  const p = palettes[mode];
  return (
    <View style={[styles.preview, { backgroundColor: p.bg }]}>
      <View style={[styles.previewHero, { backgroundColor: p.hero, borderColor: p.heroBorder }]}>
        <View style={[styles.previewLine, { width: "40%", backgroundColor: "rgba(255,255,255,0.35)" }]} />
        <View style={[styles.previewAmount, { backgroundColor: "#FFFFFF" }]} />
      </View>
      {[0.7, 0.5, 0.6].map((width, index) => (
        <View key={index} style={styles.previewRow}>
          <View style={[styles.previewDot, { backgroundColor: p.primary }]} />
          <View style={[styles.previewLine, { width: `${width * 100}%`, backgroundColor: p.line }]} />
        </View>
      ))}
      <View style={[styles.previewNav, { backgroundColor: p.nav, borderColor: p.navBorder }]}>
        <View style={[styles.previewNavActive, { backgroundColor: p.navActive }]} />
      </View>
    </View>
  );
}

// Light on the left, dark on the right.
function SplitPreview() {
  const [width, setWidth] = useState(0);
  return (
    <View style={styles.split} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <Preview mode="light" />
      {width > 0 && (
        <View style={[styles.darkHalf, { left: width / 2 }]}>
          <View style={[styles.darkInner, { left: -width / 2, width }]}>
            <Preview mode="dark" />
          </View>
        </View>
      )}
    </View>
  );
}

export default function AppearanceScreen() {
  const { colors, preference, setPreference } = useTheme();
  const system = useColorScheme() === "dark" ? "Dark" : "Light";

  return (
    <StackScreen title="Appearance">
      <View style={styles.body}>
        <View style={styles.tiles} accessibilityRole="radiogroup">
          {options.map((option) => {
            const selected = preference === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={option.label}
                onPress={() => setPreference(option.value)}
                style={styles.tile}
              >
                <View style={[styles.frame, { borderColor: selected ? colors.ink : colors.line, borderWidth: selected ? 2 : 1 }]}>
                  {option.value === "system" ? (
                    <SplitPreview />
                  ) : (
                    <Preview mode={option.value} />
                  )}
                </View>
                <View style={styles.label}>
                  <View style={[styles.radio, { borderColor: selected ? colors.ink : colors.muted, backgroundColor: selected ? colors.ink : "transparent" }]}>
                    {selected && <Check size={12} color={colors.bg} strokeWidth={3} />}
                  </View>
                  <Text weight={selected ? "semibold" : "medium"} size={14}>
                    {option.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text size={13.5} color={colors.muted} style={styles.note}>
          {preference === "system"
            ? `Matches your phone's setting, which is ${system.toLowerCase()} right now. MiniGo switches when your phone does.`
            : `MiniGo stays ${preference} whatever your phone is set to.`}
        </Text>
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 12 },
  tiles: { flexDirection: "row", justifyContent: "space-between" },
  tile: { width: "31%", alignItems: "center" },
  frame: { width: "100%", aspectRatio: 0.62, borderRadius: 18, overflow: "hidden", padding: 4 },
  split: { flex: 1, borderRadius: 14, overflow: "hidden" },
  darkHalf: { position: "absolute", top: 0, right: 0, bottom: 0, overflow: "hidden" },
  darkInner: { position: "absolute", top: 0, bottom: 0 },
  preview: { flex: 1, width: "100%", borderRadius: 14, padding: 8, gap: 6, overflow: "hidden" },
  previewHero: { height: "30%", borderRadius: 8, borderWidth: 1, padding: 6, justifyContent: "space-between" },
  previewAmount: { width: "60%", height: 6, borderRadius: 3 },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  previewDot: { width: 9, height: 9, borderRadius: 5 },
  previewLine: { height: 4, borderRadius: 2 },
  previewNav: { position: "absolute", left: 8, right: 8, bottom: 8, height: 14, borderRadius: 7, borderWidth: 1, padding: 2 },
  previewNavActive: { width: "32%", height: "100%", borderRadius: 5 },
  label: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  note: { marginTop: 24, lineHeight: 20, textAlign: "center", paddingHorizontal: 8 },
});
