const {
  configureRetention,
  getRetentionConfig,
  addEntry,
  pruneAll,
  getEntries,
  getAllEntries,
  resetRetention
} = require('./retention');

beforeEach(() => {
  resetRetention();
});

describe('configureRetention', () => {
  it('sets custom maxEntries and ttlMs', () => {
    configureRetention({ maxEntries: 50, ttlMs: 5000 });
    const cfg = getRetentionConfig();
    expect(cfg.maxEntries).toBe(50);
    expect(cfg.ttlMs).toBe(5000);
  });

  it('retains defaults for unspecified fields', () => {
    configureRetention({ maxEntries: 10 });
    const cfg = getRetentionConfig();
    expect(cfg.enabled).toBe(true);
  });
});

describe('addEntry / getEntries', () => {
  it('stores an entry for a route key', () => {
    addEntry('GET /api/users', { status: 200, durationMs: 12 });
    const entries = getEntries('GET /api/users');
    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe(200);
    expect(entries[0].durationMs).toBe(12);
    expect(entries[0].timestamp).toBeDefined();
  });

  it('accumulates multiple entries', () => {
    addEntry('GET /ping', { status: 200 });
    addEntry('GET /ping', { status: 204 });
    expect(getEntries('GET /ping')).toHaveLength(2);
  });

  it('returns empty array for unknown route', () => {
    expect(getEntries('POST /nothing')).toEqual([]);
  });
});

describe('pruning by maxEntries', () => {
  it('trims entries exceeding maxEntries', () => {
    configureRetention({ maxEntries: 3, ttlMs: 9999999 });
    for (let i = 0; i < 6; i++) {
      addEntry('GET /route', { status: 200, i });
    }
    const entries = getEntries('GET /route');
    expect(entries).toHaveLength(3);
    // Should keep the most recent
    expect(entries[2].i).toBe(5);
  });
});

describe('pruning by TTL', () => {
  it('removes entries older than ttlMs', () => {
    configureRetention({ ttlMs: 100, maxEntries: 1000 });
    addEntry('GET /old', { status: 200 });

    // Manually backdate the entry
    const { getEntries: ge } = require('./retention');
    // Use getAllEntries to manipulate internal state via the module
    return new Promise(resolve => {
      setTimeout(() => {
        addEntry('GET /old', { status: 201 }); // triggers prune
        const entries = ge('GET /old');
        // Only the fresh entry should survive
        expect(entries.every(e => e.status === 201)).toBe(true);
        resolve();
      }, 150);
    });
  });
});

describe('getAllEntries', () => {
  it('returns entries for all routes', () => {
    addEntry('GET /a', { status: 200 });
    addEntry('POST /b', { status: 201 });
    const all = getAllEntries();
    expect(Object.keys(all)).toContain('GET /a');
    expect(Object.keys(all)).toContain('POST /b');
  });
});

describe('resetRetention', () => {
  it('clears all entries and resets config', () => {
    configureRetention({ maxEntries: 5 });
    addEntry('GET /x', { status: 200 });
    resetRetention();
    expect(getAllEntries()).toEqual({});
    expect(getRetentionConfig().maxEntries).toBe(1000);
  });
});
