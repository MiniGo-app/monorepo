import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, ChevronDown, TriangleAlert } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { spendableXlm } from "@minigo/wallet-sdk/core/horizon.ts";
import { AssetIcon } from "@/components/AssetIcon";
import { Button } from "@/components/Button";
import { Keypad } from "@/components/Keypad";
import { ListCard } from "@/components/ListCard";
import { Notice } from "@/components/Notice";
import { recipientIcon } from "@/components/recipientIcon";
import { Sheet } from "@/components/Sheet";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { cleanAmount, floorAmount, toStroops } from "@/data/paymentLinkCore";
import { displayRecipient, parseRecipient } from "@/data/recipient";
import { formatAmount, walletAssets } from "@/stellar/assets";
import { useTheme } from "@/theme/ThemeProvider";
import { useChain } from "@/wallet/WalletProvider";

const DECIMALS = 7;

export default function AmountScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ to: string; asset?: string; amount?: string; memo?: string }>();
  const { account } = useChain();
  const recipient = parseRecipient(params.to ?? "");
  const assets = walletAssets(account);
  // A payment code may ask for an asset this wallet doesn't hold. Then nothing is prefilled: the requested amount
  // was in that asset, and silently switching it to XLM would send something else entirely.
  const requestedMissing = !!params.asset && !assets.some((a) => a.key === params.asset);
  const [assetKey, setAssetKey] = useState(requestedMissing || !params.asset ? "XLM" : params.asset);
  const [amount, setAmount] = useState(requestedMissing ? "0" : (cleanAmount(params.amount ?? "0") ?? "0"));
  const [pickerOpen, setPickerOpen] = useState(false);
  const asset = assets.find((a) => a.key === assetKey) ?? assets[0];
  const available = asset.isNative ? (account?.exists ? spendableXlm(account) : 0) : asset.balance;
  const value = Number(amount);
  // In stroops: floating point would call "Max" of 9989.4899999 more than 9989.489999899999 available.
  const tooMuch = toStroops(value) > toStroops(available);

  if (!recipient || recipient.kind !== "address") {
    return (
      <StackScreen title="Send">
        <Text color={colors.muted} style={styles.invalid}>
          Enter a Stellar address to send to.
        </Text>
      </StackScreen>
    );
  }
  const Icon = recipientIcon[recipient.kind];

  const press = (key: string) =>
    setAmount((current) => {
      if (key === ".") return current.includes(".") ? current : `${current}.`;
      const [, fraction] = current.split(".");
      if (fraction !== undefined && fraction.length >= DECIMALS) return current;
      if (current.replace(".", "").length >= 14) return current;
      return current === "0" ? key : current + key;
    });

  const review = () =>
    router.push({
      pathname: "/send/review",
      params: { to: recipient.value, asset: asset.key, amount: cleanAmount(amount) ?? "0", memo: params.memo ?? "" },
    });

  return (
    <StackScreen
      title="Send"
      scroll={false}
      footer={<Button label={tooMuch ? "Not enough balance" : "Review"} onPress={review} disabled={!(value > 0) || tooMuch} />}
    >
      <View style={styles.top}>
        {requestedMissing && (
          <View style={styles.notice}>
            <Notice icon={TriangleAlert} tone="warning">
              This code asks for {params.asset?.split(":")[0]}, which isn&apos;t in your wallet. Add it under Assets first, or choose what to send.
            </Notice>
          </View>
        )}
        <View style={[styles.to, { borderColor: colors.line }]}>
          <Icon size={15} color={colors.ink} strokeWidth={1.9} />
          <Text weight="medium" size={14} numberOfLines={1} style={styles.toText}>
            {displayRecipient(recipient, true)}
          </Text>
        </View>

        <Text
          weight="medium"
          size={54}
          tracking={-0.04}
          color={tooMuch ? colors.danger : colors.ink}
          style={styles.amount}
          adjustsFontSizeToFit
          numberOfLines={1}
          accessibilityLabel={`Amount ${amount} ${asset.code}`}
        >
          {amount}
          <Text weight="medium" size={28} color={colors.muted}>
            {" "}
            {asset.code}
          </Text>
        </Text>

        <Pressable accessibilityRole="button" accessibilityLabel="Change asset" onPress={() => setPickerOpen(true)} style={[styles.assetChip, { backgroundColor: colors.chip }]}>
          <AssetIcon code={asset.code} issuer={asset.issuer} isNative={asset.isNative} size={22} />
          <Text weight="medium" size={13.5}>
            {asset.name}
          </Text>
          <ChevronDown size={14} color={colors.ink} strokeWidth={2} />
        </Pressable>

        <View style={styles.available}>
          <Text size={13} color={tooMuch ? colors.danger : colors.muted}>
            {formatAmount(asset.code, available)} available
          </Text>
          <Pressable accessibilityRole="button" onPress={() => setAmount(floorAmount(available))} hitSlop={8}>
            <Text weight="semibold" size={13}>
              Max
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.pad}>
        <Keypad
          onKey={press}
          onDelete={() => setAmount((current) => (current.length <= 1 ? "0" : current.slice(0, -1)))}
          extra={{ label: "Decimal point", content: <Text weight="medium" size={26}>.</Text>, onPress: () => press(".") }}
        />
      </View>

      <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <Text weight="semibold" size={17} style={styles.sheetTitle}>
          Send from
        </Text>
        <ListCard>
          {assets.map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected: item.key === asset.key }}
              onPress={() => {
                setAssetKey(item.key);
                setAmount("0");
                setPickerOpen(false);
              }}
              style={styles.assetRow}
            >
              <AssetIcon code={item.code} issuer={item.issuer} isNative={item.isNative} size={38} />
              <View style={styles.flex}>
                <Text weight="medium">{item.name}</Text>
                <Text size={12.5} color={colors.muted}>
                  {formatAmount(item.code, item.balance)}
                </Text>
              </View>
              {item.key === asset.key && <Check size={18} color={colors.ink} strokeWidth={2} />}
            </Pressable>
          ))}
        </ListCard>
      </Sheet>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  notice: { alignSelf: "stretch", paddingHorizontal: 20, marginBottom: 16 },
  flex: { flex: 1 },
  invalid: { paddingHorizontal: 20, paddingTop: 24, textAlign: "center" },
  top: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 14 },
  to: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, maxWidth: "90%" },
  toText: { flexShrink: 1 },
  amount: { lineHeight: 64, fontVariant: ["tabular-nums"], alignSelf: "stretch", textAlign: "center" },
  assetChip: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, paddingLeft: 6, paddingRight: 12, paddingVertical: 6 },
  available: { flexDirection: "row", alignItems: "center", gap: 10 },
  pad: { paddingHorizontal: 20, paddingBottom: 4 },
  sheetTitle: { textAlign: "center", marginTop: 4, marginBottom: 4 },
  assetRow: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 14 },
});
