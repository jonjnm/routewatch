/**
 * dashboardMiddleware.js — Express middleware that serves the HTML dashboard
 */

const { Router } = require('express');
const { buildDashboardHTML } = require('./dashboard');

/**
 * Returns an Express router that serves the RouteWatch HTML dashboard.
 *
 * @param {object} options
 * @param {string} [options.path='/routewatch'] - Mount path for the dashboard
 * @param {string} [options.title] - Custom page title
 * @param {number} [options.maxBars] - Max routes shown in the table
 * @param {function} [options.guard] - Optional (req, res, next) auth guard middleware
 * @returns {Router}
 */
function dashboardRouter(options = {}) {
  const {
    path: mountPath = '/routewatch',
    title,
    maxBars,
    guard = null,
  } = options;

  const router = Router();
  const handlers = [];

  if (typeof guard === 'function') {
    handlers.push(guard);
  }

  handlers.push((_req, res) => {
    try {
      const html = buildDashboardHTML({ title, maxBars });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).send(html);
    } catch (err) {
      res.status(500).send('RouteWatch dashboard error: ' + err.message);
    }
  });

  router.get(mountPath, ...handlers);
  return router;
}

module.exports = { dashboardRouter };
