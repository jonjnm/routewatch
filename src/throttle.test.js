'use strict';

const { configureThrottle, getThrottleConfig, checkThrottle, getThrottleState, resetThrottle } = require('./throttle');

beforeEach(() => {
  resetThrottle();
  configureThrottle({ windowMs: 60000, maxRequests: 100, routes: {} });
});

describe('configureThrottle / getThrottleConfig', () => {
  it('returns default config', () => {
    const cfg = getThrottleConfig();
    expect(cfg.windowMs).toBe(60000);
    expect(cfg.maxRequests).toBe(100);
  });

  it('merges custom config', () => {
    configureThrottle({ maxRequests: 50 });
    expect(getThrottleConfig().maxRequests).toBe(50);
    expect(getThrottleConfig().windowMs).toBe(60000);
  });

  it('supports per-route config', () => {
    configureThrottle({ routes: { '/api/login': { windowMs: 10000, maxRequests: 5 } } });
    const cfg = getThrottleConfig();
    expect(cfg.routes['/api/login'].maxRequests).toBe(5);
  });
});

describe('checkThrottle', () => {
  it('allows requests under limit', () => {
    const result = checkThrottle('/api/data');
    expect(result.allowed).toBe(true);
    expect(result.count).toBe(1);
    expect(result.remaining).toBe(99);
  });

  it('blocks requests over limit', () => {
    configureThrottle({ maxRequests: 3 });
    checkThrottle('/api/data');
    checkThrottle('/api/data');
    checkThrottle('/api/data');
    const result = checkThrottle('/api/data');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets count after window expires', () => {
    configureThrottle({ windowMs: 1, maxRequests: 1 });
    checkThrottle('/api/data');
    return new Promise(resolve => setTimeout(() => {
      const result = checkThrottle('/api/data');
      expect(result.allowed).toBe(true);
      expect(result.count).toBe(1);
      resolve();
    }, 10));
  });

  it('uses per-route config when available', () => {
    configureThrottle({ maxRequests: 100, routes: { '/api/login': { windowMs: 60000, maxRequests: 2 } } });
    checkThrottle('/api/login');
    checkThrottle('/api/login');
    const result = checkThrottle('/api/login');
    expect(result.allowed).toBe(false);
  });
});

describe('getThrottleState', () => {
  it('returns null for unseen route', () => {
    expect(getThrottleState('/api/unknown')).toBeNull();
  });

  it('returns state after hit', () => {
    checkThrottle('/api/data');
    const state = getThrottleState('/api/data');
    expect(state.count).toBe(1);
    expect(typeof state.windowStart).toBe('number');
  });
});

describe('resetThrottle', () => {
  it('clears all state', () => {
    checkThrottle('/api/data');
    resetThrottle();
    expect(getThrottleState('/api/data')).toBeNull();
  });
});
