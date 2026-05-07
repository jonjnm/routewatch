/**
 * samplingMiddleware.js
 * Express middleware that gates routewatch logging based on sampling config.
 * Attach before routewatch() so skipped requests are never logged.
 */

const { shouldSample } = require('./sampling');

/**
 * Resolve the route path from a request.
 * Prefers req.route.path (set after routing) then falls back to req.path.
 * @param {object} req
 * @returns {string}
 */
function _resolveRoute(req) {
  if (req.route && req.route.path) {
    return req.route.path;
  }
  return req.path || req.url || '/';
}

/**
 * Sampling middleware factory.
 *
 * Usage:
 *   app.use(samplingMiddleware());
 *   app.use(routewatch({ ... }));
 *
 * If a request is not sampled, req._routewatchSkip is set to true and
 * next() is still called so the request is handled normally — just not logged.
 *
 * @param {object} [options]
 * @param {Function} [options.resolveRoute] - custom route resolver
 * @returns {Function} Express middleware
 */
function samplingMiddleware(options = {}) {
  const resolveRoute = options.resolveRoute || _resolveRoute;

  return function samplingMiddlewareHandler(req, res, next) {
    const route = resolveRoute(req);
    if (!shouldSample(route)) {
      req._routewatchSkip = true;
    }
    next();
  };
}

module.exports = { samplingMiddleware, _resolveRoute };
