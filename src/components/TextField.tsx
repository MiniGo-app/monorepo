import { forwardRef, useState, type ReactNode } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { fonts } from "@/theme/colors";
import { useTheme } from "@/theme/ThemeProvider";
import { Text } from "@/components/Text";

type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string | null;
  error?: string | null;
  right?: ReactNode;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, hint, error, right, style, onFocus, onBlur, ...props },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text weight="medium" size={13} color={colors.label}>
        {label}
      </Text>
      <View
        style={[
          styles.field,
          { backgroundColor: colors.soft, borderColor: error ? colors.danger : focused ? colors.ink : colors.line },
        ]}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={colors.muted}
          accessibilityLabel={label}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, { color: colors.ink }, style]}
          {...props}
        />
        {right}
      </View>
      {(error || hint) && (
        <Text size={12.5} color={error ? colors.danger : colors.muted} style={styles.hint}>
          {error || hint}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  field: { minHeight: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, minWidth: 0, fontFamily: fonts.regular, fontSize: 15.5, paddingVertical: 14, outlineWidth: 0 },
  hint: { lineHeight: 18 },
});
