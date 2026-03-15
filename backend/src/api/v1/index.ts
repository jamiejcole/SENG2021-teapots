import { Router } from "express";
import healthRoutes from "./health/health.routes";
import invoiceRoutes from "./invoices/invoices.routes";
import orderRoutes from "./orders/orders.routes";
import { apiKeyMiddleware } from "../../middleware/apiKey.middleware";

const router = Router();

router.use("/health", healthRoutes);
router.use("/invoices", apiKeyMiddleware, invoiceRoutes);
router.use("/orders", apiKeyMiddleware, orderRoutes);

export default router;