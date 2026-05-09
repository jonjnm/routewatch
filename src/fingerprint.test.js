const {
  recordFingerprint,
  getFingerprintStats,
  getAllFingerprintStats,
  isUniqueFingerprint,
  resetFingerprints,
} = require('./fingerprint');

function makeReq(ip = '127.0.0.1', ua = 'TestAgent/1.0') {
  return {
    ip,
    headers: { 'user-agent': ua },
  };
}

beforeEach(() => {
  resetFingerprints();
});

test('recordFingerprint returns a fingerprint string', () => {
  const fp = recordFingerprint('/api/test', makeReq());
  expect(typeof fp).toBe('string');
  expect(fp).toContain('127.0.0.1');
  expect(fp).toContain('TestAgent/1.0');
});

test('getFingerprintStats returns null for unknown route', () => {
  expect(getFingerprintStats('/unknown')).toBeNull();
});

test('getFingerprintStats tracks unique callers and total hits', () => {
  const route = '/api/items';
  recordFingerprint(route, makeReq('1.1.1.1', 'AgentA'));
  recordFingerprint(route, makeReq('1.1.1.1', 'AgentA'));
  recordFingerprint(route, makeReq('2.2.2.2', 'AgentB'));

  const stats = getFingerprintStats(route);
  expect(stats.route).toBe(route);
  expect(stats.uniqueCallers).toBe(2);
  expect(stats.totalHits).toBe(3);
  expect(stats.fingerprints).toHaveLength(2);
});

test('getAllFingerprintStats returns entries for all recorded routes', () => {
  recordFingerprint('/a', makeReq());
  recordFingerprint('/b', makeReq('9.9.9.9', 'OtherAgent'));

  const all = getAllFingerprintStats();
  expect(all).toHaveLength(2);
  const routes = all.map(s => s.route);
  expect(routes).toContain('/a');
  expect(routes).toContain('/b');
});

test('isUniqueFingerprint returns true for first-time caller', () => {
  expect(isUniqueFingerprint('/api/new', makeReq())).toBe(true);
});

test('isUniqueFingerprint returns false after same caller recorded', () => {
  const req = makeReq('5.5.5.5', 'SameAgent');
  recordFingerprint('/api/repeat', req);
  expect(isUniqueFingerprint('/api/repeat', req)).toBe(false);
});

test('resetFingerprints clears all state', () => {
  recordFingerprint('/api/x', makeReq());
  resetFingerprints();
  expect(getFingerprintStats('/api/x')).toBeNull();
  expect(getAllFingerprintStats()).toHaveLength(0);
});

test('handles missing ip and user-agent gracefully', () => {
  const req = { headers: {} };
  const fp = recordFingerprint('/api/fallback', req);
  expect(fp).toContain('unknown');
});
