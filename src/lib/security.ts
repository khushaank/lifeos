/**
 * Cryptographic helper to hash string outputs on Server Sides.
 * Uses native Web Crypto API with pure JS fallback to avoid Node.js module warnings.
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const subtle = typeof globalThis !== "undefined" && globalThis.crypto?.subtle;
    if (subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (e) {
    console.warn("WebCrypto digest failed, falling back to JS fallback:", e);
  }

  // Pure JS fallback
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return "fallback_" + Math.abs(hash).toString(16);
}

/**
 * Validates session signatures against server environment secrets
 */
export async function signSessionToken(payload: string, secret: string): Promise<string> {
  try {
    const subtle = typeof globalThis !== "undefined" && globalThis.crypto?.subtle;
    if (subtle) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const key = await subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signatureBuffer = await subtle.sign("HMAC", key, encoder.encode(payload));
      const signatureArray = Array.from(new Uint8Array(signatureBuffer));
      const signature = signatureArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      return `${payload}.${signature}`;
    }
  } catch (e) {
    console.warn("WebCrypto HMAC sign failed, falling back to JS signature:", e);
  }

  // Pure JS signature fallback
  const mockString = payload + secret;
  let hash = 0;
  for (let i = 0; i < mockString.length; i++) {
    const char = mockString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `${payload}.${Math.abs(hash).toString(16)}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expectedToken = await signSessionToken(payload, secret);
  return token === expectedToken;
}
