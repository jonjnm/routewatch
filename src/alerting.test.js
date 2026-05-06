const {
  configureAlerts,
  recordAlertHit,
  resetAlerts,
  getAlertState,
} = require('./alerting');

beforeEach(() => {
  resetAlerts();
});

describe('configureAlerts / recordAlertHit – high traffic', () => {
  test('fires onAlert when hits exceed maxHitsPerMinute', () => {
    const alerts = [];
    configureAlerts({
      maxHitsPerMinute: 3,
      onAlert: (type, route, value) => alerts.push({ type, route, value }),
    });

    recordAlertHit('GET /api/data');
    recordAlertHit('GET /api/data');
    recordAlertHit('GET /api/data');
    expect(alerts).toHaveLength(0);

    recordAlertHit('GET /api/data');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('HIGH_TRAFFIC');
    expect(alerts[0].route).toBe('GET /api/data');
    expect(alerts[0].value).toBe(4);
  });

  test('does not fire for a different route', () => {
    const alerts = [];
    configureAlerts({
      maxHitsPerMinute: 2,
      onAlert: (type, route) => alerts.push({ type, route }),
    });

    recordAlertHit('GET /api/a');
    recordAlertHit('GET /api/b');
    recordAlertHit('GET /api/b');
    expect(alerts).toHaveLength(0);
  });
});

describe('recordAlertHit – error rate', () => {
  test('fires HIGH_ERROR_RATE when rate exceeds threshold after 5 hits', () => {
    const alerts = [];
    configureAlerts({
      maxErrorRate: 0.5,
      onAlert: (type, route, value) => alerts.push({ type, route, value }),
    });

    // 4 errors out of 5 = 0.8 > 0.5
    recordAlertHit('POST /api/save', true);
    recordAlertHit('POST /api/save', true);
    recordAlertHit('POST /api/save', true);
    recordAlertHit('POST /api/save', true);
    recordAlertHit('POST /api/save', false);

    expect(alerts.length).toBeGreaterThanOrEqual(1);
    expect(alerts[0].type).toBe('HIGH_ERROR_RATE');
  });

  test('does not fire when fewer than 5 total hits', () => {
    const alerts = [];
    configureAlerts({
      maxErrorRate: 0.1,
      onAlert: (type) => alerts.push(type),
    });

    recordAlertHit('DELETE /api/item', true);
    recordAlertHit('DELETE /api/item', true);
    expect(alerts).toHaveLength(0);
  });
});

describe('resetAlerts', () => {
  test('clears state and options', () => {
    configureAlerts({ maxHitsPerMinute: 1, onAlert: () => {} });
    recordAlertHit('GET /x');
    resetAlerts();
    const state = getAlertState();
    expect(Object.keys(state.hitWindows)).toHaveLength(0);
    expect(Object.keys(state.errorCounts)).toHaveLength(0);
  });
});
