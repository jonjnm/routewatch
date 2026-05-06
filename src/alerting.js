/**
 * alerting.js
 * Threshold-based alerting for route usage anomalies.
 * Fires user-supplied callbacks when hit counts or error rates exceed limits.
 */

const DEFAULT_OPTIONS = {
  maxHitsPerMinute: null,
  maxErrorRate: null,   // 0.0 – 1.0
  onAlert: null,        // (type, route, value) => void
};

let alertOptions = { ...DEFAULT_OPTIONS };

// Rolling window: { route -> [timestamps] }
const hitWindows = {};

// Error tracking: { route -> { errors, total } }
const errorCounts = {};

function configureAlerts(options = {}) {
  alertOptions = { ...DEFAULT_OPTIONS, ...options };
}

function recordAlertHit(route, isError = false) {
  const now = Date.now();

  // --- hits-per-minute check ---
  if (alertOptions.maxHitsPerMinute !== null) {
    if (!hitWindows[route]) hitWindows[route] = [];
    hitWindows[route].push(now);
    // prune entries older than 60 s
    hitWindows[route] = hitWindows[route].filter(t => now - t < 60_000);

    if (hitWindows[route].length > alertOptions.maxHitsPerMinute) {
      _fire('HIGH_TRAFFIC', route, hitWindows[route].length);
    }
  }

  // --- error-rate check ---
  if (alertOptions.maxErrorRate !== null) {
    if (!errorCounts[route]) errorCounts[route] = { errors: 0, total: 0 };
    errorCounts[route].total += 1;
    if (isError) errorCounts[route].errors += 1;

    const rate = errorCounts[route].errors / errorCounts[route].total;
    if (rate > alertOptions.maxErrorRate && errorCounts[route].total >= 5) {
      _fire('HIGH_ERROR_RATE', route, rate);
    }
  }
}

function _fire(type, route, value) {
  if (typeof alertOptions.onAlert === 'function') {
    alertOptions.onAlert(type, route, value);
  }
}

function resetAlerts() {
  Object.keys(hitWindows).forEach(k => delete hitWindows[k]);
  Object.keys(errorCounts).forEach(k => delete errorCounts[k]);
  alertOptions = { ...DEFAULT_OPTIONS };
}

function getAlertState() {
  return { hitWindows: { ...hitWindows }, errorCounts: { ...errorCounts } };
}

module.exports = { configureAlerts, recordAlertHit, resetAlerts, getAlertState };
