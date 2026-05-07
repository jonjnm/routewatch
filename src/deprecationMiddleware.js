/**
 * deprecationMiddleware.js
 * Express middleware that warns when deprecated routes are called.
 */

const { recordDeprecatedHit, isDeprecated } = require('./deprecation');

/**
 * Resolve the route key from a request.
 * Uses req.route.path if available, falls back to req.path.
 */
function _resolveRoute(req) {
  if (req.route && req.route.path) {
    const base = req.baseUrl || '';
    return base + req.route.path;
  }
  return req.path;
}

/**
 * Middleware that checks each request against the deprecated route registry.
 * Emits a console warning and optionally adds response headers.
 *
 * @param {object} options
 * @param {boolean} options.headers - Add Deprecation/Sunset headers (default: true)
 * @param {boolean} options.warn   - Log to console (default: true)
 */
function deprecationMiddleware(options = {}) {
  const addHeaders = options.headers !== false;
  const doWarn = options.warn !== false;

  return function (req, res, next) {
    // We hook into res.end so route.path is resolved after routing
    const originalEnd = res.end.bind(res);

    res.end = function (...args) {
      const route = _resolveRoute(req);
      const method = req.method;

      if (isDeprecated(method, route)) {
        const entry = recordDeprecatedHit(method, route);

        if (doWarn) {
          console.warn(
            `[routewatch] DEPRECATED: ${method} ${route} — ${entry.message}` +
              (entry.replacement ? ` | Use: ${entry.replacement}` : '') +
              (entry.sunset ? ` | Sunset: ${entry.sunset}` : '')
          );
        }

        if (addHeaders && !res.headersSent) {
          res.setHeader('Deprecation', 'true');
          if (entry.sunset) res.setHeader('Sunset', entry.sunset);
          if (entry.replacement) res.setHeader('Link', `<${entry.replacement}>; rel="successor-version"`);
        }
      }

      return originalEnd(...args);
    };

    next();
  };
}

module.exports = { deprecationMiddleware, _resolveRoute };
