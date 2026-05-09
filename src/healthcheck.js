"use strict";

const { getSummary } = require("./reporter");
const { getAnomalyState } = require("./anomaly");
const { getAlertState } = require("./alerting");

let _startTime = Date.now();

function resetHealthcheck() {
  _startTime = Date.now();
}

function getUptime() {
  return Math.floor((Date.now() - _startTime) / 1000);
}

function buildHealthReport() {
  const summary = getSummary();
  const anomalyState = getAnomalyState();
  const alertState = getAlertState();

  const totalHits = Object.values(summary).reduce((sum, r) => sum + r.hits, 0);
  const routeCount = Object.keys(summary).length;

  const activeAnomalies = Object.entries(anomalyState)
    .filter(([, v]) => v.anomalous)
    .map(([route]) => route);

  const firedAlerts = Object.entries(alertState)
    .filter(([, v]) => v.fired)
    .map(([route]) => route);

  const status =
    activeAnomalies.length > 0 || firedAlerts.length > 0 ? "degraded" : "ok";

  return {
    status,
    uptime: getUptime(),
    routeCount,
    totalHits,
    activeAnomalies,
    firedAlerts,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { buildHealthReport, getUptime, resetHealthcheck };
