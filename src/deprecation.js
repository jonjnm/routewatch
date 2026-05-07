/**
 * deprecation.js
 * Track and flag deprecated route usage in development.
 */

const deprecatedRoutes = new Map();

/**
 * Mark a route as deprecated with optional metadata.
 * @param {string} method - HTTP method (uppercase)
 * @param {string} path - Route path
 * @param {object} options - { message, sunset, replacement }
 */
function markDeprecated(method, path, options = {}) {
  const key = `${method.toUpperCase()}:${path}`;
  deprecatedRoutes.set(key, {
    method: method.toUpperCase(),
    path,
    message: options.message || `${method.toUpperCase()} ${path} is deprecated`,
    sunset: options.sunset || null,
    replacement: options.replacement || null,
    hits: 0,
    firstHit: null,
    lastHit: null,
  });
}

/**
 * Record a hit against a deprecated route.
 * @param {string} method
 * @param {string} path
 * @returns {object|null} deprecation entry or null if not deprecated
 */
function recordDeprecatedHit(method, path) {
  const key = `${method.toUpperCase()}:${path}`;
  const entry = deprecatedRoutes.get(key);
  if (!entry) return null;

  const now = new Date().toISOString();
  entry.hits += 1;
  if (!entry.firstHit) entry.firstHit = now;
  entry.lastHit = now;

  return { ...entry };
}

/**
 * Check if a route is deprecated.
 */
function isDeprecated(method, path) {
  return deprecatedRoutes.has(`${method.toUpperCase()}:${path}`);
}

/**
 * Get all deprecated route entries.
 */
function getDeprecatedRoutes() {
  return Array.from(deprecatedRoutes.values()).map((e) => ({ ...e }));
}

/**
 * Get a single deprecated route entry.
 */
function getDeprecatedRoute(method, path) {
  const entry = deprecatedRoutes.get(`${method.toUpperCase()}:${path}`);
  return entry ? { ...entry } : null;
}

function resetDeprecations() {
  deprecatedRoutes.clear();
}

module.exports = {
  markDeprecated,
  recordDeprecatedHit,
  isDeprecated,
  getDeprecatedRoutes,
  getDeprecatedRoute,
  resetDeprecations,
};
