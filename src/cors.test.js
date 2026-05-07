const {
  recordCorsHit,
  getCorsStats,
  getCorsStatsForOrigin,
  resetCorsStats,
  getSeenOrigins,
} = require('./cors');

beforeEach(() => {
  resetCorsStats();
});

describe('recordCorsHit', () => {
  it('records a hit for an origin', () => {
    recordCorsHit('https://example.com', '/api/users');
    const stats = getCorsStats();
    expect(stats['https://example.com']).toBeDefined();
    expect(stats['https://example.com'].count).toBe(1);
  });

  it('increments count on repeated hits', () => {
    recordCorsHit('https://example.com', '/api/users');
    recordCorsHit('https://example.com', '/api/users');
    const stats = getCorsStats();
    expect(stats['https://example.com'].count).toBe(2);
  });

  it('tracks routes per origin', () => {
    recordCorsHit('https://example.com', '/api/users');
    recordCorsHit('https://example.com', '/api/posts');
    const stats = getCorsStats();
    expect(stats['https://example.com'].routes['/api/users']).toBe(1);
    expect(stats['https://example.com'].routes['/api/posts']).toBe(1);
  });

  it('does nothing when origin is null', () => {
    recordCorsHit(null, '/api/users');
    expect(getSeenOrigins()).toHaveLength(0);
  });

  it('tracks multiple origins independently', () => {
    recordCorsHit('https://a.com', '/api/x');
    recordCorsHit('https://b.com', '/api/y');
    const origins = getSeenOrigins();
    expect(origins).toContain('https://a.com');
    expect(origins).toContain('https://b.com');
  });
});

describe('getCorsStatsForOrigin', () => {
  it('returns stats for a known origin', () => {
    recordCorsHit('https://example.com', '/api/test');
    const result = getCorsStatsForOrigin('https://example.com');
    expect(result).not.toBeNull();
    expect(result.count).toBe(1);
  });

  it('returns null for unknown origin', () => {
    const result = getCorsStatsForOrigin('https://unknown.com');
    expect(result).toBeNull();
  });
});

describe('resetCorsStats', () => {
  it('clears all stats', () => {
    recordCorsHit('https://example.com', '/api/reset');
    resetCorsStats();
    expect(getSeenOrigins()).toHaveLength(0);
  });
});

describe('getCorsStats immutability', () => {
  it('returns a copy, not a reference', () => {
    recordCorsHit('https://example.com', '/api/data');
    const stats = getCorsStats();
    stats['https://example.com'].count = 999;
    const fresh = getCorsStats();
    expect(fresh['https://example.com'].count).toBe(1);
  });
});
