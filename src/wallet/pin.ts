import { CryptoDigestAlgorithm, digest, getRandomBytes } from "expo-crypto";
import { equalBytes, fromBase64, toBase64, utf8 } from "./bytes";

export const PIN_LENGTH = 6;

// Hashing can't make a 6-digit PIN hard to brute-force. What protects it is that the hash is in the Keychain or
// Keystore, and the lockout in WalletProvider.
async function hash(pin: string, salt: Uint8Array) {
  const data = new Uint8Array(salt.length + PIN_LENGTH);
  data.set(salt);
  data.set(utf8(pin), salt.length);
  return new Uint8Array(await digest(CryptoDigestAlgorithm.SHA256, data));
}

export async function hashPin(pin: string) {
  const salt = getRandomBytes(16);
  return `sha256:${toBase64(salt)}:${toBase64(await hash(pin, salt))}`;
}

export async function checkPin(pin: string, stored: string) {
  const [scheme, salt, expected] = stored.split(":");
  if (scheme !== "sha256" || !salt || !expected) return false;
  return equalBytes(await hash(pin, fromBase64(salt)), fromBase64(expected));
}

export function isWeakPin(pin: string) {
  if (/^(\d)\1+$/.test(pin)) return true;
  const digits = pin.split("").map(Number);
  const steps = new Set(digits.slice(1).map((digit, i) => digit - digits[i]));
  return steps.size === 1 && (steps.has(1) || steps.has(-1));
}
