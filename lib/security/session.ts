import crypto from 'crypto';

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days validity

/**
 * Server-side secret for cryptographic HMAC session signing.
 * In production: strictly enforces strong dedicated SESSION_SECRET (min 32 chars) and fails closed.
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.trim().length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL_SECURITY_CONFIGURATION_ERROR: Dedicated SESSION_SECRET with at least 32 characters of entropy is mandatory in production. Fails closed to protect visitor sessions.'
      );
    }
    // Safe dev/test secret for local development and test suite
    return (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      'xaivon_development_session_hmac_secret_minimum_32_chars_entropy_key'
    );
  }
  return secret.trim();
}

/**
 * Signs a session ID using HMAC-SHA256 with timestamp expiry.
 * Token Format: <sessionId>.<expiryTimestamp>.<64-char-hex-hmac>
 */
export function signSessionId(sessionId: string, customTtlMs = TOKEN_EXPIRY_MS): string {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Invalid session ID for signing');
  }
  const secret = getSessionSecret();
  const expiry = Date.now() + customTtlMs;
  const payloadToSign = `${sessionId}:${expiry}`;
  const hmac = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');
  return `${sessionId}.${expiry}.${hmac}`;
}

/**
 * Cryptographically verifies a signed session token.
 * Prevents IDOR, token forgery, tampering, and session replay past expiration.
 */
export function verifySessionToken(token: string | null | undefined): {
  valid: boolean;
  sessionId?: string;
  reason?: string;
} {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'missing_token' };
  }

  const parts = token.split('.');

  // Modern 3-part format: <sessionId>.<expiryTimestamp>.<hmac>
  if (parts.length === 3) {
    const [sessionId, expiryStr, providedHmac] = parts;
    if (!sessionId || !expiryStr || !providedHmac || providedHmac.length !== 64) {
      return { valid: false, reason: 'malformed_token' };
    }

    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry) || expiry < Date.now()) {
      return { valid: false, reason: 'expired' };
    }

    try {
      const secret = getSessionSecret();
      const payloadToSign = `${sessionId}:${expiryStr}`;
      const expectedHmac = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');

      const isMatch = crypto.timingSafeEqual(
        Buffer.from(providedHmac, 'hex'),
        Buffer.from(expectedHmac, 'hex')
      );

      if (isMatch) {
        return { valid: true, sessionId };
      }
    } catch {
      return { valid: false, reason: 'verification_failed' };
    }
  }

  // Backward compatibility migration path for legacy 2-part tokens: <sessionId>.<16-char-hmac>
  if (parts.length === 2) {
    const [sessionId, providedHmac] = parts;
    if (!sessionId || !providedHmac || (providedHmac.length !== 16 && providedHmac.length !== 64)) {
      return { valid: false, reason: 'malformed_legacy_token' };
    }

    try {
      const secret = getSessionSecret();
      const expectedHmac = crypto
        .createHmac('sha256', secret)
        .update(sessionId)
        .digest('hex')
        .slice(0, providedHmac.length);

      const isMatch = crypto.timingSafeEqual(
        Buffer.from(providedHmac, 'hex'),
        Buffer.from(expectedHmac, 'hex')
      );

      if (isMatch) {
        return { valid: true, sessionId };
      }
    } catch {
      return { valid: false, reason: 'legacy_verification_failed' };
    }
  }

  return { valid: false, reason: 'invalid_format' };
}
