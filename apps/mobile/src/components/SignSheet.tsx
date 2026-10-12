import { CircleAlert, LockKeyhole } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import type { ApprovalRequest } from "@minigo/wallet-sdk/host.ts";
import type { HostedApp } from "@/mini/types";
import { isTestnet } from "@/stellar/network";
import { useTheme } from "@/theme/ThemeProvider";
import { shortAddress } from "@/wallet/stellar";
import { useLockout } from "@/wallet/useLockout";
import { useWallet } from "@/wallet/WalletProvider";
import { Button } from "./Button";
import { HostedAppIcon } from "./HostedAppIcon";
import { ListCard } from "./ListCard";
import { Notice } from "./Notice";
import { PinPad } from "./PinPad";
import { Sheet } from "./Sheet";
import { Text } from "./Text";

export type SignApproval = Extract<ApprovalRequest, { kind: "signTransaction" | "signAuthEntry" | "signMessage" }>;

type SignSheetProps = {
  app: HostedApp;
  request: SignApproval | null;
  onDecline: () => void;
  // Called once the PIN checks out.
  onApprove: () => void;
};

const titles: Record<SignApproval["kind"], string> = {
  signTransaction: "wants you to sign a transaction",
  signAuthEntry: "wants you to authorize a contract call",
  signMessage: "wants you to sign a message",
};

// Signing sends nothing by itself. The mini app submits what it gets back.
export function SignSheet({ app, request, onDecline, onApprove }: SignSheetProps) {
  const { colors } = useTheme();
  const { verifyPin } = useWallet();
  const lockout = useLockout();
  const [step, setStep] = useState<"review" | "pin">("review");

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
            <Text weight="semibold" size={17} tracking={-0.01} style={styles.center}>
              {app.name} {titles[request.kind]}
            </Text>
            <Text size={12.5} color={colors.muted} style={styles.center}>
              {isTestnet ? "Stellar testnet" : "Stellar"}
            </Text>
          </View>

          {request.kind === "signTransaction" && (
            <>
              {request.summary.risky && (
                <View style={styles.gap}>
                  <Notice icon={CircleAlert} tone="danger">
                    This transaction can change who controls your account or close it. Only sign if you fully trust {app.name}.
                  </Notice>
                </View>
              )}
              {!request.summary.sourceIsYou && (
                <View style={styles.gap}>
                  <Notice icon={CircleAlert}>
                    {request.summary.usesYourAccount
                      ? "Another account built this transaction. Signing lets it act for your account where it says “from your account”."
                      : "Another account built this transaction, and none of its steps use your account."}
                  </Notice>
                </View>
              )}
              <ListCard>
                {request.summary.operations.map((line, index) => (
                  <View key={index} style={styles.line}>
                    <Text size={14}>{line}</Text>
                  </View>
                ))}
                <Detail label="Built by" value={request.summary.sourceIsYou ? "Your account" : shortAddress(request.summary.source, 6, 6)} />
                {request.summary.memo ? <Detail label="Memo" value={request.summary.memo} /> : null}
                <Detail label="Max fee" value={`${request.summary.fee} XLM`} />
              </ListCard>
            </>
          )}

          {request.kind === "signMessage" && (
            <ListCard>
              <ScrollView style={styles.message} nestedScrollEnabled>
                <Text size={14} style={styles.messageText}>
                  {request.message}
                </Text>
              </ScrollView>
            </ListCard>
          )}

          {request.kind === "signAuthEntry" && (
            <>
              <View style={styles.gap}>
                <Notice icon={CircleAlert} tone="warning">
                  An authorization can let a contract move your funds, for example a token transfer. Only sign what you understand.
                </Notice>
              </View>
              <ListCard>
                <Detail
                  label="Action"
                  value={request.details.functionName ? `${request.details.functionName}()` : "Contract action"}
                />
                {request.details.contract ? <Detail label="Contract" value={shortAddress(request.details.contract, 6, 6)} /> : null}
                {request.details.args.map((arg, index) => (
                  <Detail key={index} label={`Argument ${index + 1}`} value={arg} />
                ))}
                {request.details.nestedCalls > 0 ? (
                  <Detail label="Also authorizes" value={`${request.details.nestedCalls} nested call${request.details.nestedCalls === 1 ? "" : "s"}`} />
                ) : null}
              </ListCard>
            </>
          )}

          <View style={styles.actions}>
            <Button label="Decline" variant="secondary" style={styles.flex} onPress={close} />
            <Button label="Sign" icon={LockKeyhole} style={styles.flex} onPress={() => setStep("pin")} />
          </View>
        </>
      )}
      {request && step === "pin" && (
        <PinPad
          title="Confirm signature"
          subtitle={`For ${app.name}`}
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

function Detail({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text size={14} color={colors.muted}>
        {label}
      </Text>
      <Text size={14} weight="medium" numberOfLines={1} style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: "center" },
  head: { alignItems: "center", gap: 6, paddingTop: 12, paddingBottom: 16 },
  gap: { marginBottom: 12 },
  line: { minHeight: 50, justifyContent: "center", paddingVertical: 10 },
  row: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  value: { flexShrink: 1, textAlign: "right" },
  message: { maxHeight: 160, marginVertical: 12 },
  messageText: { lineHeight: 20 },
  actions: { marginTop: 18, flexDirection: "row", gap: 10 },
});
