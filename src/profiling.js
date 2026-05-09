// profiling.js — tracks response time stats per route

const _state = {};

function resetProfiling() {
  Object.keys(_state).forEach(k => delete _state[k]);
}

function _ensureRoute(route) {
  if (!_state[route]) {
    _state[route] = { count: 0, total: 0, min: Infinity, max: -Infinity, samples: [] };
  }
}

function recordTiming(route, durationMs) {
  _ensureRoute(route);
  const s = _state[route];
  s.count += 1;
  s.total += durationMs;
  if (durationMs < s.min) s.min = durationMs;
  if (durationMs > s.max) s.max = durationMs;
  // keep last 100 samples for percentile calc
  s.samples.push(durationMs);
  if (s.samples.length > 100) s.samples.shift();
}

function getProfilingStats(route) {
  if (!_state[route]) return null;
  const s = _state[route];
  const avg = s.count > 0 ? s.total / s.count : 0;
  const sorted = [...s.samples].sort((a, b) => a - b);
  const p95 = _percentile(sorted, 95);
  const p99 = _percentile(sorted, 99);
  return {
    route,
    count: s.count,
    avg: parseFloat(avg.toFixed(2)),
    min: s.min === Infinity ? 0 : s.min,
    max: s.max === -Infinity ? 0 : s.max,
    p95,
    p99
  };
}

function getAllProfilingStats() {
  return Object.keys(_state).map(r => getProfilingStats(r));
}

function _percentile(sorted, pct) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((pct / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

module.exports = { recordTiming, getProfilingStats, getAllProfilingStats, resetProfiling };
