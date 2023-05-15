import sodium, { crypto_generichash } from "@appliedblockchain/sodium-native-vrf";
import * as assert from "assert";
import { Proof } from "./vrf";

export type Totals = {
  // expected amount to pay
  expected: number,
  // actual amount paid
  actual: number,
  // number of txns participated in
  count: number,
}

export class PaymentTracker {
  private readonly map: Map<string, Totals>;
  constructor(map: ReadonlyMap<string, Totals>) {
    // no rep exposure :p
    const newMap = new Map<string, Totals>();
    map.forEach((v, p) => newMap.set(p, v));
    this.map = newMap;
  }

  withTransaction(participants: Map<string, number>, payer: string): PaymentTracker {
    assert.ok(participants.has(payer));

    let total = 0;
    participants.forEach((x) => {
      total += x;
    });

    const newMap = new PaymentTracker(this.map);
    participants.forEach((x, p) => {
      let oldV = newMap.map.get(p) ?? { expected: 0, actual: 0, count: 0};

      const newExpected = oldV.expected + x;
      let newActual;
      if (p === payer) {
        newActual = oldV.actual + total;
      } else {
        newActual = oldV.actual;
      }

      const isPayer = (p === payer) ? 1 : 0;
      newMap.map.set(p, { expected: newExpected, actual: newActual, count: oldV.count + isPayer});
    })

    return newMap;
  }

  get totals(): ReadonlyMap<string, Totals> {
    return this.map;
  }

  get counts(): ReadonlyMap<string, number> {
    const m = new Map<string, number>();
    this.map.forEach((v, p) => {m.set(p, v.count);});
    return m;
  }
}

export type RawEntry = Omit<Entry, "hash">
export interface Entry {
  payments: PaymentTracker
  participants: Map<string, number>,
  amount: number,
  proof: Proof,
  hash: Buffer
}

const makeBuffer = (size: number): Buffer => {
  let s = "";
  for (let i = 0; i < size; i++) {
    s += "0";
  }

  return Buffer.from(s);
}

export const initialHash = (): Buffer => {
  const outBuf = makeBuffer(sodium.crypto_generichash_BYTES_MAX);
  crypto_generichash(outBuf, Buffer.from("0"));
  return outBuf;
}

export const makeEntry = (e: RawEntry, prevLogEntry: Entry | null): Entry => {
  const prevHash = prevLogEntry === null ? initialHash() : prevLogEntry.hash;
  const inBuf = Buffer.from(JSON.stringify(e) + prevHash.toString())
  const outBuf = makeBuffer(sodium.crypto_generichash_BYTES_MAX);
  sodium.crypto_generichash(outBuf, inBuf)
  return { hash: outBuf, ...e }
}

export class TransactionLog {
  private readonly log: Array<Entry> = [];
  constructor() {}
  add(e: RawEntry): void {
    const prevLogEntry = this.get(this.size - 1);
    this.log.push(makeEntry(e, prevLogEntry));
  }

  get(i: number): Entry | null {
    return 0 <= i && i < this.size ? this.log[i] : null;
  }

  get size(): number {
    return this.log.length;
  }
}