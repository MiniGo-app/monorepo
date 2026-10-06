import { Check, Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_PASSWORD_LENGTH, passwordStrength } from "@/wallet/backup";
import { Text } from "./Text";
import { TextField } from "./TextField";

export type PasswordFormState = { password: string; ready: boolean };

// New backup password: entry, confirmation, strength and the "we can't reset it" acknowledgement.
export function PasswordForm({ onChange }: { onChange: (state: PasswordFormState) => void }) {
  const { colors } = useTheme();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const strength = passwordStrength(password);
  const meterColor = !strength.acceptable ? colors.danger : strength.score >= 4 ? colors.ink : colors.label;
  const mismatch = confirm.length > 0 && confirm !== password;

  const emit = (next: { password?: string; confirm?: string; understood?: boolean }) => {
    const p = next.password ?? password;
    const c = next.confirm ?? confirm;
    const u = next.understood ?? understood;
    onChange({ password: p, ready: passwordStrength(p).acceptable && p === c && u });
  };

  const eye = (
    <Pressable accessibilityRole="button" accessibilityLabel={visible ? "Hide password" : "Show password"} onPress={() => setVisible((v) => !v)} hitSlop={8}>
      {visible ? <EyeOff size={18} color={colors.muted} strokeWidth={1.8} /> : <Eye size={18} color={colors.muted} strokeWidth={1.8} />}
    </Pressable>
  );

  return (
    <View style={styles.form}>
      <View>
        <TextField
          label="Backup password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            emit({ password: value });
          }}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          placeholder="Choose a password"
          right={eye}
        />
        <View style={styles.meter}>
          {[1, 2, 3, 4].map((level) => (
            <View
              key={level}
              style={[styles.bar, { backgroundColor: password && strength.score >= level ? meterColor : colors.line }]}
            />
          ))}
        </View>
        <Text size={12.5} color={password && !strength.acceptable ? colors.danger : colors.muted} style={styles.strength}>
          {password ? strength.label : `At least ${MIN_PASSWORD_LENGTH} characters. Three or four random words work well.`}
        </Text>
      </View>

      <TextField
        label="Confirm password"
        value={confirm}
        onChangeText={(value) => {
          setConfirm(value);
          emit({ confirm: value });
        }}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="newPassword"
        placeholder="Type it again"
        error={mismatch ? "Passwords don't match" : null}
      />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: understood }}
        onPress={() => {
          setUnderstood(!understood);
          emit({ understood: !understood });
        }}
        style={styles.check}
      >
        <View style={[styles.box, { borderColor: understood ? colors.ink : colors.muted, backgroundColor: understood ? colors.ink : "transparent" }]}>
          {understood && <Check size={14} color={colors.bg} strokeWidth={3} />}
        </View>
        <Text size={13.5} color={colors.label} style={styles.checkText}>
          I understand MiniGo can&apos;t reset this password. Without it, the backup can&apos;t be opened.
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 20 },
  meter: { marginTop: 10, flexDirection: "row", gap: 6 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  strength: { marginTop: 8 },
  check: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  box: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkText: { flex: 1, lineHeight: 20 },
});
