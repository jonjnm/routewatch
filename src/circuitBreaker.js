// Circuit breaker: tracks consecutive error rates per route and trips open
// when a threshold is exceeded, preventing further logging noise.

const DEFAULT_THRESHOLD = 5;
const DEFAULT_RESET_MS = 30000;

let state = {};
let config = { threshold: DEFAULT_THRESHOLD, resetMs: DEFAULT_RESET_MS };

function configureCircuitBreaker(opts = {}) {
  config = {
    threshold: opts.threshold ?? DEFAULT_THRESHOLD,
    resetMs: opts.resetMs ?? DEFAULT_RESET_MS,
  };
}

function _ensureRoute(route) {
  if (!state[route]) {
    state[route] = { failures: 0, open: false, openedAt: null };
  }
}

function recordSuccess(route) {
  _ensureRoute(route);
  const s = state[route];
  if (s.open) return;
  s.failures = 0;
}

function recordFailure(route) {
  _ensureRoute(route);
  const s = state[route];
  if (s.open) return;
  s.failures += 1;
  if (s.failures >= config.threshold) {
    s.open = true;
    s.openedAt = Date.now();
  }
}

function isOpen(route) {
  _ensureRoute(route);
  const s = state[route];
  if (!s.open) return false;
  if (Date.now() - s.openedAt >= config.resetMs) {
    s.open = false;
    s.failures = 0;
    s.openedAt = null;
    return false;
  }
  return true;
}

function getCircuitState(route) {
  _ensureRoute(route);
  return { ...state[route] };
}

function resetCircuitBreaker() {
  state = {};
  config = { threshold: DEFAULT_THRESHOLD, resetMs: DEFAULT_RESET_MS };
}

module.exports = {
  configureCircuitBreaker,
  recordSuccess,
  recordFailure,
  isOpen,
  getCircuitState,
  resetCircuitBreaker,
};
