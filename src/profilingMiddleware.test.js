const { profilingMiddleware, profilingRouter, _resolveRoute } = require('./profilingMiddleware');
const { resetProfiling, getProfilingStats, recordTiming } = require('./profiling');

beforeEach(() => resetProfiling());

function makeMockReq(overrides = {}) {
  return { method: 'GET', path: '/test', baseUrl: '', route: { path: '/test' }, ...overrides };
}

function makeMockRes() {
  const listeners = {};
  return {
    on: (event, cb) => { listeners[event] = cb; },
    emit: (event) => { if (listeners[event]) listeners[event](); },
    json: jest.fn(),
    status: jest.fn().mockReturnThis()
  };
}

describe('_resolveRoute', () => {
  test('uses route.path when available', () => {
    const req = makeMockReq({ method: 'POST', baseUrl: '/api', route: { path: '/users' } });
    expect(_resolveRoute(req)).toBe('POST /api/users');
  });

  test('falls back to req.path when no route', () => {
    const req = { method: 'GET', path: '/fallback' };
    expect(_resolveRoute(req)).toBe('GET /fallback');
  });
});

describe('profilingMiddleware', () => {
  test('calls next', () => {
    const req = makeMockReq();
    const res = makeMockRes();
    const next = jest.fn();
    profilingMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('records timing on finish', () => {
    const req = makeMockReq();
    const res = makeMockRes();
    profilingMiddleware(req, res, jest.fn());
    res.emit('finish');
    const stats = getProfilingStats('GET /test');
    expect(stats).not.toBeNull();
    expect(stats.count).toBe(1);
  });

  test('timing is non-negative', () => {
    const req = makeMockReq();
    const res = makeMockRes();
    profilingMiddleware(req, res, jest.fn());
    res.emit('finish');
    const stats = getProfilingStats('GET /test');
    expect(stats.min).toBeGreaterThanOrEqual(0);
  });
});

describe('profilingRouter GET /profiling', () => {
  function fireRoute(path, params = {}) {
    const req = { path, params, method: 'GET' };
    const res = makeMockRes();
    const layer = profilingRouter.stack.find(l => l.route && l.route.path === path);
    if (layer) layer.route.stack[0].handle(req, res, jest.fn());
    return res;
  }

  test('returns all stats', () => {
    recordTiming('GET /x', 50);
    const res = fireRoute('/profiling');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  test('returns 404 for unknown route', () => {
    const req = { params: { route: 'GET /nope' } };
    const res = makeMockRes();
    const layer = profilingRouter.stack.find(l => l.route && l.route.path === '/profiling/:route(*)');
    layer.route.stack[0].handle(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
