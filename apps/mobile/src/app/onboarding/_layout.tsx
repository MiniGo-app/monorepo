import { Stack } from "expo-router";
import { OnboardingProvider } from "@/wallet/onboarding";
import { useTheme } from "@/theme/ThemeProvider";

export default function OnboardingLayout() {
  const { colors } = useTheme();
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </OnboardingProvider>
  );
}
