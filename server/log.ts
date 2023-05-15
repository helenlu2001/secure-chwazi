import sodium, { crypto_generichash } from "@appliedblockchain/sodium-native-vrf";
import * as assert from "assert";
import { Proof } from "./vrf";

export class PaymentDiffMap {
  private readonly users: Map<string, number>;
  constructor(users: Map<string, number>) {
    // no rep exposure :p
    const newUsers = new Map<string, number>;
    users.forEach((n, p) => {
      newUsers.set(p, n);
    })

    this.users = newUsers;
  }

  withTransaction(participants: Map<string, number>, payer: string): PaymentDiffMap {
    assert.ok(participants.has(payer));

    const newMap = new PaymentDiffMap(this.users);

    participants.forEach((n, p) => {
      if (!newMap.users.has(p)) { newMap.users.set(p, -n) }
    });

    let total = 0;
    participants.forEach((x) => {
      total += x;
    });

    const oldPayerDiff = newMap.users.get(payer) ?? 0;
    newMap.users.set(payer, oldPayerDiff + total);

    return newMap;
  }

  inner(): Map<string, number> {
    const newUsers = new Map<string, number>();
    this.users.forEach((n, p) => newUsers.set(p, n));

    return newUsers;
  }
}

export type RawEntry = Omit<Entry, "hash">
export interface Entry {
  diffs: PaymentDiffMap
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
    const prevLogEntry = this.get(this.size() - 1);
    this.log.push(makeEntry(e, prevLogEntry));
  }

  get(i: number): Entry | null {
    return 0 <= i && i < this.size() ? this.log[i] : null;
  }

  size(): number {
    return this.log.length;
  }
}