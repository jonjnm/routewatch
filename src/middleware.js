/**
 * routewatch - core middleware
 * Logs and audits API route usage in development
 */

const { formatLog } = require('./logger');

const defaultOptions = {
  logBody: false,
  logHeaders: false,
  ignorePaths: [],
  output: 'console',
};

function routewatch(userOptions = {}) {
  const options = { ...defaultOptions, ...userOptions };
  const auditLog = [];

  function middleware(req, res, next) {
    const shouldIgnore = options.ignorePaths.some((pattern) => {
      if (typeof pattern === 'string') return req.path === pattern;
      if (pattern instanceof RegExp) return pattern.test(req.path);
      return false;
    });

    if (shouldIgnore) return next();

    const startTime = Date.now();

    const entry = {
      method: req.method,
      path: req.path,
      query: req.query,
      timestamp: new Date().toISOString(),
      ...(options.logBody && { body: req.body }),
      ...(options.logHeaders && { headers: req.headers }),
    };

    res.on('finish', () => {
      entry.status = res.statusCode;
      entry.duration = `${Date.now() - startTime}ms`;
      auditLog.push(entry);
      formatLog(entry, options.output);
    });

    next();
  }

  middleware.getAuditLog = () => [...auditLog];
  middleware.clearAuditLog = () => auditLog.splice(0, auditLog.length);

  return middleware;
}

module.exports = routewatch;
