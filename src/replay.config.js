/**
 * replay.config.js
 * Configuration helpers for the replay feature.
 * Allows consumers to tune buffer size and opt-in/out of body capture.
 */

const DEFAULT_CONFIG = {
  /** Maximum number of requests to keep in the replay buffer */
  maxEntries: 100,
  /** Whether to capture request bodies (disable for sensitive routes) */
  captureBody: true,
  /** Whether to capture request headers */
  captureHeaders: true,
  /** Path prefix for the built-in replay router */
  mountPath: '/routewatch/replay',
};

let activeConfig = { ...DEFAULT_CONFIG };

/**
 * Configure replay behaviour.
 * @param {Partial<typeof DEFAULT_CONFIG>} options
 * @returns {typeof DEFAULT_CONFIG}
 */
function configureReplay(options = {}) {
  activeConfig = { ...DEFAULT_CONFIG, ...options };
  return activeConfig;
}

/**
 * Return the current active replay configuration.
 * @returns {typeof DEFAULT_CONFIG}
 */
function getReplayConfig() {
  return { ...activeConfig };
}

/**
 * Reset configuration back to defaults (useful in tests).
 */
function resetReplayConfig() {
  activeConfig = { ...DEFAULT_CONFIG };
}

/**
 * Convenience presets.
 */
const PRESETS = {
  /** Safe mode — no body or header capture */
  safe: { captureBody: false, captureHeaders: false, maxEntries: 50 },
  /** Verbose mode — capture everything, larger buffer */
  verbose: { captureBody: true, captureHeaders: true, maxEntries: 500 },
};

/**
 * Apply a named preset.
 * @param {'safe'|'verbose'} name
 */
function applyPreset(name) {
  if (!PRESETS[name]) throw new Error(`Unknown replay preset: ${name}`);
  return configureReplay(PRESETS[name]);
}

module.exports = { configureReplay, getReplayConfig, resetReplayConfig, applyPreset, PRESETS };
