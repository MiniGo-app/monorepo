import { AppWindow, ArrowDownLeft, ShieldCheck, Sparkles } from "lucide-react-native";
import { Row } from "@/components/Row";
import { Section } from "@/components/Section";
import { StackScreen } from "@/components/StackScreen";
import { useWallet, useWalletData } from "@/wallet/WalletProvider";

export default function NotificationSettingsScreen() {
  const { updateSettings } = useWallet();
  const { settings } = useWalletData();
  const set = (key: keyof typeof settings.notifications) => (value: boolean) =>
    updateSettings({ notifications: { ...settings.notifications, [key]: value } });

  return (
    <StackScreen title="Notifications">
      <Section title="Tell me about">
        <Row icon={ArrowDownLeft} label="Payments" detail="Money in and out" toggle={{ value: settings.notifications.payments, onChange: set("payments") }} />
        <Row icon={AppWindow} label="Mini app activity" detail="Payment requests and receipts" toggle={{ value: settings.notifications.miniApps, onChange: set("miniApps") }} />
        <Row icon={Sparkles} label="News and offers" detail="New mini apps and rewards" toggle={{ value: settings.notifications.product, onChange: set("product") }} />
      </Section>
      <Section footer="Security alerts, like a new backup or a PIN change, are always sent.">
        <Row icon={ShieldCheck} label="Security alerts" value="Always on" />
      </Section>
    </StackScreen>
  );
}
