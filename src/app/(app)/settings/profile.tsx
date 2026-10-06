import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/Button";
import { StackScreen } from "@/components/StackScreen";
import { Text } from "@/components/Text";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/Toast";
import { initials } from "@/data/profile";
import { parseRecipient } from "@/data/recipient";
import { useTheme } from "@/theme/ThemeProvider";
import { useWallet, useWalletData } from "@/wallet/WalletProvider";

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { updateProfile } = useWallet();
  const { profile } = useWalletData();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);

  const emailOk = parseRecipient(email)?.kind === "email";
  const phoneOk = !phone.trim() || parseRecipient(phone)?.kind === "phone";
  const changed = name.trim() !== profile.name || email.trim().toLowerCase() !== profile.email || phone.trim() !== profile.phone;
  const ready = name.trim().length > 0 && emailOk && phoneOk && changed;

  const save = () => {
    updateProfile({ name: name.trim(), email: email.trim().toLowerCase(), phone: parseRecipient(phone)?.value ?? "" });
    toast("Profile saved");
    router.back();
  };

  return (
    <StackScreen title="Edit profile" footer={<Button label="Save" onPress={save} disabled={!ready} />}>
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text weight="semibold" size={26} color={colors.onPrimary}>
            {initials(name)}
          </Text>
        </View>
      </View>
      <View style={styles.form}>
        <TextField label="Name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" error={!name.trim() ? "Add your name" : null} />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          hint="People can pay you with this email"
          error={email && !emailOk ? "Enter a valid email" : null}
        />
        <TextField
          label="Phone (optional)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
          hint="Include your country code"
          error={!phoneOk ? "Enter a number with its country code" : null}
        />
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  avatarWrap: { alignItems: "center", paddingTop: 8 },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center" },
  form: { paddingHorizontal: 20, paddingTop: 28, gap: 20 },
});
