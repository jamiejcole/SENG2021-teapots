import { Router } from "express";
import healthRoutes from "./health/health.routes";
import invoiceRoutes from "./invoices/invoices.routes"

const router = Router();

// Health
router.use("/health", healthRoutes);
router.use("/invoices", invoiceRoutes);

export default router;