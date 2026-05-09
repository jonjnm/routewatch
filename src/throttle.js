'use strict';

// In-memory store: routeKey -> { count, windowStart }
const throttleState = {};

let _config = {
  windowMs: 60000,
  maxRequests: 100,
  routes: {}
};

function configureThrottle(options = {}) {
  _config = Object.assign({}, _config, options);
  if (options.routes) {
    _config.routes = Object.assign({}, options.routes);
  }
}

function getThrottleConfig() {
  return Object.assign({}, _config, { routes: Object.assign({}, _config.routes) });
}

function _getRouteConfig(route) {
  if (_config.routes && _config.routes[route]) {
    return _config.routes[route];
  }
  return { windowMs: _config.windowMs, maxRequests: _config.maxRequests };
}

function checkThrottle(route) {
  const now = Date.now();
  const cfg = _getRouteConfig(route);

  if (!throttleState[route]) {
    throttleState[route] = { count: 0, windowStart: now };
  }

  const state = throttleState[route];

  if (now - state.windowStart > cfg.windowMs) {
    state.count = 0;
    state.windowStart = now;
  }

  state.count += 1;

  const allowed = state.count <= cfg.maxRequests;
  const remaining = Math.max(0, cfg.maxRequests - state.count);
  const resetAt = state.windowStart + cfg.windowMs;

  return { allowed, count: state.count, remaining, resetAt, windowMs: cfg.windowMs, maxRequests: cfg.maxRequests };
}

function getThrottleState(route) {
  return throttleState[route] ? Object.assign({}, throttleState[route]) : null;
}

function resetThrottle() {
  Object.keys(throttleState).forEach(k => delete throttleState[k]);
}

module.exports = { configureThrottle, getThrottleConfig, checkThrottle, getThrottleState, resetThrottle };
