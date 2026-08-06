import { randomBytes } from "crypto";

/** High-entropy URL-safe token. Stored raw for MVP (document limitation). */
export function generateProposalPublicToken(): string {
  return randomBytes(32).toString("base64url");
}
