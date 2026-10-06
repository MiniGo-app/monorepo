import { ed25519 } from "@noble/curves/ed25519.js";
import { hmac } from "@noble/hashes/hmac.js";
import { sha512 } from "@noble/hashes/sha2.js";
import { entropyToMnemonic, mnemonicToSeed, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

// Stellar keys from a BIP-39 recovery phrase, following SEP-0005: SLIP-0010 ed25519 derivation along
// m/44'/148'/account'. Pure functions (randomness is passed in) so they can be checked against the
// SEP-0005 test vectors.

const HARDENED = 0x80000000;
const ACCOUNT_ID_VERSION = 6 << 3; // "G…"
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export type StellarAccount = { publicKey: string; secretSeed: Uint8Array };

// 16 bytes of entropy → 12 words.
export function phraseFromEntropy(entropy: Uint8Array) {
  return entropyToMnemonic(entropy, wordlist);
}

export function normalizePhrase(phrase: string) {
  return phrase.trim().toLowerCase().split(/\s+/).join(" ");
}

export function isValidPhrase(phrase: string) {
  return validateMnemonic(normalizePhrase(phrase), wordlist);
}

export function isPhraseWord(word: string) {
  return wordlist.includes(word.trim().toLowerCase());
}

export async function deriveAccount(phrase: string, account = 0): Promise<StellarAccount> {
  const seed = await mnemonicToSeed(normalizePhrase(phrase));
  let node = hmac(sha512, new TextEncoder().encode("ed25519 seed"), seed);
  for (const index of [44, 148, account]) {
    const data = new Uint8Array(37);
    data.set(node.subarray(0, 32), 1);
    new DataView(data.buffer).setUint32(33, (index + HARDENED) >>> 0);
    node = hmac(sha512, node.subarray(32), data);
  }
  const secretSeed = node.slice(0, 32);
  return { publicKey: encodeAccountId(ed25519.getPublicKey(secretSeed)), secretSeed };
}

export function encodeAccountId(publicKey: Uint8Array) {
  return encodeCheck(ACCOUNT_ID_VERSION, publicKey);
}

export function isValidAccountId(value: string) {
  const bytes = base32Decode(value.trim());
  if (!bytes || bytes.length !== 35 || bytes[0] !== ACCOUNT_ID_VERSION) return false;
  const checksum = crc16(bytes.subarray(0, 33));
  return bytes[33] === (checksum & 0xff) && bytes[34] === checksum >> 8;
}

export function shortAddress(address: string, head = 4, tail = 4) {
  return address.length > head + tail + 1 ? `${address.slice(0, head)}…${address.slice(-tail)}` : address;
}

function encodeCheck(version: number, payload: Uint8Array) {
  const body = new Uint8Array(payload.length + 1);
  body[0] = version;
  body.set(payload, 1);
  const checksum = crc16(body);
  const full = new Uint8Array(body.length + 2);
  full.set(body);
  full[body.length] = checksum & 0xff;
  full[body.length + 1] = checksum >> 8;
  return base32Encode(full);
}

// CRC16-XModem, as used by Stellar's StrKey.
function crc16(bytes: Uint8Array) {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc;
}

function base32Encode(bytes: Uint8Array) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(text: string) {
  if (!/^[A-Z2-7]+$/.test(text)) return null;
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of text) {
    value = (value << 5) | BASE32.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}
