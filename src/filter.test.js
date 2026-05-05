const { buildFilter, matchesPrefix } = require('./filter');

describe('buildFilter', () => {
  const makeReq = (method, path) => ({ method, path });
  const makeRes = (statusCode) => ({ statusCode });

  test('returns true when no options are set', () => {
    const filter = buildFilter();
    expect(filter(makeReq('GET', '/api/users'), makeRes(200))).toBe(true);
  });

  test('excludes paths that match a prefix', () => {
    const filter = buildFilter({ excludePaths: ['/health', '/metrics'] });
    expect(filter(makeReq('GET', '/health'), makeRes(200))).toBe(false);
    expect(filter(makeReq('GET', '/health/check'), makeRes(200))).toBe(false);
    expect(filter(makeReq('GET', '/metrics'), makeRes(200))).toBe(false);
    expect(filter(makeReq('GET', '/api/users'), makeRes(200))).toBe(true);
  });

  test('includeMethods filters out unlisted methods', () => {
    const filter = buildFilter({ includeMethods: ['GET', 'POST'] });
    expect(filter(makeReq('GET', '/api'), makeRes(200))).toBe(true);
    expect(filter(makeReq('POST', '/api'), makeRes(201))).toBe(true);
    expect(filter(makeReq('DELETE', '/api'), makeRes(200))).toBe(false);
    expect(filter(makeReq('PUT', '/api'), makeRes(200))).toBe(false);
  });

  test('includeMethods is case-insensitive', () => {
    const filter = buildFilter({ includeMethods: ['get'] });
    expect(filter(makeReq('GET', '/api'), makeRes(200))).toBe(true);
  });

  test('excludes specified status codes', () => {
    const filter = buildFilter({ excludeStatuses: [304, 204] });
    expect(filter(makeReq('GET', '/api'), makeRes(304))).toBe(false);
    expect(filter(makeReq('DELETE', '/api'), makeRes(204))).toBe(false);
    expect(filter(makeReq('GET', '/api'), makeRes(200))).toBe(true);
  });

  test('all filters combine correctly', () => {
    const filter = buildFilter({
      excludePaths: ['/internal'],
      includeMethods: ['GET'],
      excludeStatuses: [500],
    });
    // Passes all checks
    expect(filter(makeReq('GET', '/api/data'), makeRes(200))).toBe(true);
    // Fails path check
    expect(filter(makeReq('GET', '/internal/secret'), makeRes(200))).toBe(false);
    // Fails method check
    expect(filter(makeReq('POST', '/api/data'), makeRes(201))).toBe(false);
    // Fails status check
    expect(filter(makeReq('GET', '/api/data'), makeRes(500))).toBe(false);
  });
});

describe('matchesPrefix', () => {
  test('returns true when path starts with a prefix', () => {
    expect(matchesPrefix('/health/check', ['/health'])).toBe(true);
  });

  test('returns false when no prefix matches', () => {
    expect(matchesPrefix('/api/users', ['/health', '/metrics'])).toBe(false);
  });

  test('returns false for empty prefixes array', () => {
    expect(matchesPrefix('/anything', [])).toBe(false);
  });
});
