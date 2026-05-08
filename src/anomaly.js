// anomaly.js — detects unusual spike patterns in route usage

const { getSummary } = require('./reporter');

let anomalyConfig = {
  windowMs: 60000,
  multiplier: 3.0,
  minBaseline: 5,
};

const baseline = {};
const windowHits = {};

function configureAnomaly(opts = {}) {
  Object.assign(anomalyConfig, opts);
}

function recordWindowHit(route) {
  const now = Date.now();
  if (!windowHits[route]) windowHits[route] = [];
  windowHits[route].push(now);

  // prune old hits outside window
  const cutoff = now - anomalyConfig.windowMs;
  windowHits[route] = windowHits[route].filter((t) => t >= cutoff);
}

function updateBaseline(route) {
  const summary = getSummary();
  const entry = summary[route];
  if (!entry) return;
  // rolling average: requests per window duration
  const rate = entry.hits;
  if (!baseline[route]) {
    baseline[route] = rate;
  } else {
    baseline[route] = baseline[route] * 0.8 + rate * 0.2;
  }
}

function isAnomaly(route) {
  const recent = (windowHits[route] || []).length;
  const base = baseline[route] || 0;
  if (base < anomalyConfig.minBaseline) return false;
  return recent > base * anomalyConfig.multiplier;
}

function getAnomalyState() {
  const result = {};
  for (const route of Object.keys(windowHits)) {
    result[route] = {
      recentHits: windowHits[route].length,
      baseline: baseline[route] || 0,
      anomaly: isAnomaly(route),
    };
  }
  return result;
}

function resetAnomaly() {
  for (const k of Object.keys(baseline)) delete baseline[k];
  for (const k of Object.keys(windowHits)) delete windowHits[k];
  Object.assign(anomalyConfig, { windowMs: 60000, multiplier: 3.0, minBaseline: 5 });
}

module.exports = {
  configureAnomaly,
  recordWindowHit,
  updateBaseline,
  isAnomaly,
  getAnomalyState,
  resetAnomaly,
};
