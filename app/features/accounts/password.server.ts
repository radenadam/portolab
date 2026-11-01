import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { normalizePassword } from "./normalize-password.ts";

/** A password hashed with scrypt, in the PHC string format, which names the parameters, the salt, and the hash. */
export type PasswordHash = string & { readonly brand: "PasswordHash" };

interface ScryptParameters {
  costExponent: number;
  blockSize: number;
  parallelization: number;
  keyBytes: number;
}

// The cheat sheet on password storage of OWASP lists these parameters as one of five equal choices for scrypt. The others use more memory for each hash, and Node computes up to four hashes at once on a small server.
const parameters: ScryptParameters = {
  costExponent: 15,
  blockSize: 8,
  parallelization: 3,
  keyBytes: 32,
};
const saltBytes = 16;
// Node refuses scrypt when the work needs more memory than this, and the parameters above need 32 MiB.
const maximumMemoryBytes = 64 * 1024 * 1024;

const hashPattern =
  /^\$scrypt\$ln=(\d+),r=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;

/** Hashes a password with a new random salt. */
export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = randomBytes(saltBytes);
  const hash = await deriveKey(password, salt, parameters);
  // The text has the format that verifyPassword reads, because this function writes it.
  return `$scrypt$ln=${String(parameters.costExponent)},r=${String(parameters.blockSize)},p=${String(parameters.parallelization)}$${unpaddedBase64(salt)}$${unpaddedBase64(hash)}` as PasswordHash;
}

/** Whether a password matches a hash, in the same time for any password. A hash keeps its own parameters, so a hash made before a change of the parameters still works. */
export async function verifyPassword(
  password: string,
  passwordHash: PasswordHash,
): Promise<boolean> {
  const [, costExponent, blockSize, parallelization, salt, hash] =
    hashPattern.exec(passwordHash) ?? [];
  if (
    costExponent === undefined ||
    blockSize === undefined ||
    parallelization === undefined ||
    salt === undefined ||
    hash === undefined
  ) {
    throw new Error(
      "A stored password hash is not in the format that hashPassword writes.",
    );
  }
  const expected = Buffer.from(hash, "base64");
  const actual = await deriveKey(password, Buffer.from(salt, "base64"), {
    costExponent: Number(costExponent),
    blockSize: Number(blockSize),
    parallelization: Number(parallelization),
    keyBytes: expected.length,
  });
  return timingSafeEqual(actual, expected);
}

function deriveKey(
  password: string,
  salt: Buffer,
  { costExponent, blockSize, parallelization, keyBytes }: ScryptParameters,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      normalizePassword(password),
      salt,
      keyBytes,
      {
        N: 2 ** costExponent,
        r: blockSize,
        p: parallelization,
        maxmem: maximumMemoryBytes,
      },
      (error, key) => {
        if (error === null) {
          resolve(key);
        } else {
          reject(error);
        }
      },
    );
  });
}

// The PHC string format writes base64 without the padding at its end.
function unpaddedBase64(bytes: Buffer): string {
  return bytes.toString("base64").replace(/=+$/, "");
}
