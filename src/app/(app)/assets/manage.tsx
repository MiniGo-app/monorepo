import { Asset, StrKey } from "@stellar/stellar-base";
import { useRouter } from "expo-router";
import { CircleAlert, Info, Plus, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { spendableXlm } from "@minigo/wallet-sdk/core/horizon.ts";
import { AssetIcon } from "@/components/AssetIcon";
import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";
import { PinSheet } from "@/components/PinSheet";
import { Section } from "@/components/Section";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { USDC, describeAsset, formatAmount, keyOf, walletAssets } from "@/stellar/assets";
import { useTheme } from "@/theme/ThemeProvider";
import { errorMessage, useChain, useWallet } from "@/wallet/WalletProvider";

// Assets are trustlines on the network: adding one reserves the network's base reserve (0.5 XLM today), and
// removing it (at zero balance) frees it. The amount is read from the network, not assumed.

type Pending = { asset: Asset; remove: boolean };

const CODE_PATTERN = /^[A-Za-z0-9]{1,12}$/;

export default function ManageAssetsScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const { changeTrust } = useWallet();
  const { account } = useChain();
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [issuer, setIssuer] = useState("");
  const assets = walletAssets(account);
  const funded = !!account?.exists;
  const hasUsdc = assets.some((asset) => asset.key === keyOf(USDC));
  const reserve = funded ? account.baseReserve : 0.5;
  const canReserve = funded && spendableXlm(account) >= reserve;

  const trimmedCode = code.trim().toUpperCase();
  const trimmedIssuer = issuer.trim().toUpperCase();
  const codeError = trimmedCode && !CODE_PATTERN.test(trimmedCode) ? "1–12 letters or digits" : null;
  const issuerError = trimmedIssuer && !StrKey.isValidEd25519PublicKey(trimmedIssuer) ? "Not a valid Stellar address" : null;
  const custom = trimmedCode && trimmedIssuer && !codeError && !issuerError ? new Asset(trimmedCode, trimmedIssuer) : null;
  const customExists = custom ? assets.some((asset) => asset.key === keyOf(custom)) : false;

  const run = async () => {
    if (!pending) return;
    const { asset, remove } = pending;
    const name = describeAsset(asset).name;
    setPending(null);
    setBusy(keyOf(asset));
    try {
      await changeTrust(asset, remove);
      toast(remove ? `${name} removed` : `${name} added`);
      if (!remove && asset !== USDC) {
        setCode("");
        setIssuer("");
      }
    } catch (error) {
      toast(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <StackScreen title="Manage assets">
      {!funded && (
        <View style={styles.notice}>
          <Notice icon={Info}>Your account isn&apos;t on the network yet. Get test XLM from Home or Receive first, then add assets.</Notice>
        </View>
      )}

      <Section title="In your wallet" footer={`Each asset besides XLM reserves ${reserve} XLM. You can remove an asset once its balance is zero.`}>
        {assets.map((asset) => {
          const removable = !asset.isNative && asset.balance === 0;
          const working = busy === asset.key;
          return (
            <View key={asset.key} style={styles.row}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/assets/[assetId]", params: { assetId: asset.key } })}
                style={styles.open}
              >
                <AssetIcon code={asset.code} issuer={asset.issuer} isNative={asset.isNative} size={38} />
                <View style={styles.text}>
                  <Text weight="medium">{asset.name}</Text>
                  <Text size={12.5} color={colors.muted} style={styles.sub} numberOfLines={1}>
                    {formatAmount(asset.code, asset.balance)} · {asset.detail}
                  </Text>
                </View>
              </Pressable>
              {working ? (
                <ActivityIndicator color={colors.muted} />
              ) : (
                removable && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${asset.name}`}
                    hitSlop={10}
                    onPress={() => setPending({ asset: new Asset(asset.code, asset.issuer!), remove: true })}
                  >
                    <Trash2 size={18} color={colors.danger} strokeWidth={1.8} />
                  </Pressable>
                )
              )}
            </View>
          );
        })}
      </Section>

      {!hasUsdc && (
        <Section title="Suggested">
          <View style={styles.row}>
            <AssetIcon code="USDC" issuer={USDC.getIssuer()} size={38} />
            <View style={styles.text}>
              <Text weight="medium">USDC</Text>
              <Text size={12.5} color={colors.muted} style={styles.sub}>
                USD Coin · Circle
              </Text>
            </View>
            {busy === keyOf(USDC) ? (
              <ActivityIndicator color={colors.muted} />
            ) : (
              <Button label="Add" icon={Plus} size="md" disabled={!canReserve} onPress={() => setPending({ asset: USDC, remove: false })} />
            )}
          </View>
        </Section>
      )}

      <View style={styles.custom}>
        <Text weight="medium" size={12.5} color={colors.muted} accessibilityRole="header">
          Add another asset
        </Text>
        <TextField label="Asset code" value={code} onChangeText={setCode} placeholder="e.g. AQUA" autoCapitalize="characters" autoCorrect={false} error={codeError} />
        <TextField
          label="Issuer"
          value={issuer}
          onChangeText={setIssuer}
          placeholder="G…"
          autoCapitalize="characters"
          autoCorrect={false}
          error={issuerError}
          hint={customExists ? "Already in your wallet" : "The issuer's Stellar address, from the asset's website"}
        />
        {!canReserve && funded && (
          <Notice icon={CircleAlert} tone="warning">
            You need at least {reserve} XLM free to add an asset.
          </Notice>
        )}
        <Button
          label="Add asset"
          icon={Plus}
          variant="secondary"
          loading={!!custom && busy === keyOf(custom)}
          disabled={!custom || customExists || !canReserve}
          onPress={() => custom && setPending({ asset: custom, remove: false })}
        />
      </View>

      <PinSheet
        visible={!!pending}
        title={pending?.remove ? "Remove asset" : "Add asset"}
        subtitle={pending ? `${pending.remove ? "Remove" : "Add"} ${describeAsset(pending.asset).name}${pending.remove ? ` and free ${reserve} XLM` : ` · reserves ${reserve} XLM`}` : undefined}
        onClose={() => setPending(null)}
        onVerified={run}
      />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  notice: { paddingHorizontal: 20, paddingTop: 8 },
  row: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 14 },
  open: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14, alignSelf: "stretch" },
  text: { flex: 1 },
  sub: { marginTop: 1 },
  custom: { marginTop: 28, paddingHorizontal: 20, gap: 14 },
});
