/**
 * filter.js
 * Utilities for filtering which routes get logged/tracked by routewatch.
 * Supports path patterns, HTTP methods, and status code ranges.
 */

/**
 * Build a filter function from a config object.
 * @param {Object} options
 * @param {string[]} [options.excludePaths]  - path prefixes to skip (e.g. ['/health', '/metrics'])
 * @param {string[]} [options.includeMethods] - only log these HTTP methods (e.g. ['GET', 'POST'])
 * @param {number[]} [options.excludeStatuses] - status codes to skip (e.g. [304, 204])
 * @returns {Function} filter(req, res) => boolean  true = should log
 */
function buildFilter(options = {}) {
  const {
    excludePaths = [],
    includeMethods = [],
    excludeStatuses = [],
  } = options;

  const normalizedMethods = includeMethods.map((m) => m.toUpperCase());

  return function filter(req, res) {
    const method = (req.method || '').toUpperCase();
    const path = req.path || req.url || '';
    const status = res.statusCode;

    // Method whitelist — if specified, only allow listed methods
    if (normalizedMethods.length > 0 && !normalizedMethods.includes(method)) {
      return false;
    }

    // Path exclusion — skip if path starts with any excluded prefix
    if (excludePaths.some((prefix) => path.startsWith(prefix))) {
      return false;
    }

    // Status exclusion
    if (excludeStatuses.includes(status)) {
      return false;
    }

    return true;
  };
}

/**
 * Quick helper — returns true if a path matches any of the given prefixes.
 * @param {string} path
 * @param {string[]} prefixes
 * @returns {boolean}
 */
function matchesPrefix(path, prefixes) {
  return prefixes.some((prefix) => path.startsWith(prefix));
}

module.exports = { buildFilter, matchesPrefix };
