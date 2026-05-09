const { recordSuccess, recordFailure, isOpen } = require('./circuitBreaker');

function _resolveRoute(req) {
  return req.route ? `${req.method} ${req.route.path}` : `${req.method} ${req.path}`;
}

/**
 * Express middleware that monitors response status codes and trips a circuit
 * breaker for routes with repeated 5xx errors. Once tripped, a 503 is returned
 * until the reset window elapses.
 */
function circuitBreakerMiddleware(req, res, next) {
  const route = _resolveRoute(req);

  if (isOpen(route)) {
    return res.status(503).json({
      error: 'Circuit open',
      message: `Route ${route} is temporarily unavailable due to repeated errors.`,
    });
  }

  const originalEnd = res.end.bind(res);
  res.end = function (...args) {
    if (res.statusCode >= 500) {
      recordFailure(route);
    } else {
      recordSuccess(route);
    }
    return originalEnd(...args);
  };

  next();
}

module.exports = { circuitBreakerMiddleware, _resolveRoute };
