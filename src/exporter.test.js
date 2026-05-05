const { exportJSON, exportCSV, escapeCSV } = require('./exporter');
const reporter = require('./reporter');

beforeEach(() => {
  reporter.resetStats();
});

describe('escapeCSV', () => {
  it('returns plain strings unchanged', () => {
    expect(escapeCSV('GET')).toBe('GET');
  });

  it('wraps strings containing commas in quotes', () => {
    expect(escapeCSV('/api,v1')).toBe('"/api,v1"');
  });

  it('escapes double quotes inside values', () => {
    expect(escapeCSV('say "hi"')).toBe('"say ""hi"""');
  });
});

describe('exportJSON', () => {
  it('returns an empty array JSON string when no hits recorded', () => {
    const result = exportJSON();
    expect(JSON.parse(result)).toEqual([]);
  });

  it('includes recorded route data', () => {
    reporter.recordHit('/api/users', 'GET', 200, 42);
    const result = JSON.parse(exportJSON());
    expect(result).toHaveLength(1);
    expect(result[0].route).toBe('/api/users');
    expect(result[0].method).toBe('GET');
    expect(result[0].hits).toBe(1);
  });

  it('pretty-prints when option is set', () => {
    reporter.recordHit('/health', 'GET', 200, 5);
    const result = exportJSON({ pretty: true });
    expect(result).toContain('\n');
    expect(result).toContain('  ');
  });
});

describe('exportCSV', () => {
  it('returns only header row when no data', () => {
    const result = exportCSV();
    expect(result.trim()).toBe('route,method,hits,lastSeen');
  });

  it('includes a data row for each recorded route', () => {
    reporter.recordHit('/api/items', 'POST', 201, 10);
    reporter.recordHit('/api/items', 'POST', 201, 8);
    reporter.recordHit('/api/users', 'GET', 200, 3);

    const lines = exportCSV().trim().split('\n');
    expect(lines).toHaveLength(3); // header + 2 routes
    expect(lines[0]).toBe('route,method,hits,lastSeen');

    const dataLines = lines.slice(1);
    const itemsLine = dataLines.find((l) => l.includes('/api/items'));
    expect(itemsLine).toBeDefined();
    expect(itemsLine).toContain('POST');
    expect(itemsLine).toContain('2');
  });

  it('outputs a valid ISO date in the lastSeen column', () => {
    reporter.recordHit('/ping', 'GET', 200, 1);
    const lines = exportCSV().trim().split('\n');
    const dataLine = lines[1];
    const parts = dataLine.split(',');
    const lastSeen = parts[3];
    expect(() => new Date(lastSeen).toISOString()).not.toThrow();
  });
});
