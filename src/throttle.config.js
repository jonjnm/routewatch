'use strict';

const { configureThrottle } = require('./throttle');

/**
 * Built-in throttle presets for common use cases.
 *
 * strict  — 30 req / 60s globally, tighter on auth routes
 * relaxed — 300 req / 60s globally
 * api     — 120 req / 60s globally, strict on write endpoints
 */
const PRESETS = {
  strict: {
    windowMs: 60000,
    maxRequests: 30,
    routes: {
      'POST /api/login':    { windowMs: 60000, maxRequests: 5 },
      'POST /api/register': { windowMs: 60000, maxRequests: 5 }
    }
  },
  relaxed: {
    windowMs: 60000,
    maxRequests: 300,
    routes: {}
  },
  api: {
    windowMs: 60000,
    maxRequests: 120,
    routes: {
      'POST /api/data':   { windowMs: 60000, maxRequests: 30 },
      'PUT /api/data':    { windowMs: 60000, maxRequests: 30 },
      'DELETE /api/data': { windowMs: 60000, maxRequests: 10 }
    }
  }
};

function applyPreset(name, overrides = {}) {
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(`Unknown throttle preset: "${name}". Available: ${Object.keys(PRESETS).join(', ')}`);
  }
  const merged = Object.assign({}, preset, overrides);
  if (overrides.routes) {
    merged.routes = Object.assign({}, preset.routes, overrides.routes);
  }
  configureThrottle(merged);
  return merged;
}

function listPresets() {
  return Object.keys(PRESETS);
}

module.exports = { applyPreset, listPresets, PRESETS };
