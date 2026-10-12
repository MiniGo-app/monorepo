import { Info, LockKeyhole } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { ApprovalRequest } from "@minigo/wallet-sdk/host.ts";
import { spendableXlm } from "@minigo/wallet-sdk/core/horizon.ts";
import type { HostedApp } from "@/mini/types";
import { formatAmount, walletAssets } from "@/stellar/assets";
import { isTestnet } from "@/stellar/network";
import { useTheme } from "@/theme/ThemeProvider";
import { shortAddress } from "@/wallet/stellar";
import { useLockout } from "@/wallet/useLockout";
import { useChain, useWallet } from "@/wallet/WalletProvider";
import { Button } from "./Button";
import { HostedAppIcon } from "./HostedAppIcon";
import { ListCard } from "./ListCard";
import { Notice } from "./Notice";
import { PinPad } from "./PinPad";
import { Sheet } from "./Sheet";
import { Text } from "./Text";

export type PaymentApproval = Extract<ApprovalRequest, { kind: "payment" }>;

type PaymentSheetProps = {
  app: HostedApp;
  request: PaymentApproval | null;
  onDecline: () => void;
  // Called once the PIN checks out.
  onApprove: () => void;
};

// A mini app's payment request: review first, then the PIN, in one sheet.
export function PaymentSheet({ app, request, onDecline, onApprove }: PaymentSheetProps) {
  const { colors } = useTheme();
  const { verifyPin } = useWallet();
  const { account } = useChain();
  const lockout = useLockout();
  const [step, setStep] = useState<"review" | "pin">("review");
  const code = request?.assetCode ?? "";
  const asset = walletAssets(account).find((item) => item.code === code);
  const available = !asset ? 0 : asset.isNative ? (account?.exists ? spendableXlm(account) : 0) : asset.balance;
  const amount = request ? Number(request.amount) : 0;
  const short = amount > available;

  const close = () => {
    setStep("review");
    onDecline();
  };

  return (
    <Sheet visible={!!request} onClose={close} tall={step === "pin"}>
      {request && step === "review" && (
        <>
          <View style={styles.head}>
            <HostedAppIcon app={app} size={48} radius={14} glyphSize={22} />
            <Text size={14} color={colors.muted} style={styles.center}>
              {app.name} is asking for a payment
            </Text>
            <Text weight="medium" size={40} tracking={-0.04} style={styles.amount} adjustsFontSizeToFit numberOfLines={1}>
              {formatAmount(code, amount)}
            </Text>
          </View>
          <ListCard>
            {[
              { label: "To", value: shortAddress(request.to, 6, 6) },
              { label: "You can spend", value: formatAmount(code, available) },
              ...(asset?.isNative && asset.balance > available
                ? [{ label: "Held in reserve", value: formatAmount(code, asset.balance - available) }]
                : []),
              ...(request.memo ? [{ label: "For", value: request.memo }] : []),
              { label: "Network", value: isTestnet ? "Stellar testnet" : "Stellar" },
              { label: "Network fee", value: "≤ 0.0001 XLM" },
            ].map((row) => (
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
          {request.createsAccount && (
            <View style={styles.notice}>
              <Notice icon={Info}>This address has no Stellar account yet. Your payment will create it.</Notice>
            </View>
          )}
          <View style={styles.actions}>
            <Button label="Decline" variant="secondary" style={styles.flex} onPress={close} />
            <Button
              label={short ? "Not enough" : "Pay"}
              icon={short ? undefined : LockKeyhole}
              style={styles.flex}
              disabled={short}
              onPress={() => setStep("pin")}
            />
          </View>
        </>
      )}
      {request && step === "pin" && (
        <PinPad
          title="Confirm payment"
          subtitle={`${formatAmount(code, amount)} to ${app.name}`}
          notice={lockout}
          disabled={!!lockout}
          onComplete={async (pin) => {
            if (!(await verifyPin(pin))) return false;
            setStep("review");
            onApprove();
          }}
        />
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: "center" },
  head: { alignItems: "center", gap: 8, paddingTop: 12, paddingBottom: 16 },
  amount: { lineHeight: 48, fontVariant: ["tabular-nums"] },
  row: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  value: { flexShrink: 1, textAlign: "right" },
  notice: { marginTop: 12 },
  actions: { marginTop: 18, flexDirection: "row", gap: 10 },
});
