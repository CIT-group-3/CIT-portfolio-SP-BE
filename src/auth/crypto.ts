// Passwords are never stored in plaintext.
// PBKDF2 uses a random salt and many iterations to make
// offline password guessing more computationally expensive.

import {
    pbkdf2,
    randomBytes,
    timingSafeEqual,
  } from "node:crypto";

  const ALGORITHM = "sha256";
  const ITERATIONS = 600_000;
  const KEY_LENGTH = 32;
  const SALT_LENGTH = 16;
  const HASH_FORMAT = "pbkdf2-sha256-v1";

  function deriveKey(
    password: string,
    salt: Buffer,
    iterations: number,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      pbkdf2(
        password,
        salt,
        iterations,
        KEY_LENGTH,
        ALGORITHM,
        (error, derivedKey) => {
          if (error) {
            reject(error);
          } else {
            resolve(derivedKey);
          }
        },
      );
    });
  }

  export async function hashPassword(
    password: string,
  ): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);

    const derivedKey = await deriveKey(
      password,
      salt,
      ITERATIONS,
    );

    return [
      HASH_FORMAT,
      ITERATIONS,
      salt.toString("base64url"),
      derivedKey.toString("base64url"),
    ].join("$");
  }

  export async function verifyPassword(
    password: string,
    storedHash: string,
  ): Promise<boolean> {
    const parts = storedHash.split("$");

    if (parts.length !== 4 || parts[0] !== HASH_FORMAT) {
      return false;
    }

    const iterationPart = parts[1];
    const saltPart = parts[2];
    const keyPart = parts[3];

    if (!iterationPart || !saltPart || !keyPart) {
      return false;
    }

    const iterations = Number(iterationPart);

    if (
      !Number.isInteger(iterations) ||
      iterations < 100_000 ||
      iterations > ITERATIONS
    ) {
      return false;
    }

    const salt = Buffer.from(saltPart, "base64url");
    const storedKey = Buffer.from(keyPart, "base64url");

    if (
      salt.length !== SALT_LENGTH ||
      storedKey.length !== KEY_LENGTH ||
      salt.toString("base64url") !== parts[2] ||
      storedKey.toString("base64url") !== parts[3]
    ) {
      return false;
    }

    const derivedKey = await deriveKey(
      password,
      salt,
      iterations,
    );

    return timingSafeEqual(derivedKey, storedKey);
  }
