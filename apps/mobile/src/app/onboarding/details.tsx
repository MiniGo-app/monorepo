import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { parseRecipient } from "@/data/recipient";
import { useTheme } from "@/theme/ThemeProvider";
import { useOnboarding } from "@/wallet/onboarding";

export default function DetailsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { draft, update } = useOnboarding();
  const [name, setName] = useState(draft?.profile?.name ?? "");
  const [email, setEmail] = useState(draft?.profile?.email ?? "");
  const [phone, setPhone] = useState(draft?.profile?.phone ?? "");
  const [touched, setTouched] = useState(false);
  if (!draft) return <Redirect href="/onboarding" />;

  const emailOk = parseRecipient(email)?.kind === "email";
  const phoneOk = !phone.trim() || parseRecipient(phone)?.kind === "phone";
  const ready = name.trim().length > 0 && emailOk && phoneOk;

  const next = () => {
    setTouched(true);
    if (!ready) return;
    update({ profile: { name: name.trim(), email: email.trim().toLowerCase(), phone: parseRecipient(phone)?.value ?? "" } });
    router.push("/onboarding/pin");
  };

  return (
    <StackScreen footer={<Button label="Continue" onPress={next} disabled={touched && !ready} />}>
      <View style={styles.body}>
        <Text size={13} weight="medium" color={colors.muted}>
          Step 2 of 3
        </Text>
        <Text weight="semibold" size={28} tracking={-0.03} style={styles.title} accessibilityRole="header">
          About you
        </Text>
        <Text size={15} color={colors.muted} style={styles.lead}>
          Your name shows on your profile. Soon, people will also be able to pay you with your email or phone number instead of a long wallet address.
        </Text>
        <View style={styles.form}>
          <TextField label="Name" value={name} onChangeText={setName} placeholder="Your name" autoComplete="name" textContentType="name" error={touched && !name.trim() ? "Add your name" : null} />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            error={touched && !emailOk ? "Enter a valid email" : null}
          />
          <TextField
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="+234 803 123 4567"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            hint="Include your country code"
            error={touched && !phoneOk ? "Enter a number with its country code" : null}
          />
        </View>
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20 },
  title: { marginTop: 8, lineHeight: 34 },
  lead: { marginTop: 10, lineHeight: 22 },
  form: { marginTop: 28, gap: 20 },
});
