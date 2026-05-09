// metricsMiddleware.js — middleware to capture per-request timing and expose metrics endpoint

const { Router } = require('express');
const { recordMetric, getMetrics } = require('./metrics');

function _resolveRoute(req) {
  return (req.route && req.route.path) ? req.route.path : req.path || req.url || '/';
}

function metricsMiddleware(req, res, next) {
  const startTime = Date.now();

  const originalEnd = res.end.bind(res);
  res.end = function (...args) {
    const duration = Date.now() - startTime;
    const route = _resolveRoute(req);
    const method = req.method || 'GET';
    const status = res.statusCode || 200;
    try {
      recordMetric(route, method, duration, status);
    } catch (_) {
      // never let metrics crash the response
    }
    return originalEnd(...args);
  };

  next();
}

const metricsRouter = Router();

metricsRouter.get('/metrics', (req, res) => {
  const data = getMetrics();
  res.json({ ok: true, count: data.length, metrics: data });
});

module.exports = { metricsMiddleware, metricsRouter, _resolveRoute };
