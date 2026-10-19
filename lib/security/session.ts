import crypto from 'crypto';

/**
 * Server-side secret for HMAC session signing.
 * Derives from SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY with fallback.
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'xaivon_session_hmac_secret_key_v2_2026';
  return secret;
}

/**
 * Signs a session ID using HMAC-SHA256.
 * Output format: <sessionId>.<16-char-hex-hmac>
 */
export function signSessionId(sessionId: string): string {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Invalid session ID for signing');
  }
  const secret = getSessionSecret();
  const hmac = crypto.createHmac('sha256', secret).update(sessionId).digest('hex').slice(0, 16);
  return `${sessionId}.${hmac}`;
}

/**
 * Cryptographically verifies a signed session token.
 * Prevents IDOR and arbitrary cross-session message injection.
 */
export function verifySessionToken(token: string | null | undefined): { valid: boolean; sessionId?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false };
  }

  const [sessionId, providedHmac] = parts;
  if (!sessionId || !providedHmac || providedHmac.length !== 16) {
    return { valid: false };
  }

  const secret = getSessionSecret();
  const expectedHmac = crypto.createHmac('sha256', secret).update(sessionId).digest('hex').slice(0, 16);

  try {
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(providedHmac, 'hex'),
      Buffer.from(expectedHmac, 'hex')
    );

    if (isMatch) {
      return { valid: true, sessionId };
    }
  } catch {
    return { valid: false };
  }

  return { valid: false };
}
