import { Router } from "express";
import healthRoutes from "./health/health.routes";
import serviceRoute from "./service/service.routes";

const router = Router();

router.use("", serviceRoute)
router.use("/health", healthRoutes);

export default router;