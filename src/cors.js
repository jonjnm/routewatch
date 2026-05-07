/**
 * cors.js — tracks and audits CORS-related headers on incoming requests
 */

const corsStats = {};

/**
 * Record a CORS hit for a given origin
 * @param {string} origin
 * @param {string} route
 */
function recordCorsHit(origin, route) {
  if (!origin) return;
  if (!corsStats[origin]) {
    corsStats[origin] = { count: 0, routes: {} };
  }
  corsStats[origin].count += 1;
  if (!corsStats[origin].routes[route]) {
    corsStats[origin].routes[route] = 0;
  }
  corsStats[origin].routes[route] += 1;
}

/**
 * Get all recorded CORS stats
 * @returns {object}
 */
function getCorsStats() {
  return JSON.parse(JSON.stringify(corsStats));
}

/**
 * Get stats for a specific origin
 * @param {string} origin
 * @returns {object|null}
 */
function getCorsStatsForOrigin(origin) {
  return corsStats[origin] ? JSON.parse(JSON.stringify(corsStats[origin])) : null;
}

/**
 * Reset all CORS stats (useful for testing)
 */
function resetCorsStats() {
  for (const key of Object.keys(corsStats)) {
    delete corsStats[key];
  }
}

/**
 * Get list of unique origins seen
 * @returns {string[]}
 */
function getSeenOrigins() {
  return Object.keys(corsStats);
}

module.exports = { recordCorsHit, getCorsStats, getCorsStatsForOrigin, resetCorsStats, getSeenOrigins };
