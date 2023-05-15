import {
  crypto_vrf_keypair,
  crypto_vrf_OUTPUTBYTES,
  crypto_vrf_proof_to_hash,
  crypto_vrf_PROOFBYTES,
  crypto_vrf_prove,
  crypto_vrf_PUBLICKEYBYTES,
  crypto_vrf_SECRETKEYBYTES,
  crypto_vrf_sk_to_pk,
  crypto_vrf_verify,
} from "@appliedblockchain/sodium-native-vrf";

export interface Proof {
  input: Buffer,
  publicKey: Buffer,
  proof: Buffer
}

export interface KeyPair {
  publicKey: Buffer,
  secretKey: Buffer,
}

export const prove = (sk: Buffer, message: Buffer): Proof => {
  const proof = Buffer.from("0".repeat(crypto_vrf_PROOFBYTES));
  crypto_vrf_prove(proof, sk, message);
  const pk = Buffer.from("0".repeat(crypto_vrf_PUBLICKEYBYTES));
  crypto_vrf_sk_to_pk(pk, sk);
  return {
    input: message,
    publicKey: pk,
    proof: proof
  }
}

export const verify = (proof: Proof): Buffer | null => {
  const output = Buffer.from("0".repeat(crypto_vrf_OUTPUTBYTES));
  try {
    crypto_vrf_verify(output, proof.publicKey, proof.proof, proof.input);
  } catch(e) {
    return null;
  }

  return output;
}

export const generateKeyPair = (): KeyPair => {
  const publicKey = Buffer.from("0".repeat(crypto_vrf_PUBLICKEYBYTES));
  const secretKey = Buffer.from("0".repeat(crypto_vrf_SECRETKEYBYTES));
  crypto_vrf_keypair(publicKey, secretKey);
  return {
    publicKey: publicKey,
    secretKey: secretKey
  }
}