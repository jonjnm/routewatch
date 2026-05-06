const { dashboardRouter } = require('./dashboardMiddleware');
const reporter = require('./reporter');

beforeEach(() => {
  reporter.resetStats();
});

function makeMockRes() {
  const res = {
    _status: 200,
    _body: '',
    _headers: {},
    status(code) { this._status = code; return this; },
    send(body) { this._body = body; return this; },
    setHeader(k, v) { this._headers[k] = v; },
  };
  return res;
}

function makeMockReq(path = '/routewatch') {
  return { method: 'GET', path, url: path };
}

function fireRoute(router, path = '/routewatch') {
  return new Promise((resolve) => {
    const req = makeMockReq(path);
    const res = makeMockRes();
    // walk the router's stack manually
    const layer = router.stack.find(
      (l) => l.route && l.route.path === path
    );
    if (!layer) {
      res.status(404).send('not found');
      return resolve(res);
    }
    const handlers = layer.route.stack.map((s) => s.handle);
    let i = 0;
    function next() {
      const fn = handlers[i++];
      if (fn) fn(req, res, next);
      else resolve(res);
    }
    next();
    resolve(res);
  });
}

describe('dashboardRouter', () => {
  test('returns an Express router', () => {
    const router = dashboardRouter();
    expect(typeof router).toBe('function');
    expect(Array.isArray(router.stack)).toBe(true);
  });

  test('registers GET handler at default path /routewatch', () => {
    const router = dashboardRouter();
    const layer = router.stack.find(
      (l) => l.route && l.route.path === '/routewatch'
    );
    expect(layer).toBeDefined();
    expect(layer.route.methods.get).toBe(true);
  });

  test('registers GET handler at custom path', () => {
    const router = dashboardRouter({ path: '/admin/stats' });
    const layer = router.stack.find(
      (l) => l.route && l.route.path === '/admin/stats'
    );
    expect(layer).toBeDefined();
  });

  test('handler sends HTML with 200 status', async () => {
    const router = dashboardRouter();
    const res = await fireRoute(router);
    expect(res._status).toBe(200);
    expect(res._body).toContain('<!DOCTYPE html>');
    expect(res._headers['Content-Type']).toContain('text/html');
  });

  test('sets Cache-Control: no-store', async () => {
    const router = dashboardRouter();
    const res = await fireRoute(router);
    expect(res._headers['Cache-Control']).toBe('no-store');
  });

  test('guard middleware is called before handler', async () => {
    const calls = [];
    const guard = (_req, _res, next) => { calls.push('guard'); next(); };
    const router = dashboardRouter({ guard });
    const res = await fireRoute(router);
    expect(calls).toContain('guard');
    expect(res._body).toContain('<!DOCTYPE html>');
  });

  test('guard can block the request', async () => {
    const block = (_req, res) => { res.status(401).send('Unauthorized'); };
    const router = dashboardRouter({ guard: block });
    const res = await fireRoute(router);
    expect(res._status).toBe(401);
    expect(res._body).toBe('Unauthorized');
  });
});
