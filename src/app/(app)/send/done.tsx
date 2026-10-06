import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ExternalLink } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { formatAmount } from "@/stellar/assets";
import { explorerTxUrl } from "@/stellar/network";
import { useTheme } from "@/theme/ThemeProvider";
import { shortAddress } from "@/wallet/stellar";

export default function SendDoneScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { hash, to, amount, code } = useLocalSearchParams<{ hash: string; to: string; amount: string; code: string }>();
  const [pop] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }).start();
  }, [pop]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.badge,
            { backgroundColor: colors.primary, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }], opacity: pop },
          ]}
        >
          <Check size={40} color={colors.onPrimary} strokeWidth={2.4} />
        </Animated.View>
        <Text weight="semibold" size={16} color={colors.muted} style={styles.label}>
          Sent
        </Text>
        <Text weight="medium" size={44} tracking={-0.04} style={styles.amount} adjustsFontSizeToFit numberOfLines={1}>
          {formatAmount(code ?? "", Number(amount ?? 0))}
        </Text>
        <Text size={15} color={colors.muted} style={styles.to}>
          to {shortAddress(to ?? "", 6, 6)}
        </Text>
        <Text size={12.5} color={colors.muted} style={styles.hash} selectable>
          {hash ? `Transaction ${shortAddress(hash, 8, 8)}` : ""}
        </Text>
      </View>
      <View style={styles.actions}>
        <Button label="Done" onPress={() => router.dismissAll()} />
        {hash && <Button label="View on StellarExpert" icon={ExternalLink} variant="secondary" onPress={() => Linking.openURL(explorerTxUrl(hash))} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  badge: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  label: { marginTop: 28 },
  amount: { marginTop: 6, lineHeight: 52, fontVariant: ["tabular-nums"] },
  to: { marginTop: 6, textAlign: "center" },
  hash: { marginTop: 14 },
  actions: { gap: 10 },
});
