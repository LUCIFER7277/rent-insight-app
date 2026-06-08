import crypto from "node:crypto";
export function ulid(): string {
  return crypto.randomUUID();
}
