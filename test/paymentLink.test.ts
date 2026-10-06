import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanAmount, floorAmount, parsePayLink, toStroops } from "../src/data/paymentLinkCore.ts";

const G = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7";
const ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
const link = (q: string) => parsePayLink(`web+stellar:pay?${q}`);

test("not a pay link: null, so the caller can try a plain address", () => {
  assert.equal(parsePayLink(G), null);
  assert.equal(parsePayLink("https://example.com"), null);
});

test("a plain XLM request", () => {
  assert.deepEqual(link(`destination=${G}&amount=12.5&memo=order%2042`), {
    ok: true,
    fields: { destination: G, amount: "12.5", asset: "XLM", memo: "order 42" },
  });
});

test("an issued asset needs its issuer; a code alone is refused, not turned into XLM", () => {
  assert.deepEqual(link(`destination=${G}&amount=5&asset_code=USDC&asset_issuer=${ISSUER}`), {
    ok: true,
    fields: { destination: G, amount: "5", asset: `USDC:${ISSUER}`, memo: undefined },
  });
  const noIssuer = link(`destination=${G}&amount=5&asset_code=USDC`);
  assert.equal(noIssuer?.ok, false);
  assert.match(noIssuer && !noIssuer.ok ? noIssuer.reason : "", /doesn't say who issued/);
  assert.equal(link(`destination=${G}&asset_code=XLM`)?.ok, true);
});

test("a memo MiniGo can't send as asked is refused rather than sent as text", () => {
  for (const type of ["MEMO_ID", "MEMO_HASH", "MEMO_RETURN"]) {
    const result = link(`destination=${G}&amount=1&memo=12345&memo_type=${type}`);
    assert.equal(result?.ok, false, type);
  }
  assert.equal(link(`destination=${G}&amount=1&memo=hi&memo_type=MEMO_TEXT`)?.ok, true);
  assert.equal(link(`destination=${G}&amount=1&memo=${"x".repeat(29)}`)?.ok, false);
});

test("damaged or invalid codes are refused with a reason, never thrown", () => {
  assert.equal(link(`destination=${G}&memo=%E0%A4%A`)?.ok, false);
  assert.equal(link("amount=5")?.ok, false);
  assert.equal(link(`destination=${G}&amount=1.12345678`)?.ok, false);
  assert.equal(link(`destination=${G}&amount=0`)?.ok, false);
  assert.equal(link(`destination=${G}&amount=-1`)?.ok, false);
  assert.equal(link(`destination=${G}&asset_code=US$&asset_issuer=${ISSUER}`)?.ok, false);
});

test("amounts are always plain decimal text", () => {
  assert.equal(cleanAmount("0012.500"), "12.5");
  assert.equal(cleanAmount("12."), "12");
  assert.equal(cleanAmount("0.0000001"), "0.0000001");
  assert.equal(cleanAmount("0"), "0");
  assert.equal(cleanAmount("1e-7"), null);
  assert.equal(cleanAmount("."), null);
  assert.equal(floorAmount(1e-7), "0.0000001");
  assert.equal(floorAmount(12.3456789), "12.3456789");
  assert.equal(floorAmount(0.3), "0.3");
  assert.equal(floorAmount(9989.4999999 - 0.01), "9989.4899999");
  assert.equal(toStroops(9989.4999999 - 0.01), toStroops(9989.4899999));
  assert.equal(floorAmount(0), "0");
  assert.ok(!String(floorAmount(1e-7)).includes("e"));
});
