const { recordFingerprint } = require('./fingerprint');

function _resolveRoute(req) {
  if (req.route && req.route.path) {
    const base = req.baseUrl || '';
    return `${req.method} ${base}${req.route.path}`;
  }
  return `${req.method} ${req.path}`;
}

/**
 * fingerprintMiddleware
 *
 * Records a fingerprint for each request based on IP, user-agent,
 * and other identifying headers. Useful for auditing unique callers
 * per route in development.
 *
 * @param {object} [options]
 * @param {string[]} [options.headers]  Extra headers to include in fingerprint
 * @param {boolean} [options.trustProxy]  Use x-forwarded-for for IP
 */
function fingerprintMiddleware(options = {}) {
  const { headers = [], trustProxy = false } = options;

  return function (req, res, next) {
    res.on('finish', () => {
      const route = _resolveRoute(req);

      const ip = trustProxy
        ? (req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || 'unknown')
        : (req.ip || req.connection.remoteAddress || 'unknown');

      const extra = {};
      for (const h of headers) {
        const val = req.headers[h.toLowerCase()];
        if (val !== undefined) extra[h.toLowerCase()] = val;
      }

      recordFingerprint(route, {
        ip,
        userAgent: req.headers['user-agent'] || '',
        ...extra,
      });
    });

    next();
  };
}

module.exports = { fingerprintMiddleware, _resolveRoute };
