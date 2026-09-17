import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

const ISSUER = "Idea Exchange";

// A fresh secret + otpauth:// URI + scannable QR for the enrollment screen.
// Nothing is persisted here — the setup action only writes twoFactorSecret
// once the admin proves they can generate a matching code with it.
export async function generateEnrollment(email: string) {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    secret: new OTPAuth.Secret({ size: 20 }),
  });

  return {
    base32Secret: totp.secret.base32,
    otpauthUrl: totp.toString(),
    qrDataUrl: await QRCode.toDataURL(totp.toString()),
  };
}

// window: 1 tolerates the code just before/after now (±30s of clock drift),
// same default otpauth itself ships with.
export function verifyCode(base32Secret: string, code: string, window = 1): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    secret: OTPAuth.Secret.fromBase32(base32Secret),
  });
  return totp.validate({ token: code, window }) !== null;
}
