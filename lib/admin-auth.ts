import crypto from 'crypto';

/**
 * Timing-safe admin password verification.
 * Prevents timing attacks that could extract the password character by character.
 */
export function verifyAdminPassword(password: string | null | undefined): boolean {
  const adminPwd = process.env.ADMIN_PASSWORD;
  if (!password || !adminPwd) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(adminPwd);
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
