const { trackRoutes, reportRouter } = require('./reportMiddleware');
const { resetStats, getSummary } = require('./reporter');
const EventEmitter = require('events');

function makeMockRes(statusCode = 200) {
  const res = new EventEmitter();
  res.statusCode = statusCode;
  res.json = jest.fn((body) => body);
  return res;
}

function makeMockReq(method = 'GET', path = '/test') {
  return { method, path, route: { path } };
}

beforeEach(() => {
  resetStats();
});

describe('trackRoutes middleware', () => {
  it('calls next()', () => {
    const req = makeMockReq();
    const res = makeMockRes();
    const next = jest.fn();
    trackRoutes(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('records a hit after response finishes', (done) => {
    const req = makeMockReq('POST', '/submit');
    const res = makeMockRes(201);
    const next = jest.fn();

    trackRoutes(req, res, next);
    res.emit('finish');

    setImmediate(() => {
      const summary = getSummary();
      expect(summary).toHaveLength(1);
      expect(summary[0].route).toBe('POST /submit');
      done();
    });
  });

  it('falls back to req.path when req.route is undefined', (done) => {
    const req = { method: 'GET', path: '/fallback' };
    const res = makeMockRes(200);
    const next = jest.fn();

    trackRoutes(req, res, next);
    res.emit('finish');

    setImmediate(() => {
      const summary = getSummary();
      expect(summary[0].route).toBe('GET /fallback');
      done();
    });
  });
});

describe('reportRouter', () => {
  it('returns a function (Express router)', () => {
    const router = reportRouter();
    expect(typeof router).toBe('function');
  });

  it('does not expose DELETE route by default', () => {
    const router = reportRouter();
    const deleteRoute = router.stack.find(
      (layer) => layer.route && layer.route.methods.delete
    );
    expect(deleteRoute).toBeUndefined();
  });

  it('exposes DELETE route when allowReset is true', () => {
    const router = reportRouter({ allowReset: true });
    const deleteRoute = router.stack.find(
      (layer) => layer.route && layer.route.methods.delete
    );
    expect(deleteRoute).toBeDefined();
  });
});
