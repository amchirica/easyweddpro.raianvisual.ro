import { randomBytes } from "crypto";

import { hashTokenSha256 } from "@/lib/contracts/hash";

/** Cryptographically secure URL-safe token (32 bytes). */
export function generateContractPublicToken(): string {
  return randomBytes(32).toString("base64url");
}

export function generatePortalToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashPublicToken(token: string): string {
  return hashTokenSha256(token);
}
