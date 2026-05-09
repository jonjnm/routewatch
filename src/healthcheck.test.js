"use strict";

const { buildHealthReport, getUptime, resetHealthcheck } = require("./healthcheck");
const reporter = require("./reporter");
const anomaly = require("./anomaly");
const alerting = require("./alerting");

beforeEach(() => {
  reporter.resetStats();
  anomaly.resetAnomaly();
  alerting.resetAlerts();
  resetHealthcheck();
});

describe("getUptime", () => {
  it("returns a non-negative number of seconds", () => {
    const uptime = getUptime();
    expect(typeof uptime).toBe("number");
    expect(uptime).toBeGreaterThanOrEqual(0);
  });
});

describe("buildHealthReport", () => {
  it("returns ok status when no anomalies or alerts", () => {
    const report = buildHealthReport();
    expect(report.status).toBe("ok");
    expect(report.activeAnomalies).toEqual([]);
    expect(report.firedAlerts).toEqual([]);
  });

  it("includes routeCount and totalHits from reporter", () => {
    reporter.recordHit("GET", "/api/users");
    reporter.recordHit("GET", "/api/users");
    reporter.recordHit("POST", "/api/items");
    const report = buildHealthReport();
    expect(report.routeCount).toBe(2);
    expect(report.totalHits).toBe(3);
  });

  it("includes a valid ISO timestamp", () => {
    const report = buildHealthReport();
    expect(() => new Date(report.timestamp)).not.toThrow();
    expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("reflects uptime in report", () => {
    const report = buildHealthReport();
    expect(report.uptime).toBeGreaterThanOrEqual(0);
  });

  it("returns degraded status when anomaly is active", () => {
    anomaly.configureAnomaly({ multiplier: 1 });
    anomaly.updateBaseline("GET /api/test", 5);
    for (let i = 0; i < 20; i++) anomaly.recordWindowHit("GET /api/test");
    const report = buildHealthReport();
    expect(report.status).toBe("degraded");
    expect(report.activeAnomalies).toContain("GET /api/test");
  });
});
