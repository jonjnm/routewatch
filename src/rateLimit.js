/**
 * rateLimit.js
 * Tracks request rates per route and flags routes exceeding a threshold
 * within a rolling time window.
 */

const routeWindows = new Map();

/**
 * @param {string} route - e.g. "GET /api/users"
 * @param {number} windowMs - rolling window in milliseconds
 * @param {number} maxRequests - max allowed requests in window
 * @returns {{ limited: boolean, count: number, remaining: number }}
 */
function checkRateLimit(route, windowMs, maxRequests) {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (!routeWindows.has(route)) {
    routeWindows.set(route, []);
  }

  const timestamps = routeWindows.get(route).filter(ts => ts > cutoff);
  timestamps.push(now);
  routeWindows.set(route, timestamps);

  const count = timestamps.length;
  const limited = count > maxRequests;
  const remaining = Math.max(0, maxRequests - count);

  return { limited, count, remaining };
}

/**
 * Returns the current hit timestamps for a route (for inspection/testing).
 * @param {string} route
 * @returns {number[]}
 */
function getWindow(route) {
  return routeWindows.get(route) ? [...routeWindows.get(route)] : [];
}

/**
 * Clears all rate limit state. Useful for tests.
 */
function resetRateLimits() {
  routeWindows.clear();
}

module.exports = { checkRateLimit, getWindow, resetRateLimits };
