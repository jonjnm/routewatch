/**
 * tagging.js — attach custom tags to routes for grouping/filtering in reports
 */

/** @type {Map<string, string[]>} */
const routeTags = new Map();

/**
 * Assign one or more tags to a route pattern.
 * @param {string} route - e.g. '/api/users'
 * @param {string[]} tags
 */
function tagRoute(route, tags) {
  if (!route || !Array.isArray(tags)) {
    throw new Error('tagRoute requires a route string and an array of tags');
  }
  const existing = routeTags.get(route) || [];
  const merged = Array.from(new Set([...existing, ...tags]));
  routeTags.set(route, merged);
}

/**
 * Return tags for a given route, or [] if none.
 * @param {string} route
 * @returns {string[]}
 */
function getTagsForRoute(route) {
  return routeTags.get(route) || [];
}

/**
 * Return all routes that have at least one of the supplied tags.
 * @param {string[]} tags
 * @returns {string[]}
 */
function getRoutesByTag(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return [];
  const results = [];
  for (const [route, routeTagList] of routeTags.entries()) {
    if (tags.some(t => routeTagList.includes(t))) {
      results.push(route);
    }
  }
  return results;
}

/**
 * Remove all tags from a specific route.
 * @param {string} route
 */
function clearTagsForRoute(route) {
  routeTags.delete(route);
}

/**
 * Reset all tag data (useful for tests).
 */
function resetTags() {
  routeTags.clear();
}

/**
 * Return a plain object snapshot of all tagged routes.
 * @returns {Record<string, string[]>}
 */
function getAllTags() {
  const out = {};
  for (const [route, tags] of routeTags.entries()) {
    out[route] = [...tags];
  }
  return out;
}

module.exports = {
  tagRoute,
  getTagsForRoute,
  getRoutesByTag,
  clearTagsForRoute,
  resetTags,
  getAllTags,
};
