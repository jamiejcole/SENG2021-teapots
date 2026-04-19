import { Router } from "express";
import authRoutes from "./auth/auth.routes";
import invoiceRoutes from "./invoices/invoices.routes";
import orderRoutes from "./orders/orders.routes";
import despatchRoutes from "./despatch/despatch.routes";
import aiRoutes from "./ai/ai.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/orders", orderRoutes);
router.use("/despatch", despatchRoutes);
router.use("/ai", aiRoutes);

export default router;
