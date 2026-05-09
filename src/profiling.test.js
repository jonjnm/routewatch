const { recordTiming, getProfilingStats, getAllProfilingStats, resetProfiling } = require('./profiling');

beforeEach(() => resetProfiling());

describe('recordTiming', () => {
  test('records a single timing', () => {
    recordTiming('GET /foo', 120);
    const s = getProfilingStats('GET /foo');
    expect(s.count).toBe(1);
    expect(s.total).toBeUndefined(); // not exposed directly
    expect(s.avg).toBe(120);
    expect(s.min).toBe(120);
    expect(s.max).toBe(120);
  });

  test('accumulates multiple timings', () => {
    recordTiming('GET /bar', 100);
    recordTiming('GET /bar', 200);
    recordTiming('GET /bar', 300);
    const s = getProfilingStats('GET /bar');
    expect(s.count).toBe(3);
    expect(s.avg).toBe(200);
    expect(s.min).toBe(100);
    expect(s.max).toBe(300);
  });

  test('caps samples at 100', () => {
    for (let i = 0; i < 110; i++) recordTiming('GET /baz', i);
    const s = getProfilingStats('GET /baz');
    expect(s.count).toBe(110);
    // internal samples capped but stats still accurate from count/total
  });
});

describe('getProfilingStats', () => {
  test('returns null for unknown route', () => {
    expect(getProfilingStats('GET /unknown')).toBeNull();
  });

  test('computes p95 and p99', () => {
    for (let i = 1; i <= 100; i++) recordTiming('GET /p', i);
    const s = getProfilingStats('GET /p');
    expect(s.p95).toBe(95);
    expect(s.p99).toBe(99);
  });

  test('handles single sample percentiles', () => {
    recordTiming('GET /single', 42);
    const s = getProfilingStats('GET /single');
    expect(s.p95).toBe(42);
    expect(s.p99).toBe(42);
  });
});

describe('getAllProfilingStats', () => {
  test('returns empty array when no data', () => {
    expect(getAllProfilingStats()).toEqual([]);
  });

  test('returns stats for all recorded routes', () => {
    recordTiming('GET /a', 10);
    recordTiming('POST /b', 20);
    const all = getAllProfilingStats();
    expect(all).toHaveLength(2);
    const routes = all.map(s => s.route);
    expect(routes).toContain('GET /a');
    expect(routes).toContain('POST /b');
  });
});

describe('resetProfiling', () => {
  test('clears all state', () => {
    recordTiming('GET /reset', 50);
    resetProfiling();
    expect(getAllProfilingStats()).toEqual([]);
    expect(getProfilingStats('GET /reset')).toBeNull();
  });
});
