const {
  configureSampling,
  getRateForRoute,
  shouldSample,
  resetSampling,
  getSamplingConfig,
} = require('./sampling');

beforeEach(() => resetSampling());

describe('configureSampling', () => {
  test('sets global rate', () => {
    configureSampling({ rate: 0.5 });
    expect(getSamplingConfig().rate).toBe(0.5);
  });

  test('throws on rate out of range', () => {
    expect(() => configureSampling({ rate: 1.5 })).toThrow(RangeError);
    expect(() => configureSampling({ rate: -0.1 })).toThrow(RangeError);
  });

  test('sets rules', () => {
    configureSampling({ rules: [{ match: '/health', rate: 0 }] });
    expect(getSamplingConfig().rules).toHaveLength(1);
    expect(getSamplingConfig().rules[0].match).toBe('/health');
  });

  test('does not mutate rules array reference', () => {
    const rules = [{ match: '/api', rate: 0.8 }];
    configureSampling({ rules });
    rules.push({ match: '/other', rate: 0.1 });
    expect(getSamplingConfig().rules).toHaveLength(1);
  });
});

describe('getRateForRoute', () => {
  test('returns global rate when no rules match', () => {
    configureSampling({ rate: 0.7 });
    expect(getRateForRoute('/users')).toBe(0.7);
  });

  test('returns rule rate when prefix matches', () => {
    configureSampling({
      rate: 1.0,
      rules: [{ match: '/health', rate: 0 }],
    });
    expect(getRateForRoute('/health')).toBe(0);
    expect(getRateForRoute('/health/check')).toBe(0);
  });

  test('first matching rule wins', () => {
    configureSampling({
      rules: [
        { match: '/api/v1', rate: 0.5 },
        { match: '/api', rate: 0.9 },
      ],
    });
    expect(getRateForRoute('/api/v1/users')).toBe(0.5);
    expect(getRateForRoute('/api/v2/users')).toBe(0.9);
  });
});

describe('shouldSample', () => {
  test('always samples when rate is 1', () => {
    configureSampling({ rate: 1.0 });
    for (let i = 0; i < 20; i++) {
      expect(shouldSample('/anything')).toBe(true);
    }
  });

  test('never samples when rate is 0', () => {
    configureSampling({ rate: 0.0 });
    for (let i = 0; i < 20; i++) {
      expect(shouldSample('/anything')).toBe(false);
    }
  });

  test('respects rule rate of 0 for matched prefix', () => {
    configureSampling({ rules: [{ match: '/health', rate: 0 }] });
    for (let i = 0; i < 10; i++) {
      expect(shouldSample('/health')).toBe(false);
    }
  });

  test('probabilistically samples at 0.5 (statistical)', () => {
    configureSampling({ rate: 0.5 });
    const results = Array.from({ length: 1000 }, () => shouldSample('/test'));
    const trueCount = results.filter(Boolean).length;
    expect(trueCount).toBeGreaterThan(350);
    expect(trueCount).toBeLessThan(650);
  });
});

describe('resetSampling', () => {
  test('restores defaults', () => {
    configureSampling({ rate: 0.2, rules: [{ match: '/x', rate: 0 }] });
    resetSampling();
    const cfg = getSamplingConfig();
    expect(cfg.rate).toBe(1.0);
    expect(cfg.rules).toHaveLength(0);
  });
});
