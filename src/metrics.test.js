const {
  recordMetric,
  getMetrics,
  getMetricsForRoute,
  resetMetrics
} = require('./metrics');

beforeEach(() => resetMetrics());

describe('recordMetric', () => {
  it('creates a new entry on first call', () => {
    recordMetric('/api/users', 'GET', 45, 200);
    const m = getMetricsForRoute('GET', '/api/users');
    expect(m).not.toBeNull();
    expect(m.count).toBe(1);
    expect(m.totalDuration).toBe(45);
  });

  it('accumulates multiple hits', () => {
    recordMetric('/api/items', 'POST', 100, 201);
    recordMetric('/api/items', 'POST', 200, 201);
    recordMetric('/api/items', 'POST', 50, 400);
    const m = getMetricsForRoute('POST', '/api/items');
    expect(m.count).toBe(3);
    expect(m.totalDuration).toBe(350);
  });

  it('tracks min and max duration', () => {
    recordMetric('/health', 'GET', 10, 200);
    recordMetric('/health', 'GET', 300, 200);
    recordMetric('/health', 'GET', 55, 200);
    const m = getMetricsForRoute('GET', '/health');
    expect(m.minDuration).toBe(10);
    expect(m.maxDuration).toBe(300);
  });

  it('computes avgDuration correctly', () => {
    recordMetric('/ping', 'GET', 20, 200);
    recordMetric('/ping', 'GET', 40, 200);
    const m = getMetricsForRoute('GET', '/ping');
    expect(m.avgDuration).toBe(30);
  });

  it('tracks status codes', () => {
    recordMetric('/api/x', 'DELETE', 80, 204);
    recordMetric('/api/x', 'DELETE', 90, 404);
    recordMetric('/api/x', 'DELETE', 70, 204);
    const m = getMetricsForRoute('DELETE', '/api/x');
    expect(m.statusCodes['204']).toBe(2);
    expect(m.statusCodes['404']).toBe(1);
  });

  it('treats method as case-insensitive', () => {
    recordMetric('/lower', 'get', 10, 200);
    const m = getMetricsForRoute('GET', '/lower');
    expect(m).not.toBeNull();
    expect(m.method).toBe('GET');
  });
});

describe('getMetrics', () => {
  it('returns empty array when no data', () => {
    expect(getMetrics()).toEqual([]);
  });

  it('returns all recorded routes', () => {
    recordMetric('/a', 'GET', 10, 200);
    recordMetric('/b', 'POST', 20, 201);
    const all = getMetrics();
    expect(all.length).toBe(2);
  });
});

describe('getMetricsForRoute', () => {
  it('returns null for unknown route', () => {
    expect(getMetricsForRoute('GET', '/nope')).toBeNull();
  });

  it('returns safe zero values for single hit', () => {
    recordMetric('/one', 'GET', 5, 200);
    const m = getMetricsForRoute('GET', '/one');
    expect(m.minDuration).toBe(5);
    expect(m.maxDuration).toBe(5);
    expect(m.avgDuration).toBe(5);
  });
});

describe('resetMetrics', () => {
  it('clears all data', () => {
    recordMetric('/reset-me', 'GET', 10, 200);
    resetMetrics();
    expect(getMetrics()).toEqual([]);
  });
});
