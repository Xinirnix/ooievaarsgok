import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alikes like l/1, o/0

export function slug(length = 8): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function secret(): string {
  return randomBytes(24).toString("base64url");
}

export function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function matches(token: unknown, storedHash: string): boolean {
  if (typeof token !== "string" || !token) return false;
  const a = Buffer.from(hash(token), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
