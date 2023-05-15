/**
 * The steps of the protocol are as follows:
 *  All participants agree on their respective amounts. This starts a transaction.
 *  The random input is the concatenation of all users' usernames in sorted order.
 *  The random input is used as the starting message to generate a VRF proof which is broadcasted
 *    to all participants within the log of the transaction (the new log index is returned).
 *  Participants can verify the transaction by looking at index i - 1 and i, verifying that the hashes
 *  agree, and checking the proof. Further, a malicious server can be detected by comparing hashes
 *  for a given index.
 */
import { Entry, makeEntry, PaymentDiffMap, RawEntry, TransactionLog } from "./log";
import { KeyPair, Proof, prove } from "./vrf";
import * as assert from "assert";

interface Transaction {
  participants: Map<string, number>
}

export const executeTransaction = (txn: Transaction, secretKey: Buffer, log: TransactionLog): Entry => {
  const input = Array.from(txn.participants.keys()).sort();
  const inputBuf = Buffer.from(input.toString());

  const proof = prove(secretKey, inputBuf);
  const payer = determinePayer(txn, proof);

  const prevEntry = log.get(log.size() - 1);
  const prevDiffs = prevEntry?.diffs ?? new PaymentDiffMap(new Map());

  const rawEntry: RawEntry = {
    amount: 0,
    diffs: prevDiffs.withTransaction(txn.participants, payer),
    participants: txn.participants,
    proof: proof
  }

  return makeEntry(rawEntry, prevEntry);
}

const diffMultiplier = 1.5;
const diffAdder = 1;

const determinePayer = (txn: Transaction, proof: Proof): string => {
  assert.ok(txn.participants.size > 0);

  let min = 0;
  let max = 0;
  txn.participants.forEach((n) => {
    if (n < min) {
      min = n;
    }

    if (n > max) {
      max = n;
    }
  });

  const absDiff = max - min;
  const shiftedDiff = absDiff * diffMultiplier + diffAdder;

  const scaledMap = new Map<string, number>();
  txn.participants.forEach((n, p) => {
    scaledMap.set(p, shiftedDiff * n);
  });

  let scaledTotal = 0;
  scaledMap.forEach((n) => {
    scaledTotal += n;
  });

  const normalizedMap = new Map<string, number>();
  scaledMap.forEach((n, p) => {
    normalizedMap.set(p, n / scaledTotal);
  });

  // Check some simple invariants on the normalized map: each element is between 0 and 1, and it
  // sums to 1 (w/ some allowance for floating-point error).
  normalizedMap.forEach((n) => assert.ok(0 < n && n < 1));
  const normalizedTotal = Array.from(normalizedMap.values()).reduce(
    (prev, curr) => prev + curr
  );
  assert.ok(Math.abs(normalizedTotal - 1) <= 1E-4);

  // Grab the lowest 8 bits of the proof output's hash and interpret it as the smallest value.
  const s = proof.proof.readUInt32LE(6);
  const normalizedS = s / Math.pow(2, 32);

  // Now pick someone in sorted order.
  const ordered = Array.from(normalizedMap.entries()).sort(([a, aNum], [b, bNum]) => {
    if (a < b) {
      return -1;
    } else if (a > b) {
      return 1;
    } else {
      return 0;
    }
  });

  let runningSum = 0;
  for (const [p, n] of ordered) {
    if (runningSum < normalizedS && normalizedS <= runningSum + n) {
      return p;
    }

    runningSum += n;
  }

  assert.fail("shouldn't get here :(")
}