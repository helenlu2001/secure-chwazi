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
import { Entry, makeEntry, PaymentDiffMap, RawEntry, Totals, TransactionLog } from "./log";
import { KeyPair, Proof, prove } from "./vrf";
import * as assert from "assert";

interface Transaction {
  participants: Map<string, number>
}

export const executeTransaction = (txn: Transaction, secretKey: Buffer, log: TransactionLog): Entry => {
  const input = Array.from(txn.participants.keys()).sort();
  const inputBuf = Buffer.from(input.toString());

  const proof = prove(secretKey, inputBuf);
  const prevEntry = log.get(log.size - 1);
  const prevDiffs = prevEntry?.diffs ?? new PaymentDiffMap(new Map());

  const payer = determinePayer(txn, prevDiffs.totals, proof);

  const rawEntry: RawEntry = {
    amount: 0,
    diffs: prevDiffs.withTransaction(txn.participants, payer),
    participants: txn.participants,
    proof: proof
  }

  return makeEntry(rawEntry, prevEntry);
}

const txnWeightMul = 0.5;
const historicalWeightMul = 1 / txnWeightMul;

const determinePayer = (txn: Transaction, totals: ReadonlyMap<string, Totals>, proof: Proof): string => {
  // First, find someone's weight across all transactions. Then do the same for just this transaction.
  // Aggregate them with a weighted geometric mean.

  let total = 0;
  txn.participants.forEach((n, p) => {
    total += n;
  });

  const weights = new Map<string, number>();
  txn.participants.forEach((n, p) => {
    const txnWeight = n / total;
    const { expected, actual } = totals.get(p) ?? { expected: 0, actual: 0 };
    const historicalWeight = (actual === 0) ? 1 : expected / actual;

    const weight = Math.sqrt((txnWeightMul * txnWeight) * (historicalWeightMul * historicalWeight));
    weights.set(p, weight);
  });

  let totalWeight = 0;
  weights.forEach((x) => {
    totalWeight += x;
  });

  // Normalize the weights now.
  const normalizedWeights = new Map<string, number>();
  weights.forEach((x, p) => {
    normalizedWeights.set(p, x / totalWeight);
  });

  // Now normalizedWeights should sum to 1 so choose whatever region you end up in.

  // Turn the proof into a number from 0 to 1.

  throw new Error("unimplemented!")
}