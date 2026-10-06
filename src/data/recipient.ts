import { isValidAccountId, shortAddress } from "@/wallet/stellar";

export type RecipientKind = "email" | "phone" | "address";
export type Recipient = { kind: RecipientKind; value: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Recipients are an email, a phone number or a Stellar address. Returns null while the input isn't one yet.
export function parseRecipient(input: string): Recipient | null {
  const value = input.trim();
  if (!value) return null;
  if (/^G[A-Z2-7]{55}$/.test(value.toUpperCase()) && isValidAccountId(value.toUpperCase())) {
    return { kind: "address", value: value.toUpperCase() };
  }
  if (EMAIL.test(value)) return { kind: "email", value: value.toLowerCase() };
  const digits = value.replace(/[\s().-]/g, "");
  if (/^\+?\d{8,15}$/.test(digits)) return { kind: "phone", value: digits.startsWith("+") ? digits : `+${digits}` };
  return null;
}

// Why the input isn't a recipient yet, for the hint under the field.
export function recipientHint(input: string) {
  const value = input.trim();
  if (!value) return null;
  if (/^G[A-Z2-7]*$/i.test(value) && value.length >= 20) {
    return value.length === 56 ? "This Stellar address has a typo" : "Stellar addresses are 56 characters";
  }
  if (value.includes("@")) return "Finish typing the email";
  if (/^[+\d\s().-]+$/.test(value)) return "Include the country code, e.g. +234";
  return "Enter an email, phone number or Stellar address";
}

export function displayRecipient(recipient: Recipient, compact = false) {
  return recipient.kind === "address" ? shortAddress(recipient.value, compact ? 4 : 6, compact ? 4 : 6) : recipient.value;
}

export const recipientLabel: Record<RecipientKind, string> = {
  email: "Email",
  phone: "Phone",
  address: "Stellar address",
};
