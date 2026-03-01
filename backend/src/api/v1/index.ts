import { Router } from "express";
import healthRoutes from "./health/health.routes";
import serviceRoute from "./service/service.routes";
import invoiceRoutes from "./invoices/invoices.routes"

const router = Router();

router.use("", serviceRoute)
router.use("/health", healthRoutes);
router.use("/invoices", invoiceRoutes);

export default router;