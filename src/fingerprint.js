/**
 * fingerprint.js
 * Tracks unique caller fingerprints per route based on IP, method, and user-agent.
 */

const store = {};

function resetFingerprints() {
  Object.keys(store).forEach(k => delete store[k]);
}

function _makeFingerprint(req) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const ua = (req.headers && req.headers['user-agent']) || 'unknown';
  return `${ip}|${ua}`;
}

function _ensureRoute(route) {
  if (!store[route]) {
    store[route] = { fingerprints: new Set(), total: 0 };
  }
}

function recordFingerprint(route, req) {
  _ensureRoute(route);
  const fp = _makeFingerprint(req);
  store[route].fingerprints.add(fp);
  store[route].total += 1;
  return fp;
}

function getFingerprintStats(route) {
  if (!store[route]) return null;
  return {
    route,
    uniqueCallers: store[route].fingerprints.size,
    totalHits: store[route].total,
    fingerprints: Array.from(store[route].fingerprints),
  };
}

function getAllFingerprintStats() {
  return Object.keys(store).map(route => getFingerprintStats(route));
}

function isUniqueFingerprint(route, req) {
  _ensureRoute(route);
  const fp = _makeFingerprint(req);
  return !store[route].fingerprints.has(fp);
}

module.exports = {
  recordFingerprint,
  getFingerprintStats,
  getAllFingerprintStats,
  isUniqueFingerprint,
  resetFingerprints,
};
