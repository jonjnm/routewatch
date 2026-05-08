// tracing.js — lightweight request tracing (trace IDs, parent spans, duration tracking)

const { randomBytes } = require('crypto');

let traceStore = {};

function generateTraceId() {
  return randomBytes(8).toString('hex');
}

function startTrace(traceId, route, method) {
  const id = traceId || generateTraceId();
  traceStore[id] = {
    traceId: id,
    route,
    method: method.toUpperCase(),
    startedAt: Date.now(),
    finishedAt: null,
    durationMs: null,
    spans: [],
  };
  return id;
}

function addSpan(traceId, label, meta = {}) {
  const trace = traceStore[traceId];
  if (!trace) return;
  trace.spans.push({
    label,
    timestamp: Date.now(),
    ...meta,
  });
}

function finishTrace(traceId, statusCode) {
  const trace = traceStore[traceId];
  if (!trace) return null;
  trace.finishedAt = Date.now();
  trace.durationMs = trace.finishedAt - trace.startedAt;
  trace.statusCode = statusCode;
  return trace;
}

function getTrace(traceId) {
  return traceStore[traceId] || null;
}

function getAllTraces() {
  return Object.values(traceStore);
}

function resetTraces() {
  traceStore = {};
}

module.exports = {
  generateTraceId,
  startTrace,
  addSpan,
  finishTrace,
  getTrace,
  getAllTraces,
  resetTraces,
};
