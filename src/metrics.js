// metrics.js — collects and exposes basic performance metrics per route

const _metrics = {};

function resetMetrics() {
  Object.keys(_metrics).forEach(k => delete _metrics[k]);
}

function recordMetric(route, method, durationMs, statusCode) {
  const key = `${method.toUpperCase()} ${route}`;
  if (!_metrics[key]) {
    _metrics[key] = {
      route,
      method: method.toUpperCase(),
      count: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: -Infinity,
      statusCodes: {}
    };
  }
  const entry = _metrics[key];
  entry.count += 1;
  entry.totalDuration += durationMs;
  if (durationMs < entry.minDuration) entry.minDuration = durationMs;
  if (durationMs > entry.maxDuration) entry.maxDuration = durationMs;
  const sc = String(statusCode);
  entry.statusCodes[sc] = (entry.statusCodes[sc] || 0) + 1;
}

function getMetrics() {
  return Object.values(_metrics).map(e => ({
    ...e,
    avgDuration: e.count > 0 ? parseFloat((e.totalDuration / e.count).toFixed(2)) : 0,
    minDuration: e.minDuration === Infinity ? 0 : e.minDuration,
    maxDuration: e.maxDuration === -Infinity ? 0 : e.maxDuration
  }));
}

function getMetricsForRoute(method, route) {
  const key = `${method.toUpperCase()} ${route}`;
  const entry = _metrics[key];
  if (!entry) return null;
  return {
    ...entry,
    avgDuration: entry.count > 0 ? parseFloat((entry.totalDuration / entry.count).toFixed(2)) : 0,
    minDuration: entry.minDuration === Infinity ? 0 : entry.minDuration,
    maxDuration: entry.maxDuration === -Infinity ? 0 : entry.maxDuration
  };
}

module.exports = { recordMetric, getMetrics, getMetricsForRoute, resetMetrics };
