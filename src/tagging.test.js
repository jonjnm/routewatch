const {
  tagRoute,
  getTagsForRoute,
  getRoutesByTag,
  clearTagsForRoute,
  resetTags,
  getAllTags,
} = require('./tagging');

beforeEach(() => {
  resetTags();
});

describe('tagRoute', () => {
  test('assigns tags to a route', () => {
    tagRoute('/api/users', ['auth', 'public']);
    expect(getTagsForRoute('/api/users')).toEqual(['auth', 'public']);
  });

  test('merges tags on repeated calls', () => {
    tagRoute('/api/users', ['auth']);
    tagRoute('/api/users', ['public']);
    expect(getTagsForRoute('/api/users')).toEqual(['auth', 'public']);
  });

  test('deduplicates tags', () => {
    tagRoute('/api/users', ['auth', 'auth']);
    tagRoute('/api/users', ['auth']);
    expect(getTagsForRoute('/api/users')).toEqual(['auth']);
  });

  test('throws if route is missing', () => {
    expect(() => tagRoute(null, ['auth'])).toThrow();
  });

  test('throws if tags is not an array', () => {
    expect(() => tagRoute('/api/users', 'auth')).toThrow();
  });
});

describe('getTagsForRoute', () => {
  test('returns empty array for unknown route', () => {
    expect(getTagsForRoute('/unknown')).toEqual([]);
  });
});

describe('getRoutesByTag', () => {
  beforeEach(() => {
    tagRoute('/api/users', ['auth', 'v1']);
    tagRoute('/api/posts', ['public', 'v1']);
    tagRoute('/api/admin', ['auth', 'internal']);
  });

  test('returns routes matching a single tag', () => {
    const routes = getRoutesByTag(['auth']);
    expect(routes).toContain('/api/users');
    expect(routes).toContain('/api/admin');
    expect(routes).not.toContain('/api/posts');
  });

  test('returns routes matching any of multiple tags', () => {
    const routes = getRoutesByTag(['public', 'internal']);
    expect(routes).toContain('/api/posts');
    expect(routes).toContain('/api/admin');
  });

  test('returns empty array for empty tag list', () => {
    expect(getRoutesByTag([])).toEqual([]);
  });
});

describe('clearTagsForRoute', () => {
  test('removes tags for a specific route', () => {
    tagRoute('/api/users', ['auth']);
    clearTagsForRoute('/api/users');
    expect(getTagsForRoute('/api/users')).toEqual([]);
  });
});

describe('getAllTags', () => {
  test('returns snapshot of all tagged routes', () => {
    tagRoute('/api/users', ['auth']);
    tagRoute('/api/posts', ['public']);
    const all = getAllTags();
    expect(all).toEqual({
      '/api/users': ['auth'],
      '/api/posts': ['public'],
    });
  });

  test('returns empty object when no tags set', () => {
    expect(getAllTags()).toEqual({});
  });
});
