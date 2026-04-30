const routewatch = require('./middleware');

function mockReq(overrides = {}) {
  return {
    method: 'GET',
    path: '/api/users',
    query: {},
    body: {},
    headers: {},
    ...overrides,
  };
}

function mockRes() {
  const listeners = {};
  return {
    statusCode: 200,
    on(event, cb) {
      listeners[event] = cb;
    },
    emit(event) {
      if (listeners[event]) listeners[event]();
    },
  };
}

describe('routewatch middleware', () => {
  let middleware;

  beforeEach(() => {
    middleware = routewatch({ output: 'silent' });
  });

  test('calls next()', () => {
    const next = jest.fn();
    const req = mockReq();
    const res = mockRes();
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('logs entry after response finishes', () => {
    const next = jest.fn();
    const req = mockReq();
    const res = mockRes();
    middleware(req, res, next);
    res.emit('finish');
    const log = middleware.getAuditLog();
    expect(log).toHaveLength(1);
    expect(log[0].method).toBe('GET');
    expect(log[0].path).toBe('/api/users');
    expect(log[0].status).toBe(200);
  });

  test('ignores paths matching ignorePaths', () => {
    const mw = routewatch({ output: 'silent', ignorePaths: ['/health'] });
    const next = jest.fn();
    const req = mockReq({ path: '/health' });
    const res = mockRes();
    mw(req, res, next);
    res.emit('finish');
    expect(mw.getAuditLog()).toHaveLength(0);
  });

  test('clearAuditLog empties the log', () => {
    const next = jest.fn();
    const res = mockRes();
    middleware(mockReq(), res, next);
    res.emit('finish');
    middleware.clearAuditLog();
    expect(middleware.getAuditLog()).toHaveLength(0);
  });

  test('supports regex in ignorePaths', () => {
    const mw = routewatch({ output: 'silent', ignorePaths: [/^\/internal/] });
    const next = jest.fn();
    const req = mockReq({ path: '/internal/metrics' });
    const res = mockRes();
    mw(req, res, next);
    res.emit('finish');
    expect(mw.getAuditLog()).toHaveLength(0);
  });
});
