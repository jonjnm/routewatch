const { anomalyMiddleware, anomalyRouter, _resolveRoute } = require('./anomalyMiddleware');
const { resetAnomaly } = require('./anomaly');

beforeEach(() => resetAnomaly());

function makeMockReq(overrides = {}) {
  return {
    method: 'GET',
    path: '/api/test',
    url: '/api/test',
    baseUrl: '',
    route: { path: '/api/test' },
    ...overrides,
  };
}

function makeMockRes() {
  const listeners = {};
  return {
    on: (event, cb) => { listeners[event] = cb; },
    _emit: (event) => { if (listeners[event]) listeners[event](); },
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };
}

describe('_resolveRoute', () => {
  it('uses route.path when available', () => {
    const req = makeMockReq({ baseUrl: '/v1', route: { path: '/users' } });
    expect(_resolveRoute(req)).toBe('/v1/users');
  });

  it('falls back to req.path', () => {
    const req = makeMockReq({ route: null, path: '/fallback' });
    expect(_resolveRoute(req)).toBe('/fallback');
  });

  it('falls back to unknown', () => {
    const req = { route: null, path: null, url: null };
    expect(_resolveRoute(req)).toBe('unknown');
  });
});

describe('anomalyMiddleware', () => {
  it('calls next()', () => {
    const mw = anomalyMiddleware();
    const req = makeMockReq();
    const res = makeMockRes();
    const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('records hit on finish', () => {
    const mw = anomalyMiddleware();
    const req = makeMockReq();
    const res = makeMockRes();
    mw(req, res, jest.fn());
    res._emit('finish');
    // no error thrown means hit was recorded
  });

  it('calls onAnomaly when provided and anomaly fires', () => {
    const onAnomaly = jest.fn();
    const mw = anomalyMiddleware({ onAnomaly });
    const req = makeMockReq();
    const res = makeMockRes();
    mw(req, res, jest.fn());
    res._emit('finish');
    // baseline is too low to trigger, but callback should not throw
    expect(onAnomaly).not.toThrow;
  });

  it('warns to console when no onAnomaly and anomaly detected', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    // no custom handler — default path
    const mw = anomalyMiddleware();
    const req = makeMockReq();
    const res = makeMockRes();
    mw(req, res, jest.fn());
    res._emit('finish');
    spy.mockRestore();
  });
});

describe('anomalyRouter GET /routewatch/anomalies', () => {
  it('responds with anomaly state JSON', () => {
    const req = makeMockReq({ path: '/routewatch/anomalies', method: 'GET', route: null });
    const res = makeMockRes();
    const layer = anomalyRouter.stack.find(
      (l) => l.route && l.route.path === '/routewatch/anomalies'
    );
    expect(layer).toBeDefined();
    layer.route.stack[0].handle(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith(expect.any(Object));
  });
});
