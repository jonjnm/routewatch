"use strict";

const { Router } = require("express");
const { buildHealthReport } = require("./healthcheck");

const router = Router();

router.get("/healthcheck", (req, res) => {
  const report = buildHealthReport();
  const statusCode = report.status === "ok" ? 200 : 503;
  res.status(statusCode).json(report);
});

router.get("/healthcheck/ping", (req, res) => {
  res.status(200).json({ pong: true, timestamp: new Date().toISOString() });
});

function healthcheckRouter(options = {}) {
  const { prefix = "/__routewatch" } = options;
  const prefixedRouter = Router();
  prefixedRouter.use(prefix, router);
  return prefixedRouter;
}

module.exports = { healthcheckRouter };
