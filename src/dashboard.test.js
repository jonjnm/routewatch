const { buildDashboardHTML, escapeHtml, renderBar } = require('./dashboard');
const reporter = require('./reporter');

beforeEach(() => {
  reporter.resetStats();
});

describe('renderBar', () => {
  test('returns full bar when value equals max', () => {
    const bar = renderBar(10, 10, 10);
    expect(bar).toBe('█'.repeat(10));
  });

  test('returns empty bar when value is 0', () => {
    const bar = renderBar(0, 10, 10);
    expect(bar).toBe('░'.repeat(10));
  });

  test('handles max=0 without division error', () => {
    const bar = renderBar(0, 0, 5);
    expect(bar).toBe('░'.repeat(5));
  });

  test('returns partial bar', () => {
    const bar = renderBar(5, 10, 10);
    expect(bar).toBe('█'.repeat(5) + '░'.repeat(5));
  });
});

describe('escapeHtml', () => {
  test('escapes < and >', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  test('escapes &', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  test('leaves plain strings unchanged', () => {
    expect(escapeHtml('/api/users')).toBe('/api/users');
  });
});

describe('buildDashboardHTML', () => {
  test('returns valid HTML string', () => {
    const html = buildDashboardHTML();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('RouteWatch Dashboard');
  });

  test('shows empty message when no routes recorded', () => {
    const html = buildDashboardHTML();
    expect(html).toContain('No routes recorded yet.');
  });

  test('includes route data when routes exist', () => {
    reporter.recordHit('GET', '/api/users', 200, 45);
    reporter.recordHit('GET', '/api/users', 200, 55);
    reporter.recordHit('POST', '/api/items', 201, 30);
    const html = buildDashboardHTML();
    expect(html).toContain('/api/users');
    expect(html).toContain('/api/items');
  });

  test('respects custom title option', () => {
    const html = buildDashboardHTML({ title: 'My API Monitor' });
    expect(html).toContain('My API Monitor');
  });

  test('limits rows to maxBars option', () => {
    for (let i = 0; i < 15; i++) {
      reporter.recordHit('GET', `/api/route${i}`, 200, 10);
    }
    const html = buildDashboardHTML({ maxBars: 5 });
    const matches = html.match(/class="route"/g) || [];
    expect(matches.length).toBe(5);
  });

  test('escapes route names in output', () => {
    reporter.recordHit('GET', '/api/<test>', 200, 10);
    const html = buildDashboardHTML();
    expect(html).toContain('&lt;test&gt;');
    expect(html).not.toContain('<test>');
  });
});
