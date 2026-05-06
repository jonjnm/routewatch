/**
 * alerting.config.js
 * Default alert configuration presets for routewatch.
 * Import a preset and pass it to configureAlerts() or alertMiddleware().
 */

/** Conservative: suitable for low-traffic dev APIs */
const PRESET_DEV = {
  maxHitsPerMinute: 60,
  maxErrorRate: 0.25,
};

/** Relaxed: for high-throughput staging environments */
const PRESET_STAGING = {
  maxHitsPerMinute: 300,
  maxErrorRate: 0.1,
};

/** Strict: zero tolerance, useful for smoke-test suites */
const PRESET_STRICT = {
  maxHitsPerMinute: 20,
  maxErrorRate: 0.05,
};

/**
 * Build a config object from a named preset plus optional overrides.
 *
 * @param {'dev'|'staging'|'strict'} name
 * @param {object} overrides
 * @returns {object}
 */
function fromPreset(name, overrides = {}) {
  const presets = {
    dev: PRESET_DEV,
    staging: PRESET_STAGING,
    strict: PRESET_STRICT,
  };

  const base = presets[name];
  if (!base) {
    throw new Error(
      `Unknown alert preset "${name}". Choose from: ${Object.keys(presets).join(', ')}`
    );
  }

  return { ...base, ...overrides };
}

module.exports = { PRESET_DEV, PRESET_STAGING, PRESET_STRICT, fromPreset };
