const { logEntry, buildEntry, formatDefault, formatJSON } = require('./logger');

const mockReq = (overrides = {}) => ({
  method: 'GET',
  url: '/api/users',
  originalUrl: '/api/users',
  body: null,
  ...overrides,
});

const mockRes = (overrides = {}) => ({
  statusCode: 200,
  ...overrides,
});

describe('buildEntry', () => {
  it('builds a basic log entry', () => {
    const entry = buildEntry(mockReq(), mockRes(), 42);
    expect(entry.method).toBe('GET');
    expect(entry.path).toBe('/api/users');
    expect(entry.statusCode).toBe(200);
    expect(entry.duration).toBe(42);
  });

  it('includes timestamp by default', () => {
    const entry = buildEntry(mockReq(), mockRes(), 10);
    expect(entry.timestamp).toBeDefined();
    expect(typeof entry.timestamp).toBe('string');
  });

  it('omits timestamp when includeTimestamp is false', () => {
    const entry = buildEntry(mockReq(), mockRes(), 10, { includeTimestamp: false });
    expect(entry.timestamp).toBeUndefined();
  });

  it('includes body when includeBody is true', () => {
    const req = mockReq({ body: { name: 'Alice' } });
    const entry = buildEntry(req, mockRes(), 5, { includeBody: true });
    expect(entry.body).toEqual({ name: 'Alice' });
  });

  it('omits body by default', () => {
    const req = mockReq({ body: { secret: '123' } });
    const entry = buildEntry(req, mockRes(), 5);
    expect(entry.body).toBeUndefined();
  });
});

describe('formatDefault', () => {
  it('returns a formatted string with all fields', () => {
    const entry = { timestamp: '2024-01-01T00:00:00.000Z', method: 'POST', path: '/api/items', statusCode: 201, duration: 15 };
    const result = formatDefault(entry);
    expect(result).toContain('POST /api/items');
    expect(result).toContain('201');
    expect(result).toContain('15ms');
    expect(result).toContain('2024-01-01T00:00:00.000Z');
  });
});

describe('formatJSON', () => {
  it('returns a valid JSON string', () => {
    const entry = { method: 'GET', path: '/health', statusCode: 200, duration: 3 };
    const result = formatJSON(entry);
    expect(() => JSON.parse(result)).not.toThrow();
    expect(JSON.parse(result)).toMatchObject(entry);
  });
});

describe('logEntry', () => {
  it('calls the output function with formatted message', () => {
    const output = jest.fn();
    logEntry(mockReq(), mockRes(), 20, { output });
    expect(output).toHaveBeenCalledTimes(1);
    expect(typeof output.mock.calls[0][0]).toBe('string');
  });

  it('uses json format when specified', () => {
    const output = jest.fn();
    logEntry(mockReq(), mockRes(), 20, { output, format: 'json' });
    const logged = output.mock.calls[0][0];
    expect(() => JSON.parse(logged)).not.toThrow();
  });

  it('returns the built entry', () => {
    const output = jest.fn();
    const entry = logEntry(mockReq(), mockRes({ statusCode: 404 }), 8, { output });
    expect(entry.statusCode).toBe(404);
  });
});
