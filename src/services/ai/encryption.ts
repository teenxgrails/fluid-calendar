import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  // DO NOT rename this literal. It is the key-derivation fallback for
  // AES-256-GCM: deployments without AI_ENCRYPTION_KEY/NEXTAUTH_SECRET have
  // their stored AI keys encrypted under a key derived from this exact string.
  // Changing it makes those secrets permanently undecryptable. The "flowday"
  // spelling is intentional and must survive any Needt rebrand pass.
  const secret =
    process.env.AI_ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    "flowday-local-ai-secret";

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(value: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptSecret(value: string | null | undefined): string | null {
  if (!value) return null;

  const [iv, tag, encrypted] = value
    .split(".")
    .map((part) => Buffer.from(part, "base64url"));

  if (!iv || !tag || !encrypted) return null;

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8"
  );
}
