/**
 * replay.js
 * Store and replay recent API requests for debugging.
 */

const MAX_ENTRIES = 100;

let replayBuffer = [];

/**
 * Record a request snapshot into the replay buffer.
 * @param {object} entry
 */
function recordReplay(entry) {
  replayBuffer.push({
    id: replayBuffer.length + 1,
    timestamp: entry.timestamp || new Date().toISOString(),
    method: entry.method,
    path: entry.path,
    statusCode: entry.statusCode,
    duration: entry.duration,
    headers: entry.headers || {},
    query: entry.query || {},
    body: entry.body || null,
  });

  if (replayBuffer.length > MAX_ENTRIES) {
    replayBuffer.shift();
  }
}

/**
 * Return all buffered replay entries.
 * @returns {object[]}
 */
function getReplayBuffer() {
  return [...replayBuffer];
}

/**
 * Return a single replay entry by id.
 * @param {number} id
 * @returns {object|undefined}
 */
function getReplayEntry(id) {
  return replayBuffer.find((e) => e.id === id);
}

/**
 * Clear the replay buffer.
 */
function resetReplay() {
  replayBuffer = [];
}

module.exports = { recordReplay, getReplayBuffer, getReplayEntry, resetReplay };
