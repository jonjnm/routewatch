/**
 * sampling.js
 * Controls probabilistic and rule-based sampling of route log entries.
 */

let samplingConfig = {
  rate: 1.0,
  rules: [],
};

/**
 * Configure global sampling rate and per-route rules.
 * @param {object} config
 * @param {number} [config.rate] - 0.0 to 1.0 global sample rate
 * @param {Array}  [config.rules] - [{match, rate}] per-prefix rules
 */
function configureSampling(config = {}) {
  if (typeof config.rate === 'number') {
    if (config.rate < 0 || config.rate > 1) {
      throw new RangeError('Sampling rate must be between 0 and 1');
    }
    samplingConfig.rate = config.rate;
  }
  if (Array.isArray(config.rules)) {
    samplingConfig.rules = config.rules.map((r) => ({
      match: r.match,
      rate: r.rate,
    }));
  }
}

/**
 * Determine the effective sample rate for a given route path.
 * @param {string} routePath
 * @returns {number}
 */
function getRateForRoute(routePath) {
  for (const rule of samplingConfig.rules) {
    if (routePath.startsWith(rule.match)) {
      return rule.rate;
    }
  }
  return samplingConfig.rate;
}

/**
 * Decide whether a request for the given route should be sampled.
 * @param {string} routePath
 * @returns {boolean}
 */
function shouldSample(routePath) {
  const rate = getRateForRoute(routePath);
  if (rate >= 1.0) return true;
  if (rate <= 0.0) return false;
  return Math.random() < rate;
}

/**
 * Reset sampling configuration to defaults.
 */
function resetSampling() {
  samplingConfig = { rate: 1.0, rules: [] };
}

/**
 * Return a snapshot of the current sampling config (for inspection/testing).
 */
function getSamplingConfig() {
  return {
    rate: samplingConfig.rate,
    rules: [...samplingConfig.rules],
  };
}

module.exports = {
  configureSampling,
  getRateForRoute,
  shouldSample,
  resetSampling,
  getSamplingConfig,
};
