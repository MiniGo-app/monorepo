import assert from "node:assert/strict";
import { test } from "node:test";
import { MIN_PASSWORD_LENGTH, hasSafeKdfParams, passwordStrength } from "../src/wallet/backupPolicy.ts";

test("short passwords are rejected, however varied", () => {
  for (const p of ["", "aB3$x", "Tr0ub4d!", "aB3$xY7."]) {
    const s = passwordStrength(p);
    assert.equal(s.acceptable, false, p);
    assert.equal(s.score, 0, p);
  }
  assert.equal(MIN_PASSWORD_LENGTH, 12);
});

test("a long string of one class or a common pattern is not acceptable", () => {
  for (const p of ["aaaaaaaaaaaaaa", "123456789012345", "passwordpassword", "qwertyuiopqwerty", "password1234", "letmein12345"]) {
    assert.equal(passwordStrength(p).acceptable, false, p);
  }
});

test("a three-or-four word passphrase is acceptable", () => {
  for (const p of ["correct horse battery staple", "purple tractor window salmon", "my dog ate the homework again"]) {
    const s = passwordStrength(p);
    assert.equal(s.acceptable, true, p);
    assert.ok(s.score >= 2, `${p} -> ${s.score}`);
  }
});

test("more length and variety scores higher", () => {
  assert.ok(passwordStrength("correct horse battery staple extra words here").score >= passwordStrength("correct horse ab").score);
  assert.equal(passwordStrength("Tr0ub4dour-and-the-blue-horse!").score, 4);
});

test("the strength gate matches the length minimum", () => {
  const justUnder = "ab cd ef gh".slice(0, MIN_PASSWORD_LENGTH - 1);
  assert.equal(passwordStrength(justUnder).acceptable, false);
});

test("accepts the KDF parameters of both old and new backups", () => {
  const salt = "a".repeat(24);
  // new default
  assert.equal(hasSafeKdfParams({ name: "scrypt", N: 2 ** 16, r: 8, p: 2, salt }), true);
  // the previous default (an existing backup must still open)
  assert.equal(hasSafeKdfParams({ name: "scrypt", N: 2 ** 15, r: 8, p: 1, salt }), true);
  // OWASP minimum, should a file use it
  assert.equal(hasSafeKdfParams({ name: "scrypt", N: 2 ** 17, r: 8, p: 1, salt }), true);
});

test("rejects KDF parameters that would exhaust memory or are malformed", () => {
  const salt = "a".repeat(24);
  assert.equal(hasSafeKdfParams({ name: "scrypt", N: 2 ** 18, r: 8, p: 1, salt }), false);
  assert.equal(hasSafeKdfParams({ name: "scrypt", N: 2 ** 16, r: 16, p: 1, salt }), false);
  assert.equal(hasSafeKdfParams({ name: "scrypt", N: 2 ** 16, r: 8, p: 9, salt }), false);
  assert.equal(hasSafeKdfParams({ name: "scrypt", N: 1000, r: 8, p: 1, salt }), false);
  assert.equal(hasSafeKdfParams(undefined), false);
});
