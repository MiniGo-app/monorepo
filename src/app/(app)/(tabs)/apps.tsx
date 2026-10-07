import { useFocusEffect } from "expo-router";
import { ChevronRight, FlaskConical, Gift, LayoutGrid } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppIcon } from "@/components/AppIcon";
import { CardRings } from "@/components/CardRings";
import { ListCard } from "@/components/ListCard";
import { PageTitle, Screen, SectionHeader } from "@/components/Screen";
import { SearchField } from "@/components/SearchField";
import { Text } from "@/components/Text";
import { useToast } from "@/components/Toast";
import {
  featuredAppId,
  getMiniApp,
  getMiniApps,
  miniApps,
  recentAppIds,
  type MiniAppCategory,
} from "@/data/miniApps";
import { testMiniAppUrl } from "@/data/devApps";
import { HostedAppIcon } from "@/components/HostedAppIcon";
import { useLaunchMiniApp, useOpenApps } from "@/mini/OpenApps";
import { useTheme } from "@/theme/ThemeProvider";

type Filter = "All" | MiniAppCategory;
const filters: Filter[] = ["All", "Finance", "Social", "Rewards"];

export default function AppsScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const { openCatalog, openUrl } = useLaunchMiniApp();
  const { apps: openApps, waiting, switchTo } = useOpenApps();
  const openApp = (appId: string) => openCatalog(appId);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  // Leaving the tab clears the search and filter, so coming back starts fresh.
  useFocusEffect(
    useCallback(
      () => () => {
        setQuery("");
        setFilter("All");
      },
      [],
    ),
  );
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const featured = getMiniApp(featuredAppId);
  const recent = getMiniApps(recentAppIds);
  const needle = query.trim().toLowerCase();
  const browsing = filter === "All" && !needle;

  const results = useMemo(
    () =>
      [...miniApps]
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(
          (app) =>
            (filter === "All" || app.category === filter) &&
            (!needle || `${app.name} ${app.detail}`.toLowerCase().includes(needle)),
        ),
    [filter, needle],
  );

  const claimReward = () => {
    setRewardClaimed(true);
    toast("Daily reward claimed");
  };

  return (
    <Screen>
      <PageTitle
        title="Mini apps"
        aside={
          <Text size={12.5} color={colors.muted}>
            {miniApps.length} apps
          </Text>
        }
      />

      <View style={styles.gutter}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search apps and services"
          accessibilityLabel="Search mini apps"
        />
      </View>

      <View style={styles.filters} accessibilityLabel="App categories">
        {filters.map((item) => {
          const active = filter === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(item)}
              style={[
                styles.chip,
                active
                  ? { backgroundColor: colors.chipActive, borderColor: colors.chipActive }
                  : { borderColor: colors.line },
              ]}
            >
              <Text
                weight={active ? "semibold" : "medium"}
                size={13}
                color={active ? colors.chipActiveInk : colors.label}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {browsing && featured && (
        <View style={styles.cardGutter}>
          <View style={[styles.panel, { backgroundColor: colors.panel, borderColor: colors.panelBorder }]}>
            <CardRings color={colors.panelInk} size="sm" />
            <View style={styles.row}>
              <AppIcon app={featured} size={56} radius={16} bordered={false} />
              <View style={styles.flex}>
                <Text weight="semibold" size={10} tracking={0.09} color={colors.panelInk} style={styles.faint}>
                  FEATURED
                </Text>
                <Text weight="semibold" size={16} tracking={-0.01} color={colors.panelInk} style={styles.featuredName}>
                  {featured.name}
                </Text>
                <Text size={12.5} color={colors.panelInk} numberOfLines={1} style={styles.dim}>
                  {featured.detail}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${featured.name}`}
                onPress={() => openApp(featured.id)}
                style={[styles.openSolid, { backgroundColor: colors.primary }]}
              >
                <Text weight="semibold" size={13} color={colors.onPrimary}>
                  Open
                </Text>
              </Pressable>
            </View>

            <View style={[styles.panelLine, { backgroundColor: colors.panelInk }]} />

            <View style={[styles.row, styles.reward]}>
              <Gift size={17} color={colors.panelInk} strokeWidth={1.8} />
              <Text weight="medium" size={13.5} color={colors.panelInk} numberOfLines={1} style={styles.flex}>
                {rewardClaimed ? "Reward claimed" : "Daily reward is ready"}
                <Text size={13.5} color={colors.panelInk} style={styles.faint}>
                  {" "}
                  · {rewardClaimed ? "come back tomorrow" : "points or airtime"}
                </Text>
              </Text>
              {!rewardClaimed && (
                <Pressable accessibilityRole="button" onPress={claimReward} style={styles.claim}>
                  <Text weight="semibold" size={13.5} color={colors.panelInk}>
                    Claim
                  </Text>
                  <ChevronRight size={15} color={colors.panelInk} strokeWidth={2} />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      )}

      {browsing && openApps.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Open now" />
          <View style={styles.recentRow}>
            {openApps.map((app) => (
              <Pressable
                key={app.id}
                accessibilityRole="button"
                accessibilityLabel={`Return to ${app.name}${waiting[app.id] ? ", waiting for your approval" : ""}`}
                onPress={() => switchTo(app.id)}
                style={styles.recent}
              >
                <View>
                  <HostedAppIcon app={app} size={56} radius={16} glyphSize={22} />
                  {!!waiting[app.id] && <View style={[styles.waitingDot, { backgroundColor: colors.danger, borderColor: colors.bg }]} />}
                </View>
                <Text size={12.5} color={colors.label} numberOfLines={1}>
                  {app.catalog?.shortName ?? app.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {browsing && (
        <View style={styles.section}>
          <SectionHeader title="Recent" />
          <View style={styles.recentRow}>
            {recent.map((app) => (
              <Pressable
                key={app.id}
                accessibilityRole="button"
                accessibilityLabel={`Open ${app.name}`}
                onPress={() => openApp(app.id)}
                style={styles.recent}
              >
                <AppIcon app={app} size={56} />
                <Text size={12.5} color={colors.label} numberOfLines={1}>
                  {app.shortName}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <SectionHeader
          title={browsing ? "All apps" : "Results"}
          action={
            <Text size={12.5} color={colors.muted}>
              {browsing ? "A to Z" : `${results.length} ${results.length === 1 ? "app" : "apps"}`}
            </Text>
          }
        />
        {results.length > 0 ? (
          <ListCard>
            {results.map((app) => (
              <View key={app.id} style={styles.appRow}>
                <AppIcon app={app} size={44} glyphSize={19} />
                <View style={styles.flex}>
                  <Text weight="medium">{app.name}</Text>
                  <Text size={12.5} color={colors.muted} numberOfLines={1} style={styles.sub}>
                    {app.category} · {app.detail}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${app.name}`}
                  onPress={() => openApp(app.id)}
                  style={[styles.openOutline, { borderColor: colors.line }]}
                >
                  <Text weight="semibold" size={12.5}>
                    Open
                  </Text>
                </Pressable>
              </View>
            ))}
          </ListCard>
        ) : (
          <View style={[styles.empty, { backgroundColor: colors.list, borderColor: colors.line }]}>
            <LayoutGrid size={28} color={colors.muted} strokeWidth={1.6} />
            <Text weight="semibold" size={14} style={styles.emptyTitle}>
              No apps found
            </Text>
            <Text size={12.5} color={colors.muted} style={styles.sub}>
              Try another search or category.
            </Text>
          </View>
        )}
      </View>
      {__DEV__ && browsing && (
        <View style={styles.section}>
          <SectionHeader title="Developer" />
          <ListCard>
            <View style={styles.appRow}>
              <View style={[styles.devIcon, { backgroundColor: colors.chip }]}>
                <FlaskConical size={19} color={colors.ink} strokeWidth={1.8} />
              </View>
              <View style={styles.flex}>
                <Text weight="medium">Test Mini App</Text>
                <Text size={12.5} color={colors.muted} numberOfLines={1} style={styles.sub}>
                  {testMiniAppUrl}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open Test Mini App"
                onPress={() => openUrl(testMiniAppUrl, "Test Mini App")}
                style={[styles.openOutline, { borderColor: colors.line }]}
              >
                <Text weight="semibold" size={12.5}>
                  Open
                </Text>
              </Pressable>
            </View>
          </ListCard>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  waitingDot: { position: "absolute", top: -3, right: -3, width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  dim: { opacity: 0.7, marginTop: 1 },
  faint: { opacity: 0.6 },
  gutter: { marginTop: 16, paddingHorizontal: 20 },
  filters: { marginTop: 12, paddingHorizontal: 20, flexDirection: "row", gap: 8 },
  chip: { height: 32, borderRadius: 999, borderWidth: 1, paddingHorizontal: 16, justifyContent: "center" },
  cardGutter: { marginTop: 16, paddingHorizontal: 16 },
  panel: { borderRadius: 28, borderWidth: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16, overflow: "hidden" },
  featuredName: { marginTop: 2 },
  openSolid: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  panelLine: { marginTop: 16, height: 1, opacity: 0.1 },
  reward: { marginTop: 14, gap: 10 },
  claim: { flexDirection: "row", alignItems: "center", gap: 2 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  recentRow: { marginTop: 12, flexDirection: "row", justifyContent: "space-between" },
  recent: { width: "24%", alignItems: "center", gap: 8 },
  appRow: { height: 62, flexDirection: "row", alignItems: "center", gap: 14 },
  sub: { marginTop: 1 },
  devIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  openOutline: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  empty: { marginTop: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 24, paddingVertical: 40, alignItems: "center" },
  emptyTitle: { marginTop: 12 },
});
