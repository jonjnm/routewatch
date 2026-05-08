/**
 * retentionMiddleware.js — Express middleware that records route hits
 * into the retention store and exposes a report endpoint.
 */

const express = require('express');
const { addEntry, getAllEntries, pruneAll, getEntries } = require('./retention');

function _resolveRoute(req) {
  if (req.route && req.route.path) {
    return `${req.method} ${req.route.path}`;
  }
  return `${req.method} ${req.path}`;
}

function retentionMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const routeKey = _resolveRoute(req);
    addEntry(routeKey, {
      status: res.statusCode,
      durationMs: Date.now() - start,
      method: req.method,
      path: req.path
    });
  });

  next();
}

const retentionRouter = express.Router();

retentionRouter.get('/retention', (req, res) => {
  pruneAll();
  res.json(getAllEntries());
});

retentionRouter.get('/retention/:routeKey', (req, res) => {
  const key = decodeURIComponent(req.params.routeKey);
  const entries = getEntries(key);
  if (!entries.length) {
    return res.status(404).json({ error: 'No entries found for route', routeKey: key });
  }
  res.json({ routeKey: key, entries });
});

module.exports = { retentionMiddleware, retentionRouter, _resolveRoute };
