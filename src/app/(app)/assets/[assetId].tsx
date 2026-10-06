import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowDownLeft, ArrowUpRight, Copy, Receipt, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AssetIcon } from "@/components/AssetIcon";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ListCard } from "@/components/ListCard";
import { PinSheet } from "@/components/PinSheet";
import { SectionHeader } from "@/components/Screen";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { TxRow } from "@/components/TxRow";
import { assetFromKey, formatAmount, formatUsd, usdValue, USDC, walletAssets } from "@/stellar/assets";
import { isTestnet } from "@/stellar/network";
import { useXlmPrice } from "@/stellar/price";
import { useTheme } from "@/theme/ThemeProvider";
import { shortAddress } from "@/wallet/stellar";
import { errorMessage, useChain, useWallet } from "@/wallet/WalletProvider";

const about = {
  xlm: "XLM (lumens) is Stellar's own currency. It pays network fees and keeps your account open: every account holds a small reserve.",
  usdc: "USDC is a digital dollar issued by Circle, redeemable 1:1 for US dollars.",
  other: "An asset you added. Only hold assets from issuers you trust: anyone can issue one on Stellar.",
};

export default function AssetScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const { assetId } = useLocalSearchParams<{ assetId: string }>();
  const { account, history } = useChain();
  const { changeTrust } = useWallet();
  const price = useXlmPrice();
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const asset = walletAssets(account).find((item) => item.key === assetId);

  if (!asset) {
    return (
      <StackScreen title="Asset">
        <View style={styles.body}>
          <EmptyState icon={Receipt} title="Not in your wallet" body="Add this asset in Manage assets to hold it." />
        </View>
      </StackScreen>
    );
  }

  const reserve = account?.exists ? account.baseReserve : 0.5;
  const isUsdc = asset.key !== "XLM" && assetFromKey(asset.key)?.equals(USDC);
  const value = usdValue(asset, price);
  const activity = history.filter((tx) => tx.asset.code === asset.code && (tx.asset.issuer ?? undefined) === asset.issuer);
  const details = [
    { label: "Code", value: asset.code },
    { label: "Network", value: isTestnet ? "Stellar testnet" : "Stellar" },
    ...(asset.issuer ? [{ label: "Issuer", value: shortAddress(asset.issuer, 6, 6), copy: asset.issuer }] : []),
    ...(asset.isNative && price !== null ? [{ label: "Price", value: `${formatUsd(price)} per XLM` }] : []),
  ];

  const remove = async () => {
    setConfirming(false);
    setRemoving(true);
    try {
      await changeTrust(assetFromKey(asset.key)!, true);
      toast(`${asset.name} removed`);
      router.back();
    } catch (error) {
      toast(errorMessage(error));
      setRemoving(false);
    }
  };

  return (
    <StackScreen title={asset.name}>
      <View style={styles.hero}>
        <AssetIcon code={asset.code} issuer={asset.issuer} isNative={asset.isNative} size={56} />
        <Text weight="medium" size={38} tracking={-0.035} style={styles.amount} adjustsFontSizeToFit numberOfLines={1}>
          {formatAmount(asset.code, asset.balance)}
        </Text>
        {value !== null && !isUsdc && (
          <Text size={14} color={colors.muted}>
            ≈ {formatUsd(value)}
          </Text>
        )}
        <View style={styles.actions}>
          <Button label="Send" icon={ArrowUpRight} size="md" style={styles.action} onPress={() => router.navigate("/send")} />
          <Button label="Receive" icon={ArrowDownLeft} size="md" variant="secondary" style={styles.action} onPress={() => router.push("/receive")} />
        </View>
      </View>

      <View style={styles.body}>
        <SectionHeader title="Activity" />
        {activity.length ? (
          <ListCard>
            {activity.map((tx) => (
              <TxRow key={tx.id} tx={tx} onPress={() => router.push({ pathname: "/activity/[txId]", params: { txId: tx.id } })} />
            ))}
          </ListCard>
        ) : (
          <EmptyState icon={Receipt} title={`No ${asset.code} activity yet`} body={`${asset.name} you send or receive will show up here.`} />
        )}

        <View style={styles.about}>
          <SectionHeader title={`About ${asset.name}`} />
          <Text size={14} color={colors.label} style={styles.aboutText}>
            {asset.isNative ? about.xlm : isUsdc ? about.usdc : about.other}
          </Text>
          <ListCard>
            {details.map((row) => (
              <View key={row.label} style={styles.row}>
                <Text size={14} color={colors.muted}>
                  {row.label}
                </Text>
                <View style={styles.value}>
                  <Text size={14} weight="medium">
                    {row.value}
                  </Text>
                  {"copy" in row && row.copy && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Copy ${row.label}`}
                      hitSlop={10}
                      onPress={async () => {
                        await Clipboard.setStringAsync(row.copy);
                        toast("Issuer copied");
                      }}
                    >
                      <Copy size={14} color={colors.muted} strokeWidth={1.8} />
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </ListCard>
        </View>

        {!asset.isNative && (
          <View style={styles.remove}>
            <Button
              label={`Remove ${asset.name}`}
              icon={Trash2}
              variant="danger"
              size="md"
              loading={removing}
              disabled={asset.balance > 0}
              onPress={() => setConfirming(true)}
            />
            <Text size={12.5} color={colors.muted} style={styles.removeHint}>
              {asset.balance > 0 ? `Send or swap your ${asset.code} first. Only an empty asset can be removed.` : `Frees the ${reserve} XLM this asset reserves.`}
            </Text>
          </View>
        )}
      </View>

      <PinSheet
        visible={confirming}
        title="Remove asset"
        subtitle={`Remove ${asset.name} and free ${reserve} XLM`}
        onClose={() => setConfirming(false)}
        onVerified={remove}
      />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingHorizontal: 24, paddingTop: 8, gap: 8 },
  amount: { marginTop: 8, lineHeight: 44, fontVariant: ["tabular-nums"] },
  actions: { marginTop: 12, flexDirection: "row", gap: 10, alignSelf: "stretch" },
  action: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 28 },
  about: { marginTop: 28 },
  aboutText: { marginTop: 8, marginBottom: 2, lineHeight: 21 },
  row: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  value: { flexDirection: "row", alignItems: "center", gap: 8 },
  remove: { marginTop: 28, gap: 8 },
  removeHint: { textAlign: "center", lineHeight: 18 },
});
