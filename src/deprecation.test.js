const {
  markDeprecated,
  recordDeprecatedHit,
  isDeprecated,
  getDeprecatedRoutes,
  getDeprecatedRoute,
  resetDeprecations,
} = require('./deprecation');

beforeEach(() => {
  resetDeprecations();
});

describe('markDeprecated', () => {
  it('registers a route as deprecated', () => {
    markDeprecated('GET', '/v1/users');
    expect(isDeprecated('GET', '/v1/users')).toBe(true);
  });

  it('stores metadata', () => {
    markDeprecated('POST', '/v1/items', {
      message: 'Use v2',
      sunset: '2025-12-31',
      replacement: '/v2/items',
    });
    const entry = getDeprecatedRoute('POST', '/v1/items');
    expect(entry.message).toBe('Use v2');
    expect(entry.sunset).toBe('2025-12-31');
    expect(entry.replacement).toBe('/v2/items');
  });

  it('normalises method to uppercase', () => {
    markDeprecated('get', '/v1/ping');
    expect(isDeprecated('GET', '/v1/ping')).toBe(true);
  });
});

describe('isDeprecated', () => {
  it('returns false for unknown routes', () => {
    expect(isDeprecated('GET', '/v2/users')).toBe(false);
  });
});

describe('recordDeprecatedHit', () => {
  it('returns null for non-deprecated routes', () => {
    expect(recordDeprecatedHit('GET', '/v2/users')).toBeNull();
  });

  it('increments hit counter', () => {
    markDeprecated('DELETE', '/v1/thing');
    recordDeprecatedHit('DELETE', '/v1/thing');
    recordDeprecatedHit('DELETE', '/v1/thing');
    const entry = getDeprecatedRoute('DELETE', '/v1/thing');
    expect(entry.hits).toBe(2);
  });

  it('sets firstHit and lastHit', () => {
    markDeprecated('GET', '/v1/foo');
    recordDeprecatedHit('GET', '/v1/foo');
    const entry = getDeprecatedRoute('GET', '/v1/foo');
    expect(entry.firstHit).not.toBeNull();
    expect(entry.lastHit).not.toBeNull();
  });

  it('does not mutate internal state via returned object', () => {
    markDeprecated('GET', '/v1/bar');
    const result = recordDeprecatedHit('GET', '/v1/bar');
    result.hits = 999;
    expect(getDeprecatedRoute('GET', '/v1/bar').hits).toBe(1);
  });
});

describe('getDeprecatedRoutes', () => {
  it('returns all registered deprecated routes', () => {
    markDeprecated('GET', '/v1/a');
    markDeprecated('POST', '/v1/b');
    const routes = getDeprecatedRoutes();
    expect(routes).toHaveLength(2);
    expect(routes.map((r) => r.path)).toContain('/v1/a');
  });

  it('returns empty array when none registered', () => {
    expect(getDeprecatedRoutes()).toEqual([]);
  });
});

describe('resetDeprecations', () => {
  it('clears all entries', () => {
    markDeprecated('GET', '/v1/x');
    resetDeprecations();
    expect(getDeprecatedRoutes()).toHaveLength(0);
  });
});
