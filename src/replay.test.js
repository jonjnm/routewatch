const {
  recordReplay,
  getReplayBuffer,
  getReplayEntry,
  resetReplay,
} = require('./replay');

beforeEach(() => {
  resetReplay();
});

describe('recordReplay', () => {
  test('stores a request entry', () => {
    recordReplay({ method: 'GET', path: '/api/users', statusCode: 200, duration: 12 });
    const buffer = getReplayBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].method).toBe('GET');
    expect(buffer[0].path).toBe('/api/users');
    expect(buffer[0].statusCode).toBe(200);
  });

  test('assigns incremental ids', () => {
    recordReplay({ method: 'GET', path: '/a', statusCode: 200 });
    recordReplay({ method: 'POST', path: '/b', statusCode: 201 });
    const buffer = getReplayBuffer();
    expect(buffer[0].id).toBe(1);
    expect(buffer[1].id).toBe(2);
  });

  test('caps buffer at 100 entries', () => {
    for (let i = 0; i < 105; i++) {
      recordReplay({ method: 'GET', path: `/r/${i}`, statusCode: 200 });
    }
    expect(getReplayBuffer()).toHaveLength(100);
  });

  test('defaults missing fields', () => {
    recordReplay({ method: 'DELETE', path: '/x', statusCode: 204 });
    const entry = getReplayBuffer()[0];
    expect(entry.headers).toEqual({});
    expect(entry.query).toEqual({});
    expect(entry.body).toBeNull();
  });
});

describe('getReplayEntry', () => {
  test('returns entry by id', () => {
    recordReplay({ method: 'GET', path: '/find-me', statusCode: 200 });
    const entry = getReplayEntry(1);
    expect(entry).toBeDefined();
    expect(entry.path).toBe('/find-me');
  });

  test('returns undefined for unknown id', () => {
    expect(getReplayEntry(999)).toBeUndefined();
  });
});

describe('resetReplay', () => {
  test('clears all entries', () => {
    recordReplay({ method: 'GET', path: '/x', statusCode: 200 });
    resetReplay();
    expect(getReplayBuffer()).toHaveLength(0);
  });
});
