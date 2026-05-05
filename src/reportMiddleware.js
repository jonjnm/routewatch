/**
 * reportMiddleware.js
 * Express middleware that hooks into routewatch to feed the reporter,
 * and exposes a /__routewatch/report endpoint for viewing stats.
 */

const { recordHit, getSummary, resetStats } = require('./reporter');

/**
 * Middleware that records route hits after each response.
 * Attach this before your routes.
 */
function trackRoutes(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const path = req.route ? req.route.path : req.path;
    recordHit(req.method, path, res.statusCode, duration);
  });

  next();
}

/**
 * Returns an Express router that serves the stats report.
 * Mount this after your routes so all hits are captured.
 *
 * @param {Object} [options]
 * @param {boolean} [options.allowReset=false] - Expose a DELETE endpoint to reset stats
 * @returns {Function} Express router
 */
function reportRouter(options = {}) {
  const { allowReset = false } = options;
  // Lazy-load express to avoid making it a hard dep at module level
  const { Router } = require('express');
  const router = Router();

  router.get('/__routewatch/report', (req, res) => {
    res.json({
      generatedAt: new Date().toISOString(),
      routes: getSummary(),
    });
  });

  if (allowReset) {
    router.delete('/__routewatch/report', (req, res) => {
      resetStats();
      res.json({ message: 'Stats reset.' });
    });
  }

  return router;
}

module.exports = { trackRoutes, reportRouter };
