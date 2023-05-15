import { generateKeyPair, prove, verify } from "../vrf";
import * as assert from "assert";
import crypto from "crypto";
import {
  crypto_vrf_PROOFBYTES,
  crypto_vrf_PUBLICKEYBYTES,
  crypto_vrf_SECRETKEYBYTES,
  crypto_vrf_sk_to_pk,
} from "@appliedblockchain/sodium-native-vrf";

describe("key generation", () => {
  it("should generate valid-length keypairs", () => {
    for (let i = 0; i < 100; i++) {
      const keys = generateKeyPair();
      assert.deepStrictEqual(keys.publicKey.length, crypto_vrf_PUBLICKEYBYTES);
      assert.deepStrictEqual(keys.secretKey.length, crypto_vrf_SECRETKEYBYTES);
    }
  })

  it("should generate keypairs such that sk = random + pk", () => {
    for (let i = 0; i < 100; i++) {
      const keys = generateKeyPair();
      const publicKey = Buffer.from("0".repeat(crypto_vrf_PUBLICKEYBYTES));
      crypto_vrf_sk_to_pk(publicKey, keys.secretKey);
      assert.deepStrictEqual(publicKey, keys.publicKey);
    }
  })
})

describe("VRF", () => {
  const randomBuffer = (): Buffer => {
    const messageLength = crypto.randomInt(1024);
    return crypto.randomBytes(messageLength)
  }

  it("should generate valid proofs", () => {
    for (let i = 0; i < 100; i++) {
      const { publicKey, secretKey } = generateKeyPair();
      const message = randomBuffer();
      const proof = prove(secretKey, message);
      assert.strictEqual(proof.proof.length, crypto_vrf_PROOFBYTES);
      assert.deepStrictEqual(proof.publicKey, publicKey);
      assert.deepStrictEqual(proof.input, message);
    }
  })

  it("should verify when a valid proof is constructed", () => {
    for (let i = 0; i < 100; i++) {
      const { publicKey, secretKey } = generateKeyPair();
      const message = randomBuffer();
      const proof = prove(secretKey, message);
      const outHash = verify(proof);
      assert.ok(outHash);
      // The output is actually this provided hash, which we can then truncate.
    }
  });

  it("should reject when an invalid proof is given", () => {
    for (let i = 0; i < 100; i++) {
      const { publicKey, secretKey } = generateKeyPair();
      const proof = {
        proof: crypto.randomBytes(crypto_vrf_PROOFBYTES),
        input: randomBuffer(),
        publicKey: publicKey,
      };
      const outHash = verify(proof);
      assert.equal(outHash, null);
    }
  })
});