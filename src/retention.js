/**
 * retention.js — manage log/hit data retention policies
 * Automatically prunes stale entries beyond a configured TTL or max count.
 */

let retentionConfig = {
  maxEntries: 1000,
  ttlMs: 1000 * 60 * 60 * 24, // 24 hours default
  enabled: true
};

// Internal store: routeKey -> [{ timestamp, ...data }]
const retentionStore = new Map();

function configureRetention(opts = {}) {
  retentionConfig = { ...retentionConfig, ...opts };
}

function getRetentionConfig() {
  return { ...retentionConfig };
}

function addEntry(routeKey, data) {
  if (!retentionStore.has(routeKey)) {
    retentionStore.set(routeKey, []);
  }
  const entries = retentionStore.get(routeKey);
  entries.push({ timestamp: Date.now(), ...data });

  if (retentionConfig.enabled) {
    pruneRoute(routeKey);
  }
}

function pruneRoute(routeKey) {
  const now = Date.now();
  let entries = retentionStore.get(routeKey) || [];

  // Remove entries older than TTL
  entries = entries.filter(e => now - e.timestamp <= retentionConfig.ttlMs);

  // Trim to maxEntries (keep most recent)
  if (entries.length > retentionConfig.maxEntries) {
    entries = entries.slice(entries.length - retentionConfig.maxEntries);
  }

  retentionStore.set(routeKey, entries);
}

function pruneAll() {
  for (const key of retentionStore.keys()) {
    pruneRoute(key);
  }
}

function getEntries(routeKey) {
  pruneRoute(routeKey);
  return [...(retentionStore.get(routeKey) || [])];
}

function getAllEntries() {
  pruneAll();
  const result = {};
  for (const [key, entries] of retentionStore.entries()) {
    result[key] = [...entries];
  }
  return result;
}

function resetRetention() {
  retentionStore.clear();
  retentionConfig = {
    maxEntries: 1000,
    ttlMs: 1000 * 60 * 60 * 24,
    enabled: true
  };
}

module.exports = {
  configureRetention,
  getRetentionConfig,
  addEntry,
  pruneAll,
  getEntries,
  getAllEntries,
  resetRetention
};
