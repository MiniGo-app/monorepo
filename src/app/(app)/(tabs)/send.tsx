import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRouter } from "expo-router";
import { ArrowRight, ClipboardPaste, Info, ScanLine, X } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { ListCard } from "@/components/ListCard";
import { recipientIcon } from "@/components/recipientIcon";
import { PageTitle, Screen, SectionHeader } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { Notice } from "@/components/Notice";
import { displayRecipient, parseRecipient, recipientHint, recipientLabel, type Recipient } from "@/data/recipient";
import { dayLabel } from "@/data/transactions";
import { fonts } from "@/theme/colors";
import { useTheme } from "@/theme/ThemeProvider";
import { useChain } from "@/wallet/WalletProvider";

export default function SendScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const { history } = useChain();
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  // Leaving the tab clears what was typed, so coming back starts a new payment.
  useFocusEffect(
    useCallback(
      () => () => {
        setInput("");
        setFocused(false);
      },
      [],
    ),
  );
  const recipient = parseRecipient(input);
  const hint = recipient ? null : recipientHint(input);

  // Everyone paid before, newest first, as plain identifiers.
  const recent = useMemo(() => {
    const seen = new Set<string>();
    const list: { recipient: Recipient; date: string }[] = [];
    for (const tx of history) {
      const party = tx.counterparty;
      if (tx.kind !== "sent" || party.kind !== "address" || seen.has(party.value)) continue;
      seen.add(party.value);
      list.push({ recipient: { kind: "address", value: party.value }, date: tx.date });
    }
    return list.slice(0, 5);
  }, [history]);

  const sendTo = (to: Recipient) => router.push({ pathname: "/send/amount", params: { kind: to.kind, to: to.value } });

  const paste = async () => {
    const text = (await Clipboard.getStringAsync()).trim();
    if (!text) toast("Clipboard is empty");
    else setInput(text);
  };

  const DetectedIcon = recipient ? recipientIcon[recipient.kind] : null;

  return (
    <Screen>
      <PageTitle
        title="Send"
        aside={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scan QR code"
            onPress={() => router.push("/scan")}
            style={[styles.circleButton, { borderColor: colors.line }]}
          >
            <ScanLine size={18} color={colors.ink} strokeWidth={1.8} />
          </Pressable>
        }
      />

      <View style={styles.gutter}>
        <View style={[styles.field, { backgroundColor: colors.soft, borderColor: focused ? colors.ink : colors.line }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Stellar address, email or phone"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Recipient"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => recipient?.kind === "address" && sendTo(recipient)}
            style={[styles.input, { color: colors.ink }]}
          />
          {input ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear" onPress={() => setInput("")} hitSlop={8}>
              <X size={18} color={colors.muted} strokeWidth={2} />
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" onPress={paste} style={[styles.paste, { borderColor: colors.line, backgroundColor: colors.bg }]}>
              <ClipboardPaste size={14} color={colors.ink} strokeWidth={1.8} />
              <Text weight="semibold" size={12.5}>
                Paste
              </Text>
            </Pressable>
          )}
        </View>

        {recipient && recipient.kind !== "address" ? (
          <View style={styles.notice}>
            <Notice icon={Info}>
              Sending to {recipient.kind === "email" ? "an email" : "a phone number"} is coming soon. For now, paste the person&apos;s Stellar address (starts with G).
            </Notice>
          </View>
        ) : recipient && DetectedIcon ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Send to ${recipient.value}`}
            onPress={() => sendTo(recipient)}
            style={[styles.detected, { backgroundColor: colors.primary }]}
          >
            <View style={[styles.detectedIcon, { backgroundColor: colors.onPrimary }]}>
              <DetectedIcon size={16} color={colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.flex}>
              <Text size={12} color={colors.onPrimary} style={styles.dim}>
                {recipientLabel[recipient.kind]}
              </Text>
              <Text weight="semibold" color={colors.onPrimary} numberOfLines={1}>
                {displayRecipient(recipient)}
              </Text>
            </View>
            <ArrowRight size={18} color={colors.onPrimary} strokeWidth={2} />
          </Pressable>
        ) : (
          hint && (
            <Text size={12.5} color={colors.muted} style={styles.hint}>
              {hint}
            </Text>
          )
        )}
      </View>

      {recent.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Recent" />
          <ListCard>
            {recent.map(({ recipient: item, date }) => {
              const Icon = recipientIcon[item.kind];
              return (
                <Pressable
                  key={item.value}
                  accessibilityRole="button"
                  accessibilityLabel={`Send to ${item.value}`}
                  onPress={() => sendTo(item)}
                  style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}
                >
                  <View style={[styles.recentIcon, { backgroundColor: colors.chip }]}>
                    <Icon size={18} color={colors.ink} strokeWidth={1.8} />
                  </View>
                  <View style={styles.flex}>
                    <Text weight="medium" numberOfLines={1}>
                      {displayRecipient(item)}
                    </Text>
                    <Text size={12.5} color={colors.muted} style={styles.sub}>
                      {recipientLabel[item.kind]} · last sent {dayLabel(date).toLowerCase()}
                    </Text>
                  </View>
                  <ArrowRight size={17} color={colors.muted} strokeWidth={2} />
                </Pressable>
              );
            })}
          </ListCard>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.6 },
  dim: { opacity: 0.7 },
  circleButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  gutter: { marginTop: 16, paddingHorizontal: 20 },
  field: { height: 52, borderRadius: 16, borderWidth: 1, paddingLeft: 16, paddingRight: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, minWidth: 0, height: "100%", fontFamily: fonts.regular, fontSize: 15, padding: 0, outlineWidth: 0 },
  paste: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  hint: { marginTop: 8, paddingHorizontal: 4 },
  notice: { marginTop: 10 },
  detected: { marginTop: 10, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  detectedIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  section: { marginTop: 24, paddingHorizontal: 20 },
  recentRow: { height: 62, flexDirection: "row", alignItems: "center", gap: 14 },
  recentIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  sub: { marginTop: 1 },
});
