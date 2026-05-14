const { fingerprintMiddleware, _resolveRoute } = require('./fingerprintMiddleware');
const { resetFingerprints, getFingerprintStats } = require('./fingerprint');

function makeMockReq(overrides = {}) {
  return {
    method: 'GET',
    path: '/api/test',
    baseUrl: '',
    route: { path: '/api/test' },
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
    headers: {
      'user-agent': 'jest-agent/1.0',
    },
    ...overrides,
  };
}

function makeMockRes() {
  const listeners = {};
  return {
    on(event, cb) {
      listeners[event] = cb;
    },
    _emit(event) {
      if (listeners[event]) listeners[event]();
    },
  };
}

beforeEach(() => {
  resetFingerprints();
});

describe('_resolveRoute', () => {
  it('uses route.path when available', () => {
    const req = makeMockReq({ method: 'POST', baseUrl: '/v1', route: { path: '/users' } });
    expect(_resolveRoute(req)).toBe('POST /v1/users');
  });

  it('falls back to req.path', () => {
    const req = makeMockReq({ method: 'GET', path: '/fallback', route: undefined });
    expect(_resolveRoute(req)).toBe('GET /fallback');
  });
});

describe('fingerprintMiddleware', () => {
  it('records a fingerprint on response finish', () => {
    const middleware = fingerprintMiddleware();
    const req = makeMockReq();
    const res = makeMockRes();
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();

    res._emit('finish');

    const stats = getFingerprintStats('GET /api/test');
    expect(stats).toBeDefined();
    expect(stats.total).toBe(1);
  });

  it('uses x-forwarded-for when trustProxy is true', () => {
    const middleware = fingerprintMiddleware({ trustProxy: true });
    const req = makeMockReq({
      headers: { 'user-agent': 'test', 'x-forwarded-for': '10.0.0.1' },
    });
    const res = makeMockRes();

    middleware(req, res, () => {});
    res._emit('finish');

    const stats = getFingerprintStats('GET /api/test');
    expect(stats.total).toBe(1);
  });

  it('includes extra headers when specified', () => {
    const middleware = fingerprintMiddleware({ headers: ['x-api-key'] });
    const req = makeMockReq({
      headers: { 'user-agent': 'test', 'x-api-key': 'abc123' },
    });
    const res = makeMockRes();

    middleware(req, res, () => {});
    res._emit('finish');

    const stats = getFingerprintStats('GET /api/test');
    expect(stats.total).toBe(1);
  });

  it('accumulates multiple fingerprints for the same route', () => {
    const middleware = fingerprintMiddleware();

    for (let i = 0; i < 3; i++) {
      const req = makeMockReq({ ip: `192.168.0.${i}` });
      const res = makeMockRes();
      middleware(req, res, () => {});
      res._emit('finish');
    }

    const stats = getFingerprintStats('GET /api/test');
    expect(stats.total).toBe(3);
  });
});
