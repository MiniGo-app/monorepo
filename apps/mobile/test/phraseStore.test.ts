import assert from "node:assert/strict";
import { test } from "node:test";
import { DEVICE_PHRASE_KEY, PHRASE_KEY, TIER_KEY, createPhraseStore, type PhraseBackend } from "../src/wallet/phraseStoreCore.ts";

const PHRASE = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

// A fake secure store. `device` items model the OS gate: every read is a prompt, and it can be cancelled,
// or the key can be invalidated (biometrics changed) so the item stops opening.
function fake({ capable = true, deviceSetFails = false } = {}) {
  const plainItems = new Map<string, string>();
  const deviceItems = new Map<string, string>();
  const state = { prompts: [] as string[], cancelNext: false, invalidated: false, capable, deviceSetFails };
  const backend: PhraseBackend = {
    deviceProtectionAvailable: async () => state.capable,
    plain: {
      get: async (key) => plainItems.get(key) ?? null,
      set: async (key, value) => void plainItems.set(key, value),
      remove: async (key) => void plainItems.delete(key),
    },
    device: {
      get: async (key, prompt) => {
        state.prompts.push(prompt ?? "");
        if (state.cancelNext) {
          state.cancelNext = false;
          throw new Error("User canceled the authentication");
        }
        return state.invalidated ? null : (deviceItems.get(key) ?? null);
      },
      set: async (key, value) => {
        if (state.deviceSetFails) throw new Error("ERR_SECURESTORE_AUTH_NOT_CONFIGURED");
        state.invalidated = false; // a new key is made with the current biometrics
        deviceItems.set(key, value);
      },
      remove: async (key) => void deviceItems.delete(key),
    },
  };
  return { backend, plainItems, deviceItems, state, store: createPhraseStore(backend) };
}

test("on a capable device the phrase goes into the biometric-gated slot only", async () => {
  const { store, plainItems, deviceItems } = fake();
  assert.equal(await store.store(PHRASE), "device");
  assert.equal(deviceItems.get(DEVICE_PHRASE_KEY), PHRASE);
  assert.equal(plainItems.has(PHRASE_KEY), false, "no plain copy");
  assert.equal(plainItems.get(TIER_KEY), "device");
});

test("every read in the device tier is a prompt, with the reason given", async () => {
  const { store, state } = fake();
  await store.store(PHRASE);
  assert.deepEqual(await store.read("Show your recovery phrase"), { ok: true, phrase: PHRASE, tier: "device" });
  await store.read("Approve payment");
  assert.deepEqual(state.prompts, ["Show your recovery phrase", "Approve payment"]);
});

test("checking the tier never prompts", async () => {
  const { store, state } = fake();
  await store.store(PHRASE);
  assert.equal(await store.tier(), "device");
  assert.deepEqual(state.prompts, []);
});

test("without device protection the phrase is stored plainly and reads without a prompt", async () => {
  const { store, state, plainItems } = fake({ capable: false });
  assert.equal(await store.store(PHRASE), "pin-only");
  assert.equal(plainItems.get(PHRASE_KEY), PHRASE);
  assert.deepEqual(await store.read("x"), { ok: true, phrase: PHRASE, tier: "pin-only" });
  assert.deepEqual(state.prompts, []);
});

test("if the gated slot can't be written, the phrase still ends up stored (pin-only)", async () => {
  const { store, plainItems } = fake({ deviceSetFails: true });
  assert.equal(await store.store(PHRASE), "pin-only");
  assert.equal(plainItems.get(PHRASE_KEY), PHRASE);
});

test("a wallet from before tiers is upgraded on first read: verified in the new slot, then the plain copy is removed", async () => {
  const { store, plainItems, deviceItems, state } = fake();
  plainItems.set(PHRASE_KEY, PHRASE); // old layout: no tier marker
  assert.deepEqual(await store.read("Approve payment"), { ok: true, phrase: PHRASE, tier: "device" });
  assert.equal(plainItems.has(PHRASE_KEY), false);
  assert.equal(deviceItems.get(DEVICE_PHRASE_KEY), PHRASE);
  assert.equal(state.prompts.length, 1, "the read-back is the user's authentication for this operation");
  assert.equal(await store.tier(), "device");
});

test("cancelling the prompt during the upgrade does not release the phrase and keeps the old copy", async () => {
  const { store, plainItems, deviceItems, state } = fake();
  plainItems.set(PHRASE_KEY, PHRASE);
  state.cancelNext = true;
  assert.deepEqual(await store.read("Approve payment"), { ok: false, reason: "cancelled" });
  assert.equal(plainItems.get(PHRASE_KEY), PHRASE, "nothing lost");
  assert.equal(deviceItems.size, 0, "half-made copy cleaned up");
  assert.deepEqual(await store.read("Approve payment"), { ok: true, phrase: PHRASE, tier: "device" }, "next try works");
});

test("an upgrade that fails for another reason leaves the wallet working in the plain slot", async () => {
  const { store, plainItems, state } = fake({ deviceSetFails: true });
  plainItems.set(PHRASE_KEY, PHRASE);
  assert.deepEqual(await store.read("x"), { ok: true, phrase: PHRASE, tier: "pin-only" });
  assert.equal(plainItems.get(PHRASE_KEY), PHRASE);
  assert.deepEqual(state.prompts, []);
});

test("cancelling a device-tier read is 'cancelled' (retry), not 'invalidated'", async () => {
  const { store, state } = fake();
  await store.store(PHRASE);
  state.cancelNext = true;
  assert.deepEqual(await store.read("Approve payment"), { ok: false, reason: "cancelled" });
  assert.equal((await store.read("Approve payment")).ok, true);
});

test("if biometrics change and the OS stops releasing the key, the read says 'invalidated' and deletes nothing", async () => {
  const { store, state, deviceItems } = fake();
  await store.store(PHRASE);
  state.invalidated = true;
  assert.deepEqual(await store.read("Approve payment"), { ok: false, reason: "invalidated" });
  assert.equal(deviceItems.has(DEVICE_PHRASE_KEY), true);
  assert.equal(await store.tier(), "device");
});

test("recovery: entering the phrase again makes a fresh key with the new biometrics", async () => {
  const { store, state } = fake();
  await store.store(PHRASE);
  state.invalidated = true;
  assert.equal((await store.read("x")).ok, false);
  assert.equal(await store.store(PHRASE), "device");
  assert.deepEqual(await store.read("x"), { ok: true, phrase: PHRASE, tier: "device" });
});

test("recovery when biometrics are gone entirely: the phrase is kept in the pin-only slot", async () => {
  const { store, state } = fake();
  await store.store(PHRASE);
  state.invalidated = true;
  state.capable = false; // e.g. the user removed all biometrics / the lock screen
  assert.equal(await store.store(PHRASE), "pin-only");
  assert.deepEqual(await store.read("x"), { ok: true, phrase: PHRASE, tier: "pin-only" });
});

test("nothing stored reads as 'missing'; clear removes every slot", async () => {
  const { store, plainItems, deviceItems } = fake();
  assert.deepEqual(await store.read("x"), { ok: false, reason: "missing" });
  await store.store(PHRASE);
  await store.clear();
  assert.equal(plainItems.size + deviceItems.size, 0);
  assert.deepEqual(await store.read("x"), { ok: false, reason: "missing" });
});
