import "./loadEnv";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import v1Router from "./api/v1";
import v2Router from "./api/v2";
import { swaggerSpec } from "./config/swagger";
import { errorMiddleware } from "./middleware/error.middleware";
import { loggerMiddleware } from "./middleware/logger.middleware";

const app = express();

// Middleware
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser clients (no Origin header)
      if (!origin) return cb(null, true);

      // Dev: allow Vite's changing localhost ports (5173, 5174, 5175, etc)
      if (/^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);

      // Allow WSL IP addresses from Windows
      if (/^http:\/\/172\.\d+\.\d+\.\d+:\d+$/.test(origin)) return cb(null, true);

      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization", "x-api-key", "X-News-Admin-Key"],
  })
);
app.use(express.json({ limit: "50mb"}));
app.use(express.text({ type: 'application/xml' , limit: "5mb"}));
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// API Routes
app.use("/api/v1", v1Router);
app.use("/api/v2", v2Router);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (_, res) => {
  res.json(swaggerSpec);
});

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