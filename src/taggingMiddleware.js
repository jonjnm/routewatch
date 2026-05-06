/**
 * taggingMiddleware.js — Express router exposing tag management endpoints
 * Mount with: app.use('/__routewatch/tags', taggingRouter)
 */

const { Router } = require('express');
const {
  tagRoute,
  getTagsForRoute,
  getRoutesByTag,
  clearTagsForRoute,
  getAllTags,
} = require('./tagging');

const taggingRouter = Router();

/** GET /__routewatch/tags — list all tagged routes */
taggingRouter.get('/', (req, res) => {
  res.json(getAllTags());
});

/** GET /__routewatch/tags/route?path=/api/users — get tags for one route */
taggingRouter.get('/route', (req, res) => {
  const route = req.query.path;
  if (!route) {
    return res.status(400).json({ error: 'query param "path" is required' });
  }
  res.json({ route, tags: getTagsForRoute(route) });
});

/** GET /__routewatch/tags/search?tags=auth,public — find routes by tag */
taggingRouter.get('/search', (req, res) => {
  const raw = req.query.tags || '';
  const tags = raw.split(',').map(t => t.trim()).filter(Boolean);
  if (tags.length === 0) {
    return res.status(400).json({ error: 'query param "tags" is required' });
  }
  res.json({ tags, routes: getRoutesByTag(tags) });
});

/** POST /__routewatch/tags — add tags to a route
 *  Body: { route: '/api/users', tags: ['auth', 'v1'] }
 */
taggingRouter.post('/', (req, res) => {
  const { route, tags } = req.body || {};
  if (!route || !Array.isArray(tags)) {
    return res.status(400).json({ error: '"route" (string) and "tags" (array) are required' });
  }
  try {
    tagRoute(route, tags);
    res.status(201).json({ route, tags: getTagsForRoute(route) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** DELETE /__routewatch/tags/route?path=/api/users — clear tags for a route */
taggingRouter.delete('/route', (req, res) => {
  const route = req.query.path;
  if (!route) {
    return res.status(400).json({ error: 'query param "path" is required' });
  }
  clearTagsForRoute(route);
  res.json({ route, cleared: true });
});

module.exports = { taggingRouter };
