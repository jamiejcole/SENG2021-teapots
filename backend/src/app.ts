import express from "express";
import swaggerUi from "swagger-ui-express";
// import xmlparser from "express-xml-bodyparser";
import v1Router from "./api/v1";
import { swaggerSpec } from "./config/swagger";
import { errorMiddleware } from "./middleware/error.middleware";
import { loggerMiddleware } from "./middleware/logger.middleware";

const app = express();

// Middleware
app.use(express.json());
app.use(express.text({ type: 'application/xml' }));
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

// API Routes
app.use("/api/v1", v1Router);
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