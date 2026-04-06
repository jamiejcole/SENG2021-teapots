import "./loadEnv";
import express from "express";
import cors from "cors";
import v1Router from "./api/v1";
import v2Router from "./api/v2";
import { errorMiddleware } from "./middleware/error.middleware";
import { requestContextMiddleware } from "./middleware/requestContext.middleware";
import { loggerMiddleware } from "./middleware/logger.middleware";
import { getPublicInvoicePdf } from "./api/v2/invoices/invoices.controller";

const app = express();
const isTestEnvironment = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;
const defaultAllowedOrigins = new Set([
  "https://teapotinvoicing.app",
  "https://www.teapotinvoicing.app",
  "https://seng2021.jamiecole.dev",
]);

const envAllowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([...defaultAllowedOrigins, ...envAllowedOrigins]);

const isAllowedOrigin = (origin: string) => {
  if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0):\d+$/.test(origin)) return true;
  if (/^https?:\/\/10\.\d+\.\d+\.\d+:\d+$/.test(origin)) return true;
  if (/^https?:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin)) return true;
  if (/^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+:\d+$/.test(origin)) return true;
  return allowedOrigins.has(origin);
};

// Middleware
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser clients (no Origin header)
      if (!origin) return cb(null, true);

      if (isAllowedOrigin(origin)) return cb(null, true);

      return cb(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization", "x-api-key", "X-News-Admin-Key"],
    exposedHeaders: [
      "X-Invoice-Url",
      "X-Invoice-Pdf-Hash",
      "X-Stored-Invoice-Id",
      "Content-Disposition",
    ],
  })
);
app.use(express.json({ limit: "50mb"}));
app.use(express.text({ type: 'application/xml' , limit: "5mb"}));
app.use(express.urlencoded({ extended: true }));
app.use(requestContextMiddleware);
app.use(loggerMiddleware);

// Public invoice download route for email links.
app.get("/invoices/:invoiceHash.pdf", getPublicInvoicePdf);

// API Routes
app.use("/api/v1", v1Router);
app.use("/api/v2", v2Router);

if (!isTestEnvironment) {
  const swaggerUi = require("swagger-ui-express") as typeof import("swagger-ui-express");
  const { swaggerSpec } = require("./config/swagger") as typeof import("./config/swagger");

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/docs.json", (_, res) => {
    res.json(swaggerSpec);
  });
}

// 404
app.use((req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: "Route not found",
  });
});


// Global error handler
app.use(errorMiddleware);

export default app;