/**
 * replayMiddleware.js
 * Express middleware and router that captures requests into the
 * replay buffer and exposes a /routewatch/replay endpoint.
 */

const { Router } = require('express');
const { recordReplay, getReplayBuffer, getReplayEntry } = require('./replay');

/**
 * Middleware that records each completed request into the replay buffer.
 */
function captureReplay(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    recordReplay({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - start,
      headers: req.headers,
      query: req.query,
      body: req.body || null,
    });
  });

  next();
}

/**
 * Router exposing replay inspection endpoints.
 *   GET /routewatch/replay          — list all buffered entries
 *   GET /routewatch/replay/:id      — fetch a single entry by id
 */
const replayRouter = Router();

replayRouter.get('/', (req, res) => {
  res.json({ entries: getReplayBuffer() });
});

replayRouter.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'id must be a number' });
  }
  const entry = getReplayEntry(id);
  if (!entry) {
    return res.status(404).json({ error: 'entry not found' });
  }
  res.json(entry);
});

module.exports = { captureReplay, replayRouter };
