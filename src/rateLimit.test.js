const { checkRateLimit, getWindow, resetRateLimits } = require('./rateLimit');

beforeEach(() => {
  resetRateLimits();
});

describe('checkRateLimit', () => {
  it('returns not limited for first request', () => {
    const result = checkRateLimit('GET /api/items', 60000, 10);
    expect(result.limited).toBe(false);
    expect(result.count).toBe(1);
    expect(result.remaining).toBe(9);
  });

  it('counts multiple requests correctly', () => {
    checkRateLimit('GET /api/items', 60000, 10);
    checkRateLimit('GET /api/items', 60000, 10);
    const result = checkRateLimit('GET /api/items', 60000, 10);
    expect(result.count).toBe(3);
    expect(result.remaining).toBe(7);
  });

  it('flags as limited when count exceeds maxRequests', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('POST /api/login', 60000, 3);
    }
    const result = checkRateLimit('POST /api/login', 60000, 3);
    expect(result.limited).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('tracks different routes independently', () => {
    checkRateLimit('GET /api/a', 60000, 5);
    checkRateLimit('GET /api/a', 60000, 5);
    const resultA = checkRateLimit('GET /api/a', 60000, 5);
    const resultB = checkRateLimit('GET /api/b', 60000, 5);
    expect(resultA.count).toBe(3);
    expect(resultB.count).toBe(1);
  });

  it('evicts timestamps outside the window', () => {
    const route = 'GET /api/old';
    const windowMs = 100;

    // Manually seed an old timestamp by calling checkRateLimit and then
    // manipulating the window indirectly via multiple calls with a tiny window
    checkRateLimit(route, windowMs, 100);

    return new Promise(resolve => {
      setTimeout(() => {
        // After window expires, new call should reset count to 1
        const result = checkRateLimit(route, windowMs, 100);
        expect(result.count).toBe(1);
        resolve();
      }, 150);
    });
  });
});

describe('getWindow', () => {
  it('returns empty array for unknown route', () => {
    expect(getWindow('GET /unknown')).toEqual([]);
  });

  it('returns copy of timestamps after requests', () => {
    checkRateLimit('GET /api/test', 60000, 10);
    checkRateLimit('GET /api/test', 60000, 10);
    const window = getWindow('GET /api/test');
    expect(window).toHaveLength(2);
    expect(typeof window[0]).toBe('number');
  });
});

describe('resetRateLimits', () => {
  it('clears all state', () => {
    checkRateLimit('GET /api/x', 60000, 5);
    resetRateLimits();
    expect(getWindow('GET /api/x')).toEqual([]);
  });
});
