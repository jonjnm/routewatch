const { samplingMiddleware, _resolveRoute } = require('./samplingMiddleware');
const { configureSampling, resetSampling } = require('./sampling');

beforeEach(() => resetSampling());

function makeMockReq(overrides = {}) {
  return {
    path: '/test',
    url: '/test',
    route: null,
    ...overrides,
  };
}

const next = jest.fn();

beforeEach(() => next.mockClear());

describe('_resolveRoute', () => {
  test('uses req.route.path when available', () => {
    const req = makeMockReq({ route: { path: '/users/:id' } });
    expect(_resolveRoute(req)).toBe('/users/:id');
  });

  test('falls back to req.path', () => {
    const req = makeMockReq({ path: '/about', route: null });
    expect(_resolveRoute(req)).toBe('/about');
  });

  test('falls back to req.url if no path', () => {
    const req = { url: '/fallback' };
    expect(_resolveRoute(req)).toBe('/fallback');
  });

  test('returns / as last resort', () => {
    expect(_resolveRoute({})).toBe('/');
  });
});

describe('samplingMiddleware', () => {
  test('does not set _routewatchSkip when rate is 1', () => {
    configureSampling({ rate: 1.0 });
    const req = makeMockReq();
    samplingMiddleware()(req, {}, next);
    expect(req._routewatchSkip).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('sets _routewatchSkip when rate is 0', () => {
    configureSampling({ rate: 0.0 });
    const req = makeMockReq();
    samplingMiddleware()(req, {}, next);
    expect(req._routewatchSkip).toBe(true);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('skips logging for matched zero-rate rule', () => {
    configureSampling({ rules: [{ match: '/health', rate: 0 }] });
    const req = makeMockReq({ path: '/health/check' });
    samplingMiddleware()(req, {}, next);
    expect(req._routewatchSkip).toBe(true);
  });

  test('does not skip for unmatched route when global rate is 1', () => {
    configureSampling({
      rate: 1.0,
      rules: [{ match: '/health', rate: 0 }],
    });
    const req = makeMockReq({ path: '/api/users' });
    samplingMiddleware()(req, {}, next);
    expect(req._routewatchSkip).toBeUndefined();
  });

  test('accepts custom resolveRoute option', () => {
    configureSampling({ rate: 0.0 });
    const resolveRoute = jest.fn().mockReturnValue('/custom');
    const req = makeMockReq();
    samplingMiddleware({ resolveRoute })(req, {}, next);
    expect(resolveRoute).toHaveBeenCalledWith(req);
    expect(req._routewatchSkip).toBe(true);
  });

  test('always calls next regardless of sampling decision', () => {
    configureSampling({ rate: 0.0 });
    const req = makeMockReq();
    samplingMiddleware()(req, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
