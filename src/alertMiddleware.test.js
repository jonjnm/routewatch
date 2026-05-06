const { alertMiddleware } = require('./alertMiddleware');
const { configureAlerts, resetAlerts, getAlertState } = require('./alerting');
const EventEmitter = require('events');

function makeMockRes(statusCode = 200) {
  const emitter = new EventEmitter();
  emitter.statusCode = statusCode;
  return emitter;
}

function makeMockReq(overrides = {}) {
  return {
    method: 'GET',
    path: '/api/test',
    routeKey: null,
    ...overrides,
  };
}

/**
 * Helper to simulate a single request/response cycle through the middleware.
 * Emits 'finish' on the response automatically.
 */
function fireRequest(mw, reqOverrides = {}, statusCode = 200) {
  const req = makeMockReq(reqOverrides);
  const res = makeMockRes(statusCode);
  const next = jest.fn();
  mw(req, res, next);
  res.emit('finish');
  return { req, res, next };
}

beforeEach(() => {
  resetAlerts();
});

describe('alertMiddleware', () => {
  test('calls next()', () => {
    const mw = alertMiddleware();
    const next = jest.fn();
    mw(makeMockReq(), makeMockRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('records a hit on response finish', () => {
    configureAlerts({ maxHitsPerMinute: 100, onAlert: () => {} });
    const mw = alertMiddleware();

    const { next } = fireRequest(mw, { routeKey: 'GET /api/test' }, 200);

    expect(next).toHaveBeenCalledTimes(1);
    const state = getAlertState();
    expect(state.hitWindows['GET /api/test']).toHaveLength(1);
  });

  test('marks error hits when status >= 400', () => {
    const alerts = [];
    configureAlerts({
      maxErrorRate: 0.5,
      onAlert: (type, route) => alerts.push({ type, route }),
    });
    const mw = alertMiddleware();

    for (let i = 0; i < 5; i++) {
      fireRequest(mw, { routeKey: 'POST /api/fail' }, 500);
    }

    expect(alerts.some(a => a.type === 'HIGH_ERROR_RATE')).toBe(true);
  });

  test('falls back to req.path when routeKey is absent', () => {
    configureAlerts({ maxHitsPerMinute: 100, onAlert: () => {} });
    const mw = alertMiddleware();

    fireRequest(mw, { routeKey: null, method: 'DELETE', path: '/items/1' }, 204);

    const state = getAlertState();
    expect(state.hitWindows['DELETE /items/1']).toHaveLength(1);
  });

  test('accepts inline options and configures alerting', () => {
    const fired = [];
    const mw = alertMiddleware({
      maxHitsPerMinute: 1,
      onAlert: (type) => fired.push(type),
    });

    fireRequest(mw, { routeKey: 'GET /ping' }, 200);
    fireRequest(mw, { routeKey: 'GET /ping' }, 200);

    expect(fired).toContain('HIGH_TRAFFIC');
  });
});
