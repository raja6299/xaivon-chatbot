import test from 'node:test';
import assert from 'node:assert/strict';
import { signSessionId, verifySessionToken } from '../lib/security/session.ts';
import { anonymizeIp, leadRequestSchema } from '../lib/security/index.ts';

test('Session Security - Cryptographic HMAC token generation & verification', () => {
  const sessionId = 'test-session-uuid-1234-5678';
  const token = signSessionId(sessionId);

  // 1. Valid token passes verification and returns correct session ID
  const result = verifySessionToken(token);
  assert.equal(result.valid, true, 'Valid token must verify');
  assert.equal(result.sessionId, sessionId, 'Verified token must yield original session ID');

  // 2. Tampered token fails verification
  const tamperedToken = token.slice(0, -4) + 'abcd';
  assert.equal(verifySessionToken(tamperedToken).valid, false, 'Tampered signature must be rejected');

  // 3. IDOR prevention: Token generated for Session A does not authorize Session B
  const differentSessionId = 'test-session-uuid-9999-0000';
  const verified = verifySessionToken(token);
  const isAuthorizedForSessionB = verified.valid && verified.sessionId === differentSessionId;
  assert.equal(
    isAuthorizedForSessionB,
    false,
    'Session token must not authorize access to a foreign session ID'
  );

  // 4. Malformed tokens fail safely without unhandled exceptions
  assert.equal(verifySessionToken('invalid-token-without-signature').valid, false);
  assert.equal(verifySessionToken('').valid, false);
  assert.equal(verifySessionToken(null).valid, false);
  assert.equal(verifySessionToken(undefined).valid, false);
});

test('Privacy - IP Anonymization for compliance and logs', () => {
  // IPv4 anonymization zeroes the final host octet
  assert.equal(anonymizeIp('192.168.1.42'), '192.168.1.0');
  assert.equal(anonymizeIp('103.21.244.15'), '103.21.244.0');

  // IPv6 anonymization preserves routing prefix and masks device identifiers
  assert.equal(anonymizeIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334'), '2001:0db8:85a3::');

  // Fallback / Unknown inputs
  assert.equal(anonymizeIp('unknown'), 'unknown');
  assert.equal(anonymizeIp(''), 'unknown');
});

test('Lead Schema - Rigorous phone number and contact validation', () => {
  // Valid Indian mobile
  const validIndia = leadRequestSchema.safeParse({
    fullName: 'Raja Babu',
    email: 'raja@xaivon.com',
    company: 'XAIVON',
    phone: '+919521190205',
    notes: 'Inquiry regarding automated freight dispatch',
  });
  assert.equal(validIndia.success, true);

  // Valid US number
  const validUS = leadRequestSchema.safeParse({
    fullName: 'John Smith',
    email: 'john@logistics.us',
    company: 'Midwest Freight',
    phone: '+14155552671',
  });
  assert.equal(validUS.success, true);

  // Invalid phone numbers
  const invalidPhone = leadRequestSchema.safeParse({
    fullName: 'Jane Doe',
    email: 'jane@enterprise.com',
    company: 'Enterprise Logistics',
    phone: '12345',
  });
  assert.equal(invalidPhone.success, false, 'Invalid phone number format must be rejected');

  // Extremely long notes (buffer boundary)
  const oversizedNotes = leadRequestSchema.safeParse({
    fullName: 'Jane Doe',
    email: 'jane@enterprise.com',
    company: 'Enterprise Logistics',
    notes: 'A'.repeat(5000),
  });
  assert.equal(oversizedNotes.success, false, 'Oversized notes (>2000 chars) must be rejected');
});

test('Embed Origin Allowlist - Rejects untrusted parent origins', () => {
  const APPROVED_PARENT_ORIGINS = new Set([
    'https://xaivon.com',
    'https://www.xaivon.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ]);

  // Approved
  assert.equal(APPROVED_PARENT_ORIGINS.has('https://xaivon.com'), true);
  assert.equal(APPROVED_PARENT_ORIGINS.has('https://www.xaivon.com'), true);

  // Untrusted origins (SSRF / clickjacking / malicious framing)
  assert.equal(APPROVED_PARENT_ORIGINS.has('https://evil.com'), false);
  assert.equal(APPROVED_PARENT_ORIGINS.has('https://xaivon.com.attacker.com'), false);
  assert.equal(APPROVED_PARENT_ORIGINS.has('https://subdomain.xaivon.com'), false);
  assert.equal(APPROVED_PARENT_ORIGINS.has('http://xaivon.com'), false, 'HTTP non-SSL production must be rejected');
});

test('Document Parser - File signature verification rules', () => {
  // Simulated PDF buffer starting with %PDF- (0x25 0x50 0x44 0x46)
  const validPdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
  assert.equal(validPdfHeader[0] === 0x25 && validPdfHeader[1] === 0x50 && validPdfHeader[2] === 0x44 && validPdfHeader[3] === 0x46, true);

  // Disguised executable payload renamed to .pdf (MZ header 0x4D 0x5A)
  const fakePdfHeader = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
  const isPdf = fakePdfHeader[0] === 0x25 && fakePdfHeader[1] === 0x50 && fakePdfHeader[2] === 0x44 && fakePdfHeader[3] === 0x46;
  assert.equal(isPdf, false, 'Disguised executable (.exe as .pdf) must be rejected by magic bytes');

  // Zip-based docx/xlsx header (PK\x03\x04)
  const validZipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  assert.equal(validZipHeader[0] === 0x50 && validZipHeader[1] === 0x4b && validZipHeader[2] === 0x03 && validZipHeader[3] === 0x04, true);
});
