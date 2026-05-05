/**
 * middleware.js
 * Core routewatch middleware — logs and audits API route usage.
 * Accepts an optional filter config to control which requests are processed.
 */

const { logEntry, buildEntry } = require('./logger');
const { recordHit } = require('./reporter');
const { buildFilter } = require('./filter');

/**
 * routewatch(options)
 * Returns an Express middleware function.
 *
 * @param {Object} [options]
 * @param {string}   [options.format='default']     - 'default' | 'json'
 * @param {boolean}  [options.silent=false]         - suppress console output
 * @param {boolean}  [options.track=true]           - record hits in reporter
 * @param {string[]} [options.excludePaths]         - path prefixes to ignore
 * @param {string[]} [options.includeMethods]       - only log these methods
 * @param {number[]} [options.excludeStatuses]      - status codes to ignore
 */
function routewatch(options = {}) {
  const {
    format = 'default',
    silent = false,
    track = true,
    excludePaths,
    includeMethods,
    excludeStatuses,
  } = options;

  const filter = buildFilter({ excludePaths, includeMethods, excludeStatuses });

  return function middleware(req, res, next) {
    const startTime = Date.now();

    res.on('finish', () => {
      if (!filter(req, res)) return;

      const duration = Date.now() - startTime;
      const entry = buildEntry(req, res, duration);

      if (!silent) {
        logEntry(entry, format);
      }

      if (track) {
        recordHit(entry);
      }
    });

    next();
  };
}

module.exports = { routewatch, middleware: routewatch };
