import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

import { POST as sessionsHandler } from '../app/api/sessions/route.ts';
import { POST as leadsHandler } from '../app/api/leads/route.ts';
import { POST as parseDocHandler } from '../app/api/parse-document/route.ts';
import { POST as chatHandler } from '../app/api/chat/route.ts';
import { verifySessionToken, signSessionId } from '../lib/security/session.ts';
import { sanitizeLogData, chatRequestSchema } from '../lib/security/index.ts';

// ---------------------------------------------------------------------
// 1. Sessions API Route Handler
// ---------------------------------------------------------------------
test('API Handler: /api/sessions mints cryptographically valid 3-part token', async () => {
  const req = new Request('http://localhost:3000/api/sessions', {
    method: 'POST',
    headers: { 'x-real-ip': '103.21.244.10' }
  });

  const res = await sessionsHandler(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.ok(typeof data.sessionId === 'string' && data.sessionId.length > 10);
  assert.ok(typeof data.sessionToken === 'string');
  assert.equal(typeof data.persisted, 'boolean');
  assert.ok(data.mode === 'persistent' || data.mode === 'stateless_in_memory');

  // Verify minted token
  const verified = verifySessionToken(data.sessionToken);
  assert.equal(verified.valid, true);
  assert.equal(verified.sessionId, data.sessionId);
});

test('API Handler: /api/sessions enforces rate limits', async () => {
  const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
  let lastRes;

  for (let i = 0; i < 22; i++) {
    const req = new Request('http://localhost:3000/api/sessions', {
      method: 'POST',
      headers: { 'x-vercel-forwarded-for': testIp }
    });
    lastRes = await sessionsHandler(req);
  }

  assert.equal(lastRes.status, 429);
  assert.ok(lastRes.headers.get('Retry-After'));
});

// ---------------------------------------------------------------------
// 2. Leads API Route Handler
// ---------------------------------------------------------------------
test('API Handler: /api/leads returns honest 503 with mailto fallback when DB unconfigured', async () => {
  const req = new Request('http://localhost:3000/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-real-ip': '198.51.100.45'
    },
    body: JSON.stringify({
      fullName: 'Vikram Malhotra',
      email: 'vikram@logistics-india.in',
      company: 'North Express Logistics',
      phone: '+919876543210'
    })
  });

  const res = await leadsHandler(req);
  // In dev/test without live Supabase credentials, returns 503
  assert.equal(res.status, 503);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(typeof data.fallbackMailto === 'string');
  assert.ok(data.fallbackMailto.includes('mailto:raja@xaivon.com'));
});

test('API Handler: /api/leads honeypot silently succeeds without DB write', async () => {
  const req = new Request('http://localhost:3000/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-real-ip': '198.51.100.46'
    },
    body: JSON.stringify({
      fullName: 'Bot User',
      email: 'bot@spam.com',
      company: 'Spam Corp',
      website: 'http://spamsite.xyz' // Honeypot field
    })
  });

  const res = await leadsHandler(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
});

test('API Handler: /api/leads rejects invalid international phone format', async () => {
  const req = new Request('http://localhost:3000/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-real-ip': '198.51.100.47'
    },
    body: JSON.stringify({
      fullName: 'Rahul Sharma',
      email: 'rahul@sharma.com',
      company: 'Freight Line',
      phone: '123' // Invalid phone format
    })
  });

  const res = await leadsHandler(req);
  assert.equal(res.status, 400);
});

// ---------------------------------------------------------------------
// 3. Document Parser Route Handler
// ---------------------------------------------------------------------
test('API Handler: /api/parse-document rejects oversized Content-Length early', async () => {
  const req = new Request('http://localhost:3000/api/parse-document', {
    method: 'POST',
    headers: {
      'Content-Length': String(6 * 1024 * 1024 + 100), // 6MB+
      'x-real-ip': '198.51.100.50'
    }
  });

  const res = await parseDocHandler(req);
  assert.equal(res.status, 413);
  const data = await res.json();
  assert.ok(data.error.includes('exceeds maximum allowed size'));
});

