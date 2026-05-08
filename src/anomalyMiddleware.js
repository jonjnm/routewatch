// anomalyMiddleware.js — express middleware that tracks and flags anomalous routes

const { Router } = require('express');
const { recordWindowHit, updateBaseline, isAnomaly, getAnomalyState } = require('./anomaly');

function _resolveRoute(req) {
  if (req.route && req.route.path) {
    const base = req.baseUrl || '';
    return base + req.route.path;
  }
  return req.path || req.url || 'unknown';
}

function anomalyMiddleware(opts = {}) {
  const { onAnomaly = null } = opts;

  return function (req, res, next) {
    res.on('finish', () => {
      const route = _resolveRoute(req);
      updateBaseline(route);
      recordWindowHit(route);

      if (isAnomaly(route)) {
        if (typeof onAnomaly === 'function') {
          onAnomaly({ route, method: req.method, state: getAnomalyState()[route] });
        } else {
          console.warn(`[routewatch] anomaly detected on ${req.method} ${route}`);
        }
      }
    });
    next();
  };
}

const anomalyRouter = Router();

anomalyRouter.get('/routewatch/anomalies', (req, res) => {
  res.json(getAnomalyState());
});

module.exports = { anomalyMiddleware, anomalyRouter, _resolveRoute };
