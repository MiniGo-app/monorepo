import { Buffer } from "buffer";

// Stellar's libraries need Node's Buffer, and on Hermes slicing a Buffer gives a plain Uint8Array, which then
// prints as "0,0,0,2,..." and breaks transactions. This installs a Buffer whose slices stay Buffers. It has to run
// before anything imports @stellar/stellar-base.
type Sliceable = { subarray(start?: number, end?: number): Uint8Array };
const proto = Buffer.prototype as unknown as Sliceable;
const subarray = proto.subarray;
proto.subarray = function (this: Uint8Array, start?: number, end?: number) {
  const slice = subarray.call(this, start, end);
  return Object.setPrototypeOf(slice, Buffer.prototype);
};

(globalThis as { Buffer?: typeof Buffer }).Buffer = Buffer;