test('API Handler: /api/parse-document PDFParse execution verification', async () => {
  const { PDFParse } = require('pdf-parse');
  const minimalPdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 300 144]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF';
  const buf = Buffer.from(minimalPdf);

  const parser = new PDFParse({ data: buf });
  try {
    const data = await parser.getText();
    assert.ok(data !== null && typeof data === 'object');
    assert.equal(typeof data.text, 'string');
    assert.equal(data.total, 1);
  } finally {
    if (typeof parser.destroy === 'function') {
      await parser.destroy();
    }
  }
});

// ---------------------------------------------------------------------
// 4. Chat API Route Handler & Schema Boundaries
// ---------------------------------------------------------------------
test('API Handler: /api/chat schema rejects empty messages or oversized message text', () => {
  // Empty messages
  const emptyRes = chatRequestSchema.safeParse({ messages: [] });
  assert.equal(emptyRes.success, false);

  // Oversized text (>4000 characters)
  const hugeText = 'A'.repeat(5000);
  const hugeRes = chatRequestSchema.safeParse({
    messages: [{ role: 'user', content: hugeText }]
  });
  assert.equal(hugeRes.success, false);

  // Valid structured message
  const validRes = chatRequestSchema.safeParse({
    messages: [{ role: 'user', content: 'What are your starting prices?' }]
  });
  assert.equal(validRes.success, true);
});

test('API Handler: /api/chat returns honest 503 when GROQ_API_KEY is not configured', async () => {
  const origKey = process.env.GROQ_API_KEY;
  try {
    process.env.GROQ_API_KEY = '';

    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-real-ip': '198.51.100.60'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });

    const res = await chatHandler(req);
    assert.equal(res.status, 503);
    const data = await res.json();
    assert.ok(data.error.includes('awaiting provider credential activation'));
  } finally {
    process.env.GROQ_API_KEY = origKey;
  }
});

// ---------------------------------------------------------------------
// 5. Session Cryptography & Production Expiry
// ---------------------------------------------------------------------
test('Session Security: Production rejects legacy 2-part tokens without timestamp expiry', () => {
  const origEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    process.env.SESSION_SECRET = 'a_very_strong_production_secret_with_more_than_32_characters';

    const legacyToken = '550e8400-e29b-41d4-a716-446655440000.1234567890abcdef';
    const result = verifySessionToken(legacyToken);
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'legacy_tokens_deprecated_in_production');

    // Modern 3-part token passes in production
    const validToken = signSessionId('550e8400-e29b-41d4-a716-446655440000');
    const validResult = verifySessionToken(validToken);
    assert.equal(validResult.valid, true);
    assert.equal(validResult.sessionId, '550e8400-e29b-41d4-a716-446655440000');
  } finally {
    process.env.NODE_ENV = origEnv;
  }
});

// ---------------------------------------------------------------------
// 6. Recursive Telemetry Sanitization
// ---------------------------------------------------------------------
test('Telemetry: sanitizeLogData recursively masks secrets, keys, and PII', () => {
  const dirty = {
    apiKey: 'gsk_secret_value_123',
    nested: {
      password: 'mypassword',
      email: 'customer@enterprise.com',
      phone: '+919876543210',
      safeField: 'audit_event'
    },
    authorization: 'Bearer eyJhbGciOi...',
    hugeString: 'X'.repeat(500)
  };

  const clean = sanitizeLogData(dirty);
  assert.equal(clean.apiKey, '[REDACTED]');
  assert.equal(clean.authorization, '[REDACTED]');
  assert.equal(clean.nested.password, '[REDACTED]');
  assert.equal(clean.nested.phone, '[REDACTED]');
  assert.equal(clean.nested.email, 'c***r@enterprise.com');
  assert.equal(clean.nested.safeField, 'audit_event');
  assert.ok(clean.hugeString.includes('[TRUNCATED]'));
});
