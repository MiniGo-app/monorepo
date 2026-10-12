import { ChevronDown, FileText, Mail, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { ListCard } from "@/components/ListCard";
import { Row } from "@/components/Row";
import { Section } from "@/components/Section";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/theme/ThemeProvider";
import { cloudProvider } from "@/wallet/cloud";

const faqs = [
  {
    q: "How does the backup work?",
    a: `When you sign up, MiniGo makes a 12-word recovery phrase on your phone, encrypts it and saves it to a private app folder in your ${cloudProvider.name}. There's no password to remember: your Google account protects it, so keep that account secure.`,
  },
  {
    q: "What if I lose my phone?",
    a: `Install MiniGo on the new phone, choose "I already have a wallet" and restore from ${cloudProvider.name} by signing in to the same Google account. You can also type your recovery phrase.`,
  },
  {
    q: "What can I hold and send?",
    a: "XLM, USDC and any other Stellar asset you add in Profile → Manage assets. MiniGo is on Stellar testnet for now, so balances are test money with no value. Sending to an email or phone number is coming later; for now, use a Stellar address.",
  },
  {
    q: "What can a mini app see?",
    a: "Nothing, until you connect. After that it can see your wallet address and ask for payments or signatures. You approve each one with your PIN, and you can disconnect any time in Profile → Connected apps.",
  },
];

export default function HelpScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <StackScreen title="Help & support">
      <View style={styles.body}>
        <Text weight="medium" size={12.5} color={colors.muted}>
          Common questions
        </Text>
        <ListCard>
          {faqs.map((faq, index) => {
            const expanded = open === index;
            return (
              <View key={faq.q}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => setOpen(expanded ? null : index)}
                  style={styles.question}
                >
                  <Text weight="medium" style={styles.flex}>
                    {faq.q}
                  </Text>
                  <ChevronDown size={17} color={colors.muted} strokeWidth={2} style={expanded ? styles.flip : undefined} />
                </Pressable>
                {expanded && (
                  <Text size={14} color={colors.label} style={styles.answer}>
                    {faq.a}
                  </Text>
                )}
              </View>
            );
          })}
        </ListCard>
      </View>

      <Section title="Contact">
        <Row
          icon={Mail}
          label="Email support"
          detail="support@minigo.app · replies within a day"
          onPress={() => Linking.openURL("mailto:support@minigo.app").catch(() => toast("No email app found"))}
        />
      </Section>

      <Section title="Legal">
        <Row icon={FileText} label="Terms of service" onPress={() => toast("Terms are coming soon")} />
        <Row icon={ShieldCheck} label="Privacy policy" onPress={() => toast("Privacy policy is coming soon")} />
      </Section>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 8 },
  flex: { flex: 1 },
  question: { minHeight: 56, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  flip: { transform: [{ rotate: "180deg" }] },
  answer: { paddingBottom: 16, marginTop: -4, lineHeight: 21 },
});
