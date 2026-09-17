import { SignJWT, jwtVerify } from "jose";

// Tracks "this browser passed a TOTP challenge for this user within the last
// 12h" — deliberately a separate signed cookie rather than a field on the
// NextAuth session JWT. NextAuth's own session cookie is re-issued from a
// plain client-side update() call with no server-side proof attached, which
// would let anyone with an authenticated tab flip a security-sensitive flag
// without ever entering a code. This cookie is only ever written by the
// verify/setup Server Actions, after they've independently confirmed the
// code — proof lives in *when* the cookie was signed, not in its payload.
export const STEP_UP_COOKIE = "totp-verified";
const STEP_UP_TTL_SECONDS = 12 * 60 * 60; // 12 hours

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

export async function signStepUpToken(userId: string): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${STEP_UP_TTL_SECONDS}s`)
    .sign(secretKey());
}

// Verifies a step-up token was both validly signed AND issued for this
// specific user — a valid token for a different account must not pass here.
export async function isStepUpValid(
  token: string | undefined,
  userId: string,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return payload.uid === userId;
  } catch {
    return false;
  }
}

export const STEP_UP_COOKIE_MAX_AGE = STEP_UP_TTL_SECONDS;
