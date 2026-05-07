/**
 * corsMiddleware.js — Express middleware that audits CORS origins via routewatch
 */

const { recordCorsHit, getCorsStats, getSeenOrigins } = require('./cors');

/**
 * Middleware that records the Origin header for each request
 */
function corsAudit(req, res, next) {
  const origin = req.headers['origin'] || null;
  const route = req.path || '/';
  if (origin) {
    recordCorsHit(origin, route);
  }
  next();
}

/**
 * Build a small router that exposes CORS audit endpoints
 * @returns {object} express-compatible router-like object
 */
function corsReportRouter() {
  const routes = {};

  routes['/routewatch/cors'] = (req, res) => {
    const stats = getCorsStats();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ origins: stats }, null, 2));
  };

  routes['/routewatch/cors/origins'] = (req, res) => {
    const origins = getSeenOrigins();
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ origins }, null, 2));
  };

  function router(req, res, next) {
    const handler = routes[req.path];
    if (handler) {
      handler(req, res);
    } else {
      next();
    }
  }

  return router;
}

module.exports = { corsAudit, corsReportRouter };
