import { Router } from "express";
import healthRoutes from "./health/health.routes";
import invoiceRoutes from "./invoices/invoices.routes";
import { apiKeyMiddleware } from "../../middleware/apiKey.middleware";
import ordersRouter from "./orders/orders.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/invoices", apiKeyMiddleware, invoiceRoutes);
router.use("/orders", ordersRouter);

export default router;