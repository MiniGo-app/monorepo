import { Image, StyleSheet, View } from "react-native";
import { USDC } from "@/stellar/assets";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "./Text";

const logos = {
  xlm: require("../../assets/tokens/xlm.png"),
  usdc: require("../../assets/tokens/usdc.png"),
};

// Anyone can issue a token called USDC, so the USDC logo also checks the issuer.
export function AssetIcon({ code, issuer, isNative, size = 44 }: { code: string; issuer?: string; isNative?: boolean; size?: number }) {
  const { colors } = useTheme();
  const frame = { width: size, height: size, borderRadius: size / 2 };
  const logo = isNative || (code === "XLM" && !issuer) ? logos.xlm : code === "USDC" && issuer === USDC.getIssuer() ? logos.usdc : null;

  if (logo) {
    return (
      <View style={[styles.circle, styles.logoFrame, frame, { borderColor: colors.line }]}>
        <Image source={logo} style={styles.logo} accessibilityIgnoresInvertColors />
      </View>
    );
  }
  return (
    <View style={[styles.circle, frame, { backgroundColor: colors.primary }]}>
      <Text weight="semibold" size={size * 0.36} color={colors.onPrimary}>
        {code.slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoFrame: { backgroundColor: "#FFFFFF", borderWidth: StyleSheet.hairlineWidth * 2 },
  logo: { width: "100%", height: "100%" },
});
