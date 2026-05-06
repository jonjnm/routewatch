/**
 * dashboard.js — Generates a simple HTML dashboard for route stats
 */

const { getSummary } = require('./reporter');

function renderBar(value, max, width = 20) {
  const filled = max > 0 ? Math.round((value / max) * width) : 0;
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function buildDashboardHTML(options = {}) {
  const { title = 'RouteWatch Dashboard', maxBars = 10 } = options;
  const summary = getSummary();
  const routes = Object.entries(summary)
    .sort((a, b) => b[1].hits - a[1].hits)
    .slice(0, maxBars);

  const maxHits = routes.length > 0 ? routes[0][1].hits : 1;

  const rows = routes.map(([route, data]) => {
    const bar = renderBar(data.hits, maxHits);
    const avgMs = data.avgMs != null ? `${data.avgMs.toFixed(1)}ms` : 'n/a';
    return `
      <tr>
        <td class="route">${escapeHtml(route)}</td>
        <td class="hits">${data.hits}</td>
        <td class="bar"><span class="bar-fill" style="width:${Math.round((data.hits / maxHits) * 100)}%"></span></td>
        <td class="avg">${avgMs}</td>
        <td class="last">${data.lastSeen ? new Date(data.lastSeen).toISOString() : '—'}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: monospace; background: #111; color: #eee; padding: 2rem; }
    h1 { color: #7ef; margin-bottom: 1rem; }
    table { border-collapse: collapse; width: 100%; }
    th { text-align: left; color: #aaa; padding: 0.4rem 0.8rem; border-bottom: 1px solid #333; }
    td { padding: 0.4rem 0.8rem; border-bottom: 1px solid #222; }
    .route { color: #7ef; }
    .hits { color: #fe8; font-weight: bold; }
    .bar { width: 160px; background: #222; position: relative; height: 1.2em; }
    .bar-fill { display: inline-block; background: #4af; height: 100%; position: absolute; left: 0; top: 0; }
    .avg { color: #afa; }
    .last { color: #888; font-size: 0.85em; }
    .empty { color: #555; padding: 1rem 0; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <table>
    <thead><tr><th>Route</th><th>Hits</th><th>Traffic</th><th>Avg Latency</th><th>Last Seen</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5" class="empty">No routes recorded yet.</td></tr>'}</tbody>
  </table>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = { buildDashboardHTML, escapeHtml, renderBar };
