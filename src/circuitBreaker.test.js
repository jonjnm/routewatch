const {
  configureCircuitBreaker,
  recordSuccess,
  recordFailure,
  isOpen,
  getCircuitState,
  resetCircuitBreaker,
} = require('./circuitBreaker');

beforeEach(() => resetCircuitBreaker());

describe('recordFailure / isOpen', () => {
  test('circuit stays closed below threshold', () => {
    configureCircuitBreaker({ threshold: 3 });
    recordFailure('GET /api');
    recordFailure('GET /api');
    expect(isOpen('GET /api')).toBe(false);
  });

  test('circuit opens at threshold', () => {
    configureCircuitBreaker({ threshold: 3 });
    recordFailure('GET /api');
    recordFailure('GET /api');
    recordFailure('GET /api');
    expect(isOpen('GET /api')).toBe(true);
  });

  test('open circuit resets after resetMs', () => {
    configureCircuitBreaker({ threshold: 1, resetMs: 0 });
    recordFailure('GET /slow');
    expect(isOpen('GET /slow')).toBe(false);
  });
});

describe('recordSuccess', () => {
  test('resets failure count on success', () => {
    configureCircuitBreaker({ threshold: 3 });
    recordFailure('POST /data');
    recordFailure('POST /data');
    recordSuccess('POST /data');
    const s = getCircuitState('POST /data');
    expect(s.failures).toBe(0);
    expect(s.open).toBe(false);
  });

  test('success on open circuit does not close it early', () => {
    configureCircuitBreaker({ threshold: 2, resetMs: 60000 });
    recordFailure('DELETE /item');
    recordFailure('DELETE /item');
    recordSuccess('DELETE /item');
    expect(isOpen('DELETE /item')).toBe(true);
  });
});

describe('getCircuitState', () => {
  test('returns copy of state', () => {
    recordFailure('GET /x');
    const s = getCircuitState('GET /x');
    expect(s).toHaveProperty('failures', 1);
    expect(s).toHaveProperty('open', false);
  });
});

describe('configureCircuitBreaker', () => {
  test('applies custom threshold and resetMs', () => {
    configureCircuitBreaker({ threshold: 10, resetMs: 5000 });
    for (let i = 0; i < 9; i++) recordFailure('GET /heavy');
    expect(isOpen('GET /heavy')).toBe(false);
    recordFailure('GET /heavy');
    expect(isOpen('GET /heavy')).toBe(true);
  });
});
