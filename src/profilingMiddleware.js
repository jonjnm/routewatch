// profilingMiddleware.js — Express middleware that records response timings

const { recordTiming } = require('./profiling');
const { Router } = require('express');

function _resolveRoute(req) {
  return req.route ? `${req.method} ${req.baseUrl || ''}${req.route.path}` : `${req.method} ${req.path}`;
}

function profilingMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = _resolveRoute(req);
    recordTiming(route, duration);
  });

  next();
}

const profilingRouter = Router();

profilingRouter.get('/profiling', (req, res) => {
  const { getAllProfilingStats } = require('./profiling');
  const stats = getAllProfilingStats();
  res.json({ ok: true, routes: stats });
});

profilingRouter.get('/profiling/:route(*)', (req, res) => {
  const { getProfilingStats } = require('./profiling');
  const route = decodeURIComponent(req.params.route);
  const stats = getProfilingStats(route);
  if (!stats) return res.status(404).json({ ok: false, error: 'Route not found' });
  res.json({ ok: true, stats });
});

module.exports = { profilingMiddleware, profilingRouter, _resolveRoute };
