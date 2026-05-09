'use strict';

const { throttleMiddleware, _resolveRoute } = require('./throttleMiddleware');
const { configureThrottle, resetThrottle } = require('./throttle');

function makeMockReq(overrides = {}) {
  return Object.assign({ method: 'GET', path: '/api/test', route: { path: '/api/test' } }, overrides);
}

function makeMockRes() {
  const res = {
    _headers: {},
    _status: null,
    _body: null,
    setHeader(k, v) { this._headers[k] = v; },
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; return this; }
  };
  return res;
}

beforeEach(() => {
  resetThrottle();
  configureThrottle({ windowMs: 60000, maxRequests: 100, routes: {} });
});

describe('_resolveRoute', () => {
  it('uses req.route.path when available', () => {
    const req = makeMockReq();
    expect(_resolveRoute(req)).toBe('GET /api/test');
  });

  it('falls back to req.path', () => {
    const req = makeMockReq({ route: null });
    expect(_resolveRoute(req)).toBe('GET /api/test');
  });
});

describe('throttleMiddleware', () => {
  it('calls next when under limit', () => {
    const mw = throttleMiddleware();
    const req = makeMockReq();
    const res = makeMockRes();
    const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('sets rate limit headers', () => {
    const mw = throttleMiddleware();
    const req = makeMockReq();
    const res = makeMockRes();
    mw(req, res, jest.fn());
    expect(res._headers['X-RateLimit-Limit']).toBe(100);
    expect(res._headers['X-RateLimit-Remaining']).toBe(99);
    expect(typeof res._headers['X-RateLimit-Reset']).toBe('number');
  });

  it('returns 429 when limit exceeded', () => {
    configureThrottle({ maxRequests: 1 });
    const mw = throttleMiddleware();
    const req = makeMockReq();
    const res = makeMockRes();
    mw(req, res, jest.fn()); // first request passes
    const res2 = makeMockRes();
    const next2 = jest.fn();
    mw(req, res2, next2);
    expect(res2._status).toBe(429);
    expect(res2._body.error).toBe('Too Many Requests');
    expect(next2).not.toHaveBeenCalled();
  });

  it('calls onThrottled callback when provided', () => {
    configureThrottle({ maxRequests: 1 });
    const onThrottled = jest.fn();
    const mw = throttleMiddleware({ onThrottled });
    const req = makeMockReq();
    mw(req, makeMockRes(), jest.fn());
    mw(req, makeMockRes(), jest.fn());
    expect(onThrottled).toHaveBeenCalledTimes(1);
    expect(onThrottled.mock.calls[0][2].allowed).toBe(false);
  });

  it('does not call next when throttled', () => {
    configureThrottle({ maxRequests: 0 });
    const mw = throttleMiddleware();
    const next = jest.fn();
    mw(makeMockReq(), makeMockRes(), next);
    expect(next).not.toHaveBeenCalled();
  });
});
