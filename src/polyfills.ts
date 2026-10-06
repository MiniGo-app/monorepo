import { Buffer } from "buffer";

// Stellar's libraries build transactions in Node's `Buffer`. React Native has none, and Hermes (its JavaScript
// engine) differs from V8 in one way that breaks it: slicing a Buffer with `subarray` returns a plain Uint8Array
// instead of a Buffer. Then `toString("base64")` prints "0,0,0,2,…" (Stellar rejects the transaction as malformed)
// and reading a transaction that has a memo or a non-XLM asset fails. This installs a Buffer and makes slices
// stay Buffers. It must run before anything imports @stellar/stellar-base.
type Sliceable = { subarray(start?: number, end?: number): Uint8Array };
const proto = Buffer.prototype as unknown as Sliceable;
const subarray = proto.subarray;
proto.subarray = function (this: Uint8Array, start?: number, end?: number) {
  const slice = subarray.call(this, start, end);
  return Object.setPrototypeOf(slice, Buffer.prototype);
};

(globalThis as { Buffer?: typeof Buffer }).Buffer = Buffer;
