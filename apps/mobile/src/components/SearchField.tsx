import { Search } from "lucide-react-native";
import { forwardRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { fonts } from "@/theme/colors";
import { useTheme } from "@/theme/ThemeProvider";

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel: string;
};

export const SearchField = forwardRef<TextInput, SearchFieldProps>(function SearchField(
  { value, onChangeText, placeholder, accessibilityLabel },
  ref,
) {
  const { colors } = useTheme();
  return (
    <View style={[styles.field, { backgroundColor: colors.soft, borderColor: colors.line }]}>
      <Search size={17} color={colors.muted} strokeWidth={1.8} />
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        style={[styles.input, { color: colors.ink }]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, minWidth: 0, height: "100%", fontFamily: fonts.regular, fontSize: 14, padding: 0, outlineWidth: 0 },
});
