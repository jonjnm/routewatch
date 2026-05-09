'use strict';

const { checkThrottle } = require('./throttle');

function _resolveRoute(req) {
  if (req.route && req.route.path) {
    return `${req.method} ${req.route.path}`;
  }
  return `${req.method} ${req.path}`;
}

/**
 * Express middleware that enforces request throttling per route.
 * Responds with 429 Too Many Requests when the limit is exceeded.
 *
 * Options:
 *   onThrottled(req, res, info) — custom handler when throttled
 */
function throttleMiddleware(options = {}) {
  const { onThrottled } = options;

  return function (req, res, next) {
    const route = _resolveRoute(req);
    const result = checkThrottle(route);

    res.setHeader('X-RateLimit-Limit', result.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000));

    if (!result.allowed) {
      if (typeof onThrottled === 'function') {
        return onThrottled(req, res, result);
      }
      return res.status(429).json({
        error: 'Too Many Requests',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
      });
    }

    next();
  };
}

module.exports = { throttleMiddleware, _resolveRoute };
