/**
 * exporter.js
 * Utilities for exporting collected route stats to JSON or CSV format.
 */

const { getSummary } = require('./reporter');

/**
 * Export summary data as a JSON string.
 * @param {object} [options]
 * @param {boolean} [options.pretty=false] - pretty-print the JSON
 * @returns {string}
 */
function exportJSON(options = {}) {
  const { pretty = false } = options;
  const summary = getSummary();
  return pretty
    ? JSON.stringify(summary, null, 2)
    : JSON.stringify(summary);
}

/**
 * Export summary data as a CSV string.
 * Columns: route, method, hits, lastSeen
 * @returns {string}
 */
function exportCSV() {
  const summary = getSummary();
  const header = 'route,method,hits,lastSeen';

  if (!summary || summary.length === 0) {
    return header + '\n';
  }

  const rows = summary.map((entry) => {
    const route = escapeCSV(entry.route || '');
    const method = escapeCSV(entry.method || '');
    const hits = entry.hits != null ? entry.hits : 0;
    const lastSeen = entry.lastSeen ? new Date(entry.lastSeen).toISOString() : '';
    return `${route},${method},${hits},${lastSeen}`;
  });

  return [header, ...rows].join('\n') + '\n';
}

/**
 * Escape a value for safe inclusion in a CSV field.
 * @param {string} value
 * @returns {string}
 */
function escapeCSV(value) {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

module.exports = { exportJSON, exportCSV, escapeCSV };
