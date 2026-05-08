const {
  generateTraceId,
  startTrace,
  addSpan,
  finishTrace,
  getTrace,
  getAllTraces,
  resetTraces,
} = require('./tracing');

beforeEach(() => resetTraces());

describe('generateTraceId', () => {
  it('returns a 16-char hex string', () => {
    const id = generateTraceId();
    expect(id).toMatch(/^[0-9a-f]{16}$/);
  });

  it('returns unique ids each call', () => {
    const a = generateTraceId();
    const b = generateTraceId();
    expect(a).not.toBe(b);
  });
});

describe('startTrace', () => {
  it('stores a new trace entry', () => {
    const id = startTrace(null, '/api/users', 'GET');
    const trace = getTrace(id);
    expect(trace).not.toBeNull();
    expect(trace.route).toBe('/api/users');
    expect(trace.method).toBe('GET');
    expect(trace.finishedAt).toBeNull();
  });

  it('uses provided traceId when given', () => {
    const id = startTrace('abc123', '/ping', 'get');
    expect(id).toBe('abc123');
    expect(getTrace('abc123')).not.toBeNull();
  });

  it('uppercases the method', () => {
    const id = startTrace(null, '/x', 'post');
    expect(getTrace(id).method).toBe('POST');
  });
});

describe('addSpan', () => {
  it('appends a span to an existing trace', () => {
    const id = startTrace(null, '/items', 'GET');
    addSpan(id, 'db.query', { table: 'items' });
    const trace = getTrace(id);
    expect(trace.spans).toHaveLength(1);
    expect(trace.spans[0].label).toBe('db.query');
    expect(trace.spans[0].table).toBe('items');
  });

  it('does nothing for unknown traceId', () => {
    expect(() => addSpan('nope', 'x')).not.toThrow();
  });
});

describe('finishTrace', () => {
  it('sets finishedAt, durationMs, and statusCode', () => {
    const id = startTrace(null, '/done', 'DELETE');
    const result = finishTrace(id, 204);
    expect(result.finishedAt).toBeGreaterThan(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.statusCode).toBe(204);
  });

  it('returns null for unknown traceId', () => {
    expect(finishTrace('ghost', 200)).toBeNull();
  });
});

describe('getAllTraces', () => {
  it('returns all recorded traces', () => {
    startTrace(null, '/a', 'GET');
    startTrace(null, '/b', 'POST');
    expect(getAllTraces()).toHaveLength(2);
  });

  it('returns empty array after reset', () => {
    startTrace(null, '/a', 'GET');
    resetTraces();
    expect(getAllTraces()).toHaveLength(0);
  });
});
