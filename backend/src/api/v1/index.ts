import { Router } from "express";
import healthRoutes from "./health/health.routes";

const router = Router();

// Health
router.use("/health", healthRoutes);

export default router;