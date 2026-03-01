import express from "express";
// import xmlparser from "express-xml-bodyparser";
import v1Router from "./api/v1";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

// Middleware
app.use(express.json());
app.use(express.text({ type: 'application/xml' }));
app.use(express.urlencoded({ extended: true }));

// XML Parsing
// app.use(xmlparser({
//   explicitArray: false,
//   trim: true
// }))

// API Routes
app.use("/api/v1", v1Router);

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