/**
 * Lightweight member session using signed JWT stored in an HttpOnly cookie.
 * No database session table needed — email + expiry is embedded in the token.
 */

const SECRET = process.env.MEMBER_SESSION_SECRET || "member-session-fallback-secret-change-in-prod";
const COOKIE_NAME = "member_session";
const SESSION_DURATION_HOURS = 24;

// Simple base64url helpers (edge-compatible, no crypto module needed)
function base64url(str: string): string {
  return Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function fromBase64url(str: string): string {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
}

// HMAC-SHA256 signature using Web Crypto API (available in Next.js edge & Node)
async function sign(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Buffer.from(sig).toString("base64url");
}

async function verify(data: string, signature: string): Promise<boolean> {
  const expected = await sign(data);
  return expected === signature;
}

export async function createMemberToken(email: string): Promise<string> {
  const payload = base64url(JSON.stringify({
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_HOURS * 3600,
  }));
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const unsigned = `${header}.${payload}`;
  const signature = await sign(unsigned);
  return `${unsigned}.${signature}`;
}

export async function verifyMemberToken(token: string): Promise<string | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const unsigned = `${header}.${payload}`;
    if (!(await verify(unsigned, signature))) return null;
    const { email, exp } = JSON.parse(fromBase64url(payload));
    if (exp < Math.floor(Date.now() / 1000)) return null;
    return email as string;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
