import { useLocalSearchParams, useRouter } from "expo-router";
import { CircleAlert, Info, LockKeyhole, RefreshCw } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { buildPayment } from "@minigo/wallet-sdk/core/horizon.ts";
import { Button } from "@/components/Button";
import { ListCard } from "@/components/ListCard";
import { Notice } from "@/components/Notice";
import { PinSheet } from "@/components/PinSheet";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { displayRecipient, parseRecipient } from "@/data/recipient";
import { assetFromKey, describeAsset, formatAmount } from "@/stellar/assets";
import { NETWORK } from "@/stellar/network";
import { useTheme } from "@/theme/ThemeProvider";
import { errorMessage, useChain, useWallet, useWalletData } from "@/wallet/WalletProvider";

const MEMO_LIMIT = 28;

type Check = { state: "checking" } | { state: "ok"; createsAccount: boolean } | { state: "error"; message: string };

export default function ReviewScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { send } = useWallet();
  const { address } = useWalletData();
  const { account } = useChain();
  const minimumNewAccount = 2 * (account?.exists ? account.baseReserve : 0.5);
  const params = useLocalSearchParams<{ to: string; asset: string; amount: string; memo?: string }>();
  const [memo, setMemo] = useState(params.memo ?? "");
  const [pinOpen, setPinOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [check, setCheck] = useState<Check>({ state: "checking" });
  const [attempt, setAttempt] = useState(0);
  const recipient = parseRecipient(params.to ?? "");
  const asset = assetFromKey(params.asset ?? "XLM");
  const amount = params.amount ?? "0";
  const code = asset ? describeAsset(asset).name : "";

  // Ask the network up front whether this payment can go through.
  useEffect(() => {
    if (!recipient || recipient.kind !== "address" || !asset) return;
    let alive = true;
    buildPayment(NETWORK, { source: address, to: recipient.value, asset, amount })
      .then((plan) => alive && setCheck({ state: "ok", createsAccount: plan.createsAccount }))
      .catch((error) => alive && setCheck({ state: "error", message: errorMessage(error) }));
    return () => {
      alive = false;
    };
    // Recompute only when the payment itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, params.to, params.asset, amount, attempt]);

  if (!recipient || recipient.kind !== "address" || !asset || !(Number(amount) > 0)) {
    return (
      <StackScreen title="Review">
        <Text color={colors.muted} style={styles.invalid}>
          Something&apos;s missing from this payment. Go back and try again.
        </Text>
      </StackScreen>
    );
  }

  const rows = [
    { label: "To", value: displayRecipient(recipient) },
    { label: "Asset", value: code },
    { label: "Network", value: NETWORK.network === "TESTNET" ? "Stellar testnet" : "Stellar" },
    { label: "Network fee", value: "≤ 0.0001 XLM" },
    { label: "Arrives", value: "In about 5 seconds" },
  ];

  const submit = async () => {
    setPinOpen(false);
    setSending(true);
    try {
      const { hash } = await send({ to: recipient.value, asset, amount, memo: memo.trim() || undefined });
      router.replace({ pathname: "/send/done", params: { hash, to: recipient.value, amount, code } });
    } catch (error) {
      toast(errorMessage(error));
      setSending(false);
    }
  };

  return (
    <StackScreen
      title="Review"
      footer={
        <Button
          label={sending ? "Sending…" : `Send ${formatAmount(code, Number(amount))}`}
          icon={LockKeyhole}
          onPress={() => setPinOpen(true)}
          disabled={check.state !== "ok"}
          loading={sending}
        />
      }
    >
      <View style={styles.hero}>
        <Text size={14} color={colors.muted}>
          You&apos;re sending
        </Text>
        <Text weight="medium" size={44} tracking={-0.04} style={styles.amount} adjustsFontSizeToFit numberOfLines={1}>
          {formatAmount(code, Number(amount))}
        </Text>
      </View>

      <View style={styles.body}>
        <ListCard>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text size={14} color={colors.muted}>
                {row.label}
              </Text>
              <Text size={14} weight="medium" numberOfLines={1} style={styles.value}>
                {row.value}
              </Text>
            </View>
          ))}
        </ListCard>

        <TextField
          label="Memo (optional)"
          value={memo}
          onChangeText={(value) => setMemo(value.slice(0, MEMO_LIMIT))}
          placeholder="What's it for?"
          hint={`${memo.length}/${MEMO_LIMIT} · visible on the network. Exchanges often need one.`}
        />

        {check.state === "checking" && (
          <View style={styles.checking}>
            <ActivityIndicator color={colors.muted} />
            <Text size={13} color={colors.muted}>
              Checking the recipient…
            </Text>
          </View>
        )}
        {check.state === "ok" && check.createsAccount && (
          <Notice icon={Info}>This address has no Stellar account yet. Your payment will create it (minimum {minimumNewAccount} XLM).</Notice>
        )}
        {check.state === "error" && (
          <>
            <Notice icon={CircleAlert} tone="danger">
              {check.message}
            </Notice>
            <Button
              label="Check again"
              icon={RefreshCw}
              variant="secondary"
              size="md"
              onPress={() => {
                setCheck({ state: "checking" });
                setAttempt((n) => n + 1);
              }}
            />
          </>
        )}
      </View>

      <PinSheet
        visible={pinOpen}
        title="Confirm payment"
        subtitle={`${formatAmount(code, Number(amount))} to ${displayRecipient(recipient, true)}`}
        onClose={() => setPinOpen(false)}
        onVerified={submit}
      />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  invalid: { paddingHorizontal: 20, paddingTop: 24, textAlign: "center" },
  hero: { alignItems: "center", paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  amount: { marginTop: 6, lineHeight: 52, fontVariant: ["tabular-nums"] },
  body: { paddingHorizontal: 20, gap: 20 },
  row: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  value: { flexShrink: 1, textAlign: "right" },
  checking: { flexDirection: "row", alignItems: "center", gap: 10 },
});
