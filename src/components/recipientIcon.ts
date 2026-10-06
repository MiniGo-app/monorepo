import { AtSign, Phone, Wallet, type LucideIcon } from "lucide-react-native";
import type { RecipientKind } from "@/data/recipient";

export const recipientIcon: Record<RecipientKind, LucideIcon> = { email: AtSign, phone: Phone, address: Wallet };
