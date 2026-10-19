import test from 'node:test';
import assert from 'node:assert/strict';
import { isPrivateOrReservedHost, validateWebhookDestination } from '../lib/integrations/engine.ts';
import { leadRequestSchema, maskEmail, sanitizeInput } from '../lib/security/index.ts';

test('SSRF Protection - private and reserved IP/host detection', () => {
  // Localhost variations
  assert.equal(isPrivateOrReservedHost('localhost'), true);
  assert.equal(isPrivateOrReservedHost('127.0.0.1'), true);
  assert.equal(isPrivateOrReservedHost('127.10.0.1'), true);
  assert.equal(isPrivateOrReservedHost('service.local'), true);
  assert.equal(isPrivateOrReservedHost('db.internal'), true);

  // AWS/GCP Cloud Metadata IP
  assert.equal(isPrivateOrReservedHost('169.254.169.254'), true);
  assert.equal(isPrivateOrReservedHost('169.254.1.1'), true);

  // RFC1918 Private Ranges
  assert.equal(isPrivateOrReservedHost('10.0.0.1'), true);
  assert.equal(isPrivateOrReservedHost('10.254.0.1'), true);
  assert.equal(isPrivateOrReservedHost('172.16.0.1'), true);
  assert.equal(isPrivateOrReservedHost('172.31.255.255'), true);
  assert.equal(isPrivateOrReservedHost('192.168.1.1'), true);
  assert.equal(isPrivateOrReservedHost('192.168.0.100'), true);

  // IPv6 loopback and private
  assert.equal(isPrivateOrReservedHost('::1'), true);
  assert.equal(isPrivateOrReservedHost('fe80::1'), true);

  // Legitimate public hosts
  assert.equal(isPrivateOrReservedHost('hooks.zapier.com'), false);
  assert.equal(isPrivateOrReservedHost('api.hubspot.com'), false);
  assert.equal(isPrivateOrReservedHost('xaivon.com'), false);
});

test('SSRF Protection - validateWebhookDestination rejects unapproved or insecure URLs', () => {
  // Insecure protocol
  assert.throws(() => {
    validateWebhookDestination('http://hooks.zapier.com/catch/123');
  }, /Insecure protocol/);

  // Private network SSRF attempt
  assert.throws(() => {
    validateWebhookDestination('https://169.254.169.254/latest/meta-data/');
  }, /private or internal/);

  assert.throws(() => {
    validateWebhookDestination('https://localhost:8080/admin');
  }, /private or internal/);

  // Unapproved external host
  assert.throws(() => {
    validateWebhookDestination('https://attacker.evil.com/exfiltrate');
  }, /not in the approved integration allowlist/);

  // Approved host and valid HTTPS
  const approvedUrl = validateWebhookDestination('https://hooks.zapier.com/hooks/catch/123/abc');
  assert.equal(approvedUrl.hostname, 'hooks.zapier.com');
  assert.equal(approvedUrl.protocol, 'https:');
});

test('Lead Schema - Unicode and International name validation', () => {
  // English names
  const validEnglish = leadRequestSchema.safeParse({
    fullName: 'Jane Doe',
    email: 'jane@enterprise.com',
    company: 'Logistics Co',
  });
  assert.equal(validEnglish.success, true);

  // Devanagari / Hindi names (Unicode)
  const validHindi = leadRequestSchema.safeParse({
    fullName: 'राजा बाबू',
    email: 'raja@xaivon.com',
    company: 'अदाभ्रा ग्रुप',
  });
  assert.equal(validHindi.success, true, 'Should accept valid Devanagari Unicode name and company');

  // Accented Latin names
  const validAccented = leadRequestSchema.safeParse({
    fullName: 'José María González',
    email: 'jose@freight.mx',
    company: 'Transportes Rápidos',
  });
  assert.equal(validAccented.success, true, 'Should accept accented Latin names');

  // Single letter names should be rejected
  const invalidShortName = leadRequestSchema.safeParse({
    fullName: 'A',
    email: 'a@example.com',
    company: 'Valid Company',
  });
  assert.equal(invalidShortName.success, false);

  // Pure symbols or script injection attempt
  const hostileName = leadRequestSchema.safeParse({
    fullName: '<script>alert(1)</script>',
    email: 'test@example.com',
    company: 'Company',
  });
  assert.equal(hostileName.success, false);
});

test('PII Sanitization - maskEmail redaction', () => {
  assert.equal(maskEmail('raja@xaivon.com'), 'r***a@xaivon.com');
  assert.equal(maskEmail('alexander@example.com'), 'a***r@example.com');
  assert.equal(maskEmail('invalid-email'), '***');
});

test('Input Sanitization - payload boundary bounds', () => {
  const normal = sanitizeInput('  Normal user query  ');
  assert.equal(normal, 'Normal user query');

  const oversized = 'A'.repeat(5000);
  const sanitized = sanitizeInput(oversized);
  assert.equal(sanitized.length, 2000);
});
