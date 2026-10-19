import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit } from '../lib/security/index.ts';

test('Rate Limiter - Enforces sliding window limits and returns retryAfter', () => {
  const testId = `test_rate_limit_${Date.now()}`;
  const limit = 3;
  const windowMs = 5000;

  // Requests 1, 2, 3 should succeed
  assert.equal(checkRateLimit(testId, limit, windowMs).success, true);
  assert.equal(checkRateLimit(testId, limit, windowMs).success, true);
  assert.equal(checkRateLimit(testId, limit, windowMs).success, true);

  // Request 4 should be throttled
  const throttled = checkRateLimit(testId, limit, windowMs);
  assert.equal(throttled.success, false);
  assert.ok(typeof throttled.retryAfter === 'number');
  assert.ok(throttled.retryAfter > 0 && throttled.retryAfter <= 5);
});
