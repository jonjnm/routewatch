const { recordHit, getSummary, resetStats } = require('./reporter');

beforeEach(() => {
  resetStats();
});

describe('recordHit', () => {
  it('records a single hit', () => {
    recordHit('GET', '/users', 200, 42);
    const summary = getSummary();
    expect(summary).toHaveLength(1);
    expect(summary[0].hits).toBe(1);
    expect(summary[0].route).toBe('GET /users');
  });

  it('accumulates multiple hits for the same route', () => {
    recordHit('GET', '/users', 200, 10);
    recordHit('GET', '/users', 200, 30);
    recordHit('GET', '/users', 200, 20);
    const summary = getSummary();
    expect(summary[0].hits).toBe(3);
    expect(summary[0].avgDuration).toBe(20);
  });

  it('tracks min and max duration', () => {
    recordHit('POST', '/items', 201, 5);
    recordHit('POST', '/items', 201, 95);
    const summary = getSummary();
    expect(summary[0].minDuration).toBe(5);
    expect(summary[0].maxDuration).toBe(95);
  });

  it('counts 4xx and 5xx responses as errors', () => {
    recordHit('DELETE', '/item/1', 404, 8);
    recordHit('DELETE', '/item/2', 500, 12);
    recordHit('DELETE', '/item/3', 200, 9);
    const summary = getSummary();
    expect(summary[0].errors).toBe(2);
  });

  it('treats different methods on same path as separate routes', () => {
    recordHit('GET', '/ping', 200, 5);
    recordHit('POST', '/ping', 200, 5);
    const summary = getSummary();
    expect(summary).toHaveLength(2);
  });
});

describe('getSummary', () => {
  it('returns empty array when no hits recorded', () => {
    expect(getSummary()).toEqual([]);
  });

  it('returns avgDuration of 0 when hits is 0 (edge case via resetStats)', () => {
    resetStats();
    expect(getSummary()).toHaveLength(0);
  });
});

describe('resetStats', () => {
  it('clears all recorded stats', () => {
    recordHit('GET', '/test', 200, 10);
    resetStats();
    expect(getSummary()).toHaveLength(0);
  });
});
