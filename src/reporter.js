/**
 * reporter.js
 * Aggregates and summarizes route usage stats collected during a session.
 */

const stats = new Map();

/**
 * Record a hit for a given route.
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - Route path
 * @param {number} statusCode - Response status code
 * @param {number} duration - Request duration in ms
 */
function recordHit(method, path, statusCode, duration) {
  const key = `${method.toUpperCase()} ${path}`;
  if (!stats.has(key)) {
    stats.set(key, {
      method: method.toUpperCase(),
      path,
      hits: 0,
      errors: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: -Infinity,
    });
  }
  const entry = stats.get(key);
  entry.hits += 1;
  entry.totalDuration += duration;
  if (duration < entry.minDuration) entry.minDuration = duration;
  if (duration > entry.maxDuration) entry.maxDuration = duration;
  if (statusCode >= 400) entry.errors += 1;
}

/**
 * Return a summary report of all recorded route stats.
 * @returns {Array<Object>}
 */
function getSummary() {
  return Array.from(stats.values()).map((entry) => ({
    route: `${entry.method} ${entry.path}`,
    hits: entry.hits,
    errors: entry.errors,
    avgDuration:
      entry.hits > 0 ? Math.round(entry.totalDuration / entry.hits) : 0,
    minDuration: entry.minDuration === Infinity ? 0 : entry.minDuration,
    maxDuration: entry.maxDuration === -Infinity ? 0 : entry.maxDuration,
  }));
}

/**
 * Return stats for a single route, or null if not found.
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - Route path
 * @returns {Object|null}
 */
function getRoute(method, path) {
  const key = `${method.toUpperCase()} ${path}`;
  const entry = stats.get(key);
  if (!entry) return null;
  return {
    route: `${entry.method} ${entry.path}`,
    hits: entry.hits,
    errors: entry.errors,
    avgDuration:
      entry.hits > 0 ? Math.round(entry.totalDuration / entry.hits) : 0,
    minDuration: entry.minDuration === Infinity ? 0 : entry.minDuration,
    maxDuration: entry.maxDuration === -Infinity ? 0 : entry.maxDuration,
  };
}

/**
 * Clear all recorded stats (useful between tests or sessions).
 */
function resetStats() {
  stats.clear();
}

module.exports = { recordHit, getSummary, getRoute, resetStats };
