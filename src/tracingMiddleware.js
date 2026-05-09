const { generateTraceId, startTrace, addSpan, finishTrace } = require('./tracing');

function _resolveRoute(req) {
  if (req.route && req.route.path) {
    const base = req.baseUrl || '';
    return base + req.route.path;
  }
  return req.path || req.url || 'unknown';
}

/**
 * Express middleware that automatically creates a trace for each request.
 * Attaches traceId to req and res headers, records start/finish spans.
 *
 * Options:
 *   headerName  {string}  response header to expose trace id (default: 'X-Trace-Id')
 *   includeBody {boolean} capture response status in finish span (default: true)
 */
function tracingMiddleware(options = {}) {
  const headerName = options.headerName || 'X-Trace-Id';
  const includeBody = options.includeBody !== false;

  return function (req, res, next) {
    const traceId = generateTraceId();
    req.traceId = traceId;

    startTrace(traceId, { method: req.method, url: req.originalUrl || req.url });
    addSpan(traceId, 'request_received', { method: req.method, url: req.originalUrl || req.url });

    res.setHeader(headerName, traceId);

    const startedAt = Date.now();

    const originalEnd = res.end.bind(res);
    res.end = function (...args) {
      const route = _resolveRoute(req);
      const duration = Date.now() - startedAt;

      const spanMeta = { route, duration };
      if (includeBody) {
        spanMeta.statusCode = res.statusCode;
      }

      addSpan(traceId, 'response_sent', spanMeta);
      finishTrace(traceId);

      return originalEnd(...args);
    };

    next();
  };
}

module.exports = { tracingMiddleware, _resolveRoute };
