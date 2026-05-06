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
    const req = makeMockReq({ routeKey: 'GET /api/test' });
    const res = makeMockRes(200);
    const next = jest.fn();

    mw(req, res, next);
    res.emit('finish');

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
    const next = jest.fn();

    for (let i = 0; i < 5; i++) {
      const req = makeMockReq({ routeKey: 'POST /api/fail' });
      const res = makeMockRes(500);
      mw(req, res, next);
      res.emit('finish');
    }

    expect(alerts.some(a => a.type === 'HIGH_ERROR_RATE')).toBe(true);
  });

  test('falls back to req.path when routeKey is absent', () => {
    configureAlerts({ maxHitsPerMinute: 100, onAlert: () => {} });
    const mw = alertMiddleware();
    const req = makeMockReq({ routeKey: null, method: 'DELETE', path: '/items/1' });
    const res = makeMockRes(204);
    mw(req, res, jest.fn());
    res.emit('finish');

    const state = getAlertState();
    expect(state.hitWindows['DELETE /items/1']).toHaveLength(1);
  });

  test('accepts inline options and configures alerting', () => {
    const fired = [];
    const mw = alertMiddleware({
      maxHitsPerMinute: 1,
      onAlert: (type) => fired.push(type),
    });
    const next = jest.fn();

    const emit = (route) => {
      const req = makeMockReq({ routeKey: route });
      const res = makeMockRes(200);
      mw(req, res, next);
      res.emit('finish');
    };

    emit('GET /ping');
    emit('GET /ping');
    expect(fired).toContain('HIGH_TRAFFIC');
  });
});
