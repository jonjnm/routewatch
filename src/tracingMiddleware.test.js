const { tracingMiddleware, _resolveRoute } = require('./tracingMiddleware');
const { getTrace, resetTraces } = require('./tracing');

function makeMockReq(overrides = {}) {
  return {
    method: 'GET',
    url: '/api/test',
    originalUrl: '/api/test',
    path: '/api/test',
    route: null,
    ...overrides,
  };
}

function makeMockRes() {
  const headers = {};
  const res = {
    statusCode: 200,
    setHeader(k, v) { headers[k] = v; },
    getHeaders() { return headers; },
    _headers: headers,
    end: jest.fn(),
  };
  return res;
}

function fireRequest(req, res, opts = {}) {
  return new Promise((resolve) => {
    const mw = tracingMiddleware(opts);
    mw(req, res, () => {
      res.end();
      resolve();
    });
  });
}

beforeEach(() => {
  resetTraces();
});

describe('tracingMiddleware', () => {
  test('attaches traceId to req', async () => {
    const req = makeMockReq();
    const res = makeMockRes();
    await fireRequest(req, res);
    expect(req.traceId).toBeDefined();
    expect(typeof req.traceId).toBe('string');
  });

  test('sets X-Trace-Id response header by default', async () => {
    const req = makeMockReq();
    const res = makeMockRes();
    await fireRequest(req, res);
    expect(res._headers['X-Trace-Id']).toBe(req.traceId);
  });

  test('respects custom headerName option', async () => {
    const req = makeMockReq();
    const res = makeMockRes();
    await fireRequest(req, res, { headerName: 'X-Request-Trace' });
    expect(res._headers['X-Request-Trace']).toBe(req.traceId);
  });

  test('records a finished trace with spans', async () => {
    const req = makeMockReq();
    const res = makeMockRes();
    await fireRequest(req, res);
    const trace = getTrace(req.traceId);
    expect(trace).toBeDefined();
    expect(trace.finished).toBe(true);
    expect(trace.spans.length).toBeGreaterThanOrEqual(2);
  });

  test('response_sent span includes statusCode when includeBody is true', async () => {
    const req = makeMockReq();
    const res = makeMockRes();
    res.statusCode = 404;
    await fireRequest(req, res, { includeBody: true });
    const trace = getTrace(req.traceId);
    const sentSpan = trace.spans.find((s) => s.name === 'response_sent');
    expect(sentSpan).toBeDefined();
    expect(sentSpan.meta.statusCode).toBe(404);
  });

  test('response_sent span omits statusCode when includeBody is false', async () => {
    const req = makeMockReq();
    const res = makeMockRes();
    await fireRequest(req, res, { includeBody: false });
    const trace = getTrace(req.traceId);
    const sentSpan = trace.spans.find((s) => s.name === 'response_sent');
    expect(sentSpan.meta.statusCode).toBeUndefined();
  });
});

describe('_resolveRoute', () => {
  test('uses route.path when available', () => {
    const req = makeMockReq({ route: { path: '/users/:id' }, baseUrl: '/api' });
    expect(_resolveRoute(req)).toBe('/api/users/:id');
  });

  test('falls back to req.path', () => {
    const req = makeMockReq({ route: null, path: '/fallback' });
    expect(_resolveRoute(req)).toBe('/fallback');
  });
});
