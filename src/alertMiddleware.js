/**
 * alertMiddleware.js
 * Express middleware that feeds request/response data into the alerting engine.
 * Mount after routewatch so that req.routeKey is already populated.
 */

const { recordAlertHit } = require('./alerting');

/**
 * Returns an Express middleware that records each completed request
 * for alert threshold evaluation.
 *
 * @param {object} options - same shape as configureAlerts options (optional)
 */
function alertMiddleware(options = {}) {
  // Lazy-configure if caller passes options directly here
  if (Object.keys(options).length > 0) {
    const { configureAlerts } = require('./alerting');
    configureAlerts(options);
  }

  return function routewatchAlert(req, res, next) {
    res.on('finish', () => {
      const route = _resolveRoute(req);
      const isError = res.statusCode >= 400;
      recordAlertHit(route, isError);
    });
    next();
  };
}

function _resolveRoute(req) {
  // Prefer the key stamped by routewatch middleware, fall back to raw path
  if (req.routeKey) return req.routeKey;
  const method = (req.method || 'GET').toUpperCase();
  const path = (req.route && req.route.path) || req.path || req.url || '/';
  return `${method} ${path}`;
}

module.exports = { alertMiddleware };
