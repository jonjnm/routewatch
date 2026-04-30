/**
 * logger.js
 * Handles formatting and output of route log entries.
 */

const DEFAULT_OPTIONS = {
  format: 'default',
  output: console.log,
  includeTimestamp: true,
  includeBody: false,
};

/**
 * Formats a log entry as a plain string.
 * @param {object} entry
 * @returns {string}
 */
function formatDefault(entry) {
  const parts = [];
  if (entry.timestamp) parts.push(`[${entry.timestamp}]`);
  parts.push(`${entry.method} ${entry.path}`);
  parts.push(`${entry.statusCode}`);
  parts.push(`${entry.duration}ms`);
  return parts.join(' ');
}

/**
 * Formats a log entry as a JSON string.
 * @param {object} entry
 * @returns {string}
 */
function formatJSON(entry) {
  return JSON.stringify(entry);
}

/**
 * Builds a log entry object from request/response data.
 * @param {object} req
 * @param {object} res
 * @param {number} duration - ms
 * @param {object} options
 * @returns {object}
 */
function buildEntry(req, res, duration, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const entry = {
    method: req.method,
    path: req.originalUrl || req.url,
    statusCode: res.statusCode,
    duration,
  };

  if (opts.includeTimestamp) {
    entry.timestamp = new Date().toISOString();
  }

  if (opts.includeBody && req.body) {
    entry.body = req.body;
  }

  return entry;
}

/**
 * Logs a single route entry using the configured format and output.
 * @param {object} req
 * @param {object} res
 * @param {number} duration
 * @param {object} options
 */
function logEntry(req, res, duration, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const entry = buildEntry(req, res, duration, opts);

  let message;
  if (opts.format === 'json') {
    message = formatJSON(entry);
  } else {
    message = formatDefault(entry);
  }

  opts.output(message);
  return entry;
}

module.exports = { logEntry, buildEntry, formatDefault, formatJSON };
