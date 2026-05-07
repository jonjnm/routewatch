const { captureReplay, replayRouter } = require('./replayMiddleware');
const { resetReplay, getReplayBuffer } = require('./replay');
const EventEmitter = require('events');

beforeEach(() => resetReplay());

function makeMockReq(overrides = {}) {
  return {
    method: 'GET',
    path: '/api/test',
    headers: { 'x-test': '1' },
    query: {},
    body: null,
    ...overrides,
  };
}

function makeMockRes(statusCode = 200) {
  const emitter = new EventEmitter();
  emitter.statusCode = statusCode;
  emitter.json = jest.fn((data) => data);
  emitter.status = jest.fn(function (code) {
    this.statusCode = code;
    return this;
  });
  return emitter;
}

describe('captureReplay middleware', () => {
  test('records entry on response finish', () => {
    const req = makeMockReq();
    const res = makeMockRes(200);
    const next = jest.fn();

    captureReplay(req, res, next);
    expect(next).toHaveBeenCalled();
    res.emit('finish');

    const buffer = getReplayBuffer();
    expect(buffer).toHaveLength(1);
    expect(buffer[0].method).toBe('GET');
    expect(buffer[0].statusCode).toBe(200);
  });

  test('does not record before finish', () => {
    captureReplay(makeMockReq(), makeMockRes(), jest.fn());
    expect(getReplayBuffer()).toHaveLength(0);
  });
});

describe('replayRouter GET /', () => {
  test('returns empty entries initially', () => {
    const req = makeMockReq({ params: {} });
    const res = makeMockRes();
    replayRouter.handle({ method: 'GET', url: '/', path: '/' }, res, jest.fn());
  });
});

describe('replayRouter GET /:id', () => {
  test('returns 400 for non-numeric id', () => {
    const req = { method: 'GET', url: '/abc', path: '/abc', params: { id: 'abc' } };
    const res = makeMockRes();
    const next = jest.fn();
    replayRouter.handle(req, res, next);
    // handler sets 400 via res.status
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });
});
