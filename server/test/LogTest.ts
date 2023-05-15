import { initialHash, PaymentDiffMap, RawEntry, Totals, TransactionLog } from "../log";
import crypto from "crypto";
import * as sodium from "@appliedblockchain/sodium-native-vrf";
import * as assert from "assert";
import { generateKeyPair, Proof, prove } from "../vrf";

const randomMapStringNumber = (size: number, minVal: number, maxVal: number): Map<string, number> => {
  assert.ok(size >= 0);
  const m = new Map<string, number>([]);
  for (let i = 0; i < size; i++) {
    const s = crypto.randomBytes(20).toString("hex");
    const n = crypto.randomInt(minVal, maxVal);
    m.set(s, n);
  }

  return m;
}

const randomTotalsMap = (size: number, maxVal: number): Map<string, Totals> => {
  assert.ok(size >= 0);
  assert.ok(maxVal > 0);
  const m = new Map<string, Totals>([]);
  for (let i = 0; i < size; i++) {
    let s = crypto.randomBytes(20).toString("hex");
    while (m.has(s)) {
      s = crypto.randomBytes(20).toString("hex");
    }

    const expected = crypto.randomInt(1, maxVal);
    const actual = crypto.randomInt(Math.round(expected / 2), expected * 2);
    m.set(s, { expected, actual });
  }

  return m;
}

const randomRawEntry = (): RawEntry => {
  const nParticipants = crypto.randomInt(1, 5);
  const participants = randomMapStringNumber(nParticipants, 0, 100);

  const nUsers = crypto.randomInt(0, 50);
  const totals = randomTotalsMap(nUsers, 1000);

  const { secretKey, } = generateKeyPair();
  const proof = prove(secretKey, crypto.randomBytes(10));

  return {
    amount: crypto.randomInt(1000),
    participants: participants,
    proof: proof,
    diffs: new PaymentDiffMap(totals),
  }
}
describe("log hashing", () => {
  it("should make the same hash when manually hashed as when added to the log", () => {
    const log = new TransactionLog();
    for (let i = 0; i < 100; i++) {
      const e = randomRawEntry();
      const prevEntry = log.get(i - 1);
      const prevHash = prevEntry === null ? initialHash() : prevEntry.hash;
      const inBuf = Buffer.from(JSON.stringify(e) + prevHash.toString());
      const outBuf = Buffer.from("0".repeat(sodium.crypto_generichash_BYTES_MAX));
      sodium.crypto_generichash(outBuf, inBuf);

      log.add(e);
      const fullEntry = log.get(i);

      const expectedFullEntry = {...e, hash: outBuf}
      assert.deepStrictEqual(fullEntry, expectedFullEntry)
    }
  })
});

describe("payment diff map", () => {
 it("should start with zero-initialized amounts", () => {
   const map = new PaymentDiffMap(new Map());
   const txnMap = randomMapStringNumber(crypto.randomInt(1, 10), 0, 20);
   const i = crypto.randomInt(0, txnMap.size);
   const s = Array.from(txnMap.keys());
   const payer = s[i];
   let newMap = map.withTransaction(txnMap, payer).totals;

   let total = 0;
   txnMap.forEach((n) => {
     total += n;
   });

   newMap.forEach((n, p) => {
     const txnVal = txnMap.get(p) ?? assert.fail("must be present!");
     assert.equal(n.expected, txnVal);
     if (p === payer) {
       assert.equal(n.actual, total);
     } else {
       assert.equal(n.actual, 0);
     }
   });
 })
});